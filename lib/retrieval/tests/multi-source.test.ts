import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createRetrievalContext } from "@/lib/retrieval/retrieval-context";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { createRetrievalQuery } from "@/lib/retrieval/retrieval-query";
import { rankChunks } from "@/lib/retrieval/retrieval-ranker";
import {
  MULTI_SOURCE_FAQ,
  MULTI_SOURCE_MAINTENANCE_GUIDE,
  MULTI_SOURCE_MANUAL,
} from "@/lib/retrieval/tests/multi-source-fixtures";
import type { VisitorSession } from "@/lib/session/session-types";

function session(): VisitorSession {
  return {
    sessionId: "multi-source-test",
    createdAt: "2026-07-29T00:00:00.000Z",
    lastInteraction: "2026-07-29T00:00:00.000Z",
    status: "active",
    currentConversationStage: "DISCOVERY",
    currentIntent: "SUPPORT",
    language: "en",
    discussedTopics: [],
    viewedProducts: ["advanced"],
    questionsAsked: [],
    visitorGoals: [],
    conversationHistory: [],
    completedConversation: false,
    endedAt: null,
  };
}

async function setup() {
  const root = await mkdtemp(path.join(os.tmpdir(), "multi-source-"));
  await mkdir(path.join(root, "products"), { recursive: true });
  await mkdir(path.join(root, "support"), { recursive: true });
  await writeFile(
    path.join(root, "products", "manual.md"),
    MULTI_SOURCE_MANUAL,
  );
  await writeFile(
    path.join(root, "support", "maintenance.md"),
    MULTI_SOURCE_MAINTENANCE_GUIDE,
  );
  await writeFile(
    path.join(root, "support", "faq.md"),
    MULTI_SOURCE_FAQ,
  );
  const loader = new ApprovedKnowledgeLoader(root);

  return {
    loader,
    engine: new RetrievalEngine(loader),
  };
}

test("approved documents expose normalized multi-source metadata", async () => {
  const { loader } = await setup();
  const documents = await loader.load();
  const byType = new Map(
    documents.map((document) => [document.documentType, document]),
  );

  assert.equal(byType.get("manual")?.sourcePriority, 500);
  assert.equal(byType.get("technical-specifications"), undefined);
  assert.equal(byType.get("maintenance-guide")?.sourcePriority, 300);
  assert.equal(byType.get("product-faq")?.sourcePriority, 220);
  assert.deepEqual(byType.get("maintenance-guide")?.topics, [
    "cleaning",
    "maintenance",
    "product",
  ]);
  assert.equal(byType.get("manual")?.sourceVersion, "1.0");
  assert.equal(byType.get("manual")?.language, "en");
  assert.equal(byType.get("manual")?.approvalStatus, "approved");
});

test("one query retrieves complementary sections from multiple approved documents", async () => {
  const { engine } = await setup();
  const query = createRetrievalQuery({
    message: "How do I charge and clean the Advanced Bottle?",
    session: session(),
  });
  const result = await engine.search(query);
  const context = createRetrievalContext(result);
  const references = new Set(result.sourceReferences);

  assert.equal(result.insufficientKnowledge, false);
  assert.ok(references.has("ADVANCED-MANUAL-TEST-001-CHARGING"));
  assert.ok(references.has("ADVANCED-MAINTENANCE-TEST-001-CLEANING"));
  assert.ok(
    context.passages.some(
      (passage) =>
        passage.documentType === "manual" &&
        passage.sourcePriority === 500,
    ),
  );
  assert.ok(
    context.passages.some(
      (passage) =>
        passage.documentType === "maintenance-guide" &&
        passage.sourcePriority === 300,
    ),
  );
});

test("source authority metadata does not alter relevance scores", async () => {
  const { loader } = await setup();
  const documents = await loader.load();
  const { RetrievalIndex } = await import(
    "@/lib/retrieval/retrieval-index"
  );
  const chunks = new RetrievalIndex(documents).chunks.filter(
    (chunk) => chunk.heading === "Charging",
  );
  const query = createRetrievalQuery({
    message: "How do I charge the Advanced Bottle?",
    session: session(),
  });
  const ranked = rankChunks(query, chunks);
  const manual = ranked.find(
    ({ chunk }) => chunk.documentType === "manual",
  );
  const faq = ranked.find(
    ({ chunk }) => chunk.documentType === "product-faq",
  );

  assert.ok(manual);
  assert.ok(faq);
  assert.equal(manual.score, faq.score);
  assert.notEqual(manual.chunk.sourcePriority, faq.chunk.sourcePriority);
});

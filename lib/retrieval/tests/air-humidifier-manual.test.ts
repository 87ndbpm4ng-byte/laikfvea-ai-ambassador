import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { exhibitionProducts } from "@/lib/data/exhibition-products";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import { createRetrievalQuery } from "@/lib/retrieval/retrieval-query";
import type { VisitorSession } from "@/lib/session/session-types";

const loader = new ApprovedKnowledgeLoader(path.join(process.cwd(), "knowledge"));
const engine = new RetrievalEngine(loader);

function session(overrides: Partial<VisitorSession> = {}): VisitorSession {
  return {
    sessionId: "air-humidifier-test",
    createdAt: "2026-09-29T00:00:00.000Z",
    lastInteraction: "2026-09-29T00:00:00.000Z",
    status: "active",
    currentConversationStage: "DISCOVERY",
    currentIntent: "SUPPORT",
    language: "en",
    discussedTopics: [],
    viewedProducts: [],
    questionsAsked: [],
    visitorGoals: [],
    conversationHistory: [],
    completedConversation: false,
    endedAt: null,
    ...overrides,
  };
}

async function search(message: string, overrides: Partial<VisitorSession> = {}) {
  const query = createRetrievalQuery({ message, session: session(overrides) });
  return { query, result: await engine.search(query) };
}

test("the approved Air Humidifier manual is indexed under its own product identity", async () => {
  const document = (await loader.load()).find(
    ({ sourceId }) => sourceId === "AIR-HUMIDIFIER-MANUAL-001",
  );
  assert.ok(document);
  assert.equal(document.product, "air-humidifier");
  assert.equal(document.sourcePriority, 500);
  assert.equal(exhibitionProducts["air-humidifier"].knowledgeStatus, "approved");
});

test("Air Humidifier setup, controls, maintenance, safety, troubleshooting and specifications retrieve its manual", async () => {
  for (const question of [
    "How do I set up the Air Humidifier?",
    "What mist modes does the Air Humidifier have?",
    "How do I clean the Air Humidifier?",
    "What are the Air Humidifier safety restrictions?",
    "Why is the Air Humidifier not producing mist?",
    "What are the Air Humidifier specifications?",
  ]) {
    const { query, result } = await search(question);
    assert.equal(query.activeProduct, "air-humidifier", question);
    assert.equal(result.insufficientKnowledge, false, question);
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, "AIR-HUMIDIFIER-MANUAL-001", question);
    assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === "air-humidifier"), question);
  }
});

test("Air Humidifier follow-ups retain context without leaking to the Air Purifier", async () => {
  for (const question of ["How do I clean it?", "What timer does it have?"]) {
    const { query, result } = await search(question, {
      activeProduct: "air-humidifier",
      viewedProducts: ["air-humidifier"],
      conversationHistory: [
        { role: "user", content: "Tell me about the Air Humidifier." },
      ],
    });
    assert.equal(query.activeProduct, "air-humidifier", question);
    assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === "air-humidifier"), question);
  }
});

test("the manual excludes medical and unsupported room-treatment claims", async () => {
  const manual = (await loader.load()).find(
    ({ sourceId }) => sourceId === "AIR-HUMIDIFIER-MANUAL-001",
  );
  assert.ok(manual);
  for (const unsupported of ["treats disease", "prevents infection", "improves sleep", "sterilizes the room"]) {
    assert.doesNotMatch(manual.content, new RegExp(unsupported, "i"));
  }
  for (const placeholder of ["YOUR LOGO", "YOUR WEBSITE", "YOUR PHONE", "YOUR EMAIL", "YOUR QR CODE"]) {
    assert.doesNotMatch(manual.content, new RegExp(placeholder, "i"));
  }
});

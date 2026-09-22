import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  exhibitionProducts,
  resolveProductFromText,
} from "@/lib/data/exhibition-products";
import { createRetrievalQuery } from "@/lib/retrieval/retrieval-query";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { SessionManager } from "@/lib/session/session-manager";
import { InMemorySessionStore } from "@/lib/session/session-store";
import type { VisitorSession } from "@/lib/session/session-types";
import type { ProductId } from "@/types/product";

function session(overrides: Partial<VisitorSession> = {}): VisitorSession {
  return {
    sessionId: "alias-test",
    createdAt: "2026-08-17T00:00:00.000Z",
    lastInteraction: "2026-08-17T00:00:00.000Z",
    status: "active",
    currentConversationStage: "DISCOVERY",
    currentIntent: null,
    activeProduct: null,
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

test("curated high-confidence English aliases resolve to stable product IDs", () => {
  const cases: readonly [string, ProductId][] = [
    ["How does the water ioniser work?", "water-ionizer"],
    ["Tell me about the water ionizr.", "water-ionizer"],
    ["Is this a water ionizer machine?", "water-ionizer"],
    ["Tell me about the water mineraliser.", "water-mineralizer"],
    ["What is the water minerlizer?", "water-mineralizer"],
    ["Tell me about the mineraliser.", "water-mineralizer"],
    ["How does the air purifer work?", "air-purifier"],
    ["Tell me about the air purifyer.", "air-purifier"],
    ["Show me the air cleaner.", "air-purifier"],
    ["Tell me about the face and body generator.", "face-body-generator"],
    ["How does the face body generator work?", "face-body-generator"],
    ["Show me the hydrogen face generator.", "face-body-generator"],
    ["What does the GO bottle do?", "everyday"],
    ["Tell me about the hydrogen GO bottle.", "everyday"],
    ["Tell me about the PRO bottle.", "advanced"],
    ["Show me the PRO hydrogen bottle.", "advanced"],
  ];

  for (const [message, expected] of cases) {
    assert.equal(resolveProductFromText(message), expected, message);
    assert.equal(createRetrievalQuery({ message, session: session() }).activeProduct, expected, message);
  }
});

test("ambiguous generic terms never select a product", () => {
  for (const message of [
    "generator",
    "hydrogen generator",
    "face generator",
    "face & body device",
    "water",
    "bottle",
    "filter",
    "purifier",
    "mineralisation",
    "mineralization",
  ]) {
    assert.equal(resolveProductFromText(message), null, message);
  }

  assert.equal(resolveProductFromText("Compare the GO bottle and PRO bottle"), null);
});

test("exact names and localized display identities retain six-product routing", () => {
  for (const product of Object.values(exhibitionProducts)) {
    assert.equal(resolveProductFromText(product.exhibitionName), product.id);
    for (const displayName of Object.values(product.displayNames)) {
      assert.equal(resolveProductFromText(displayName), product.id, displayName);
    }
  }
});

test("a typo-resolved server product remains authoritative for a follow-up", () => {
  const manager = new SessionManager({ store: new InMemorySessionStore() });
  const first = manager.createSession({ language: "en" });
  const switched = manager.recordVisitorMessage(first.sessionId, {
    content: "Tell me about the air purifer.",
  });
  assert.equal(switched.activeProduct, "air-purifier");

  const followUp = manager.recordVisitorMessage(first.sessionId, {
    content: "How does it work?",
  });
  assert.equal(followUp.activeProduct, "air-purifier");
});

test("typo retrieval remains isolated to the resolved product source", async () => {
  const engine = new RetrievalEngine(
    new ApprovedKnowledgeLoader(path.join(process.cwd(), "knowledge")),
  );
  const cases: readonly [string, ProductId, string][] = [
    ["How does the water ioniser work?", "water-ionizer", "WATER-IONIZER-MANUAL-001"],
    ["How does the air purifer work?", "air-purifier", "AIR-PURIFIER-MANUAL-001"],
    ["How do I use the mineraliser?", "water-mineralizer", "WATER-MINERALIZER-MANUAL-001"],
    ["How does the face body generator work?", "face-body-generator", "FACE-BODY-GENERATOR-MANUAL-001"],
    ["How does the GO bottle work?", "everyday", "GO-BOTTLE-MANUAL-001"],
    ["How does the PRO bottle work?", "advanced", "ADVANCED-BOTTLE-MANUAL-001"],
  ];

  for (const [message, productId, sourceId] of cases) {
    const query = createRetrievalQuery({ message, session: session() });
    const result = await engine.search(query);
    assert.equal(query.activeProduct, productId, message);
    assert.equal(result.insufficientKnowledge, false, message);
    assert.ok(result.matchedChunks.length > 0, message);
    assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === productId), message);
    assert.ok(result.matchedChunks.some(({ chunk }) => chunk.sourceId === sourceId), message);
  }
});

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
    sessionId: "air-purifier-test",
    createdAt: "2026-08-13T00:00:00.000Z",
    lastInteraction: "2026-08-13T00:00:00.000Z",
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

test("approved Air Purifier manual is indexed under air-purifier", async () => {
  const document = (await loader.load()).find(({ sourceId }) => sourceId === "AIR-PURIFIER-MANUAL-001");
  assert.ok(document);
  assert.equal(document.product, "air-purifier");
  assert.equal(document.approvalStatus, "approved");
  assert.equal(exhibitionProducts["air-purifier"].knowledgeStatus, "approved");
  assert.equal(exhibitionProducts["water-mineralizer"].knowledgeStatus, "approved");
});

test("purpose, mechanism, coverage, filter, operation, maintenance, specifications and safety retrieve approved evidence", async () => {
  const questions = [
    "What does the Air Purifier do?",
    "How does the Air Purifier work?",
    "How large a room can the Air Purifier cover?",
    "Does the Air Purifier have a filter?",
    "How do I use the Air Purifier?",
    "How do I clean the Air Purifier?",
    "What are the Air Purifier specifications?",
    "What are the Air Purifier safety restrictions?",
  ];
  for (const question of questions) {
    const { query, result } = await search(question);
    assert.equal(query.activeProduct, "air-purifier", question);
    assert.equal(result.insufficientKnowledge, false, question);
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, "AIR-PURIFIER-MANUAL-001", question);
  }
});

test("five languages resolve natural Air Purifier questions to the same source", async () => {
  const cases: Array<[VisitorSession["language"], string]> = [
    ["en", "How do I clean the Air Purifier?"],
    ["ru", "Как чистить очиститель воздуха?"],
    ["zh", "如何清洁空气净化器？"],
    ["yue", "空氣淨化器點樣清潔？"],
    ["fr", "Comment nettoyer le purificateur d’air ?"],
  ];
  for (const [language, question] of cases) {
    const { query, result } = await search(question, { language });
    assert.equal(query.activeProduct, "air-purifier", language);
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, "AIR-PURIFIER-MANUAL-001", language);
  }
});

test("Air Purifier follow-ups and product-explorer context retain identity", async () => {
  for (const question of ["How does it work?", "How do I clean it?"]) {
    const { query, result } = await search(question, {
      activeProduct: "air-purifier",
      viewedProducts: ["air-purifier"],
      conversationHistory: [
        { role: "user", content: "Tell me about the Air Purifier." },
        { role: "assistant", content: "It is the Capsula M Size model." },
      ],
    });
    assert.equal(query.activeProduct, "air-purifier");
    assert.equal(result.matchedChunks[0]?.chunk.product, "air-purifier");
  }
});

test("Air Purifier evidence remains isolated from water products", async () => {
  const { result } = await search("Does the Air Purifier have a filter?");
  assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === "air-purifier"));
  for (const [question, product] of [
    ["How long does GO take?", "everyday"],
    ["How does PRO hydrogen inhalation work?", "advanced"],
    ["What pH does the Water Ionizer produce?", "water-ionizer"],
    ["How long is one Face & Body Generator spray?", "face-body-generator"],
  ] as const) {
    const other = await search(question);
    assert.equal(other.result.matchedChunks[0]?.chunk.product, product, question);
    assert.ok(other.result.matchedChunks.every(({ chunk }) => chunk.product !== "air-purifier"), question);
  }
});

test("unsupported performance, filter and health claims remain absent", async () => {
  const approved = (await loader.load())
    .filter(({ product }) => product === "air-purifier")
    .map(({ content }) => content)
    .join("\n");
  for (const unsupported of ["kills viruses", "improves asthma", "HEPA filter", "CADR:", "99.9%"])
    assert.doesNotMatch(approved, new RegExp(unsupported, "i"));
  for (const question of [
    "What percentage of viruses does the Air Purifier remove?",
    "What is the Air Purifier CADR?",
    "Does the Air Purifier improve asthma?",
  ]) {
    const { result } = await search(question);
    assert.ok(result.matchedChunks.every(({ chunk }) => !/kills viruses|improves asthma|CADR\s*[:|]|99\.9%/i.test(chunk.text)));
  }
});

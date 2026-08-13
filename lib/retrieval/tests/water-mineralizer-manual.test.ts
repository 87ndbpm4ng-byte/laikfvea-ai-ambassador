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
    sessionId: "water-mineralizer-test",
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

test("approved standalone Water Mineralizer manual is indexed under water-mineralizer", async () => {
  const document = (await loader.load()).find(({ sourceId }) => sourceId === "WATER-MINERALIZER-MANUAL-001");
  assert.ok(document);
  assert.equal(document.product, "water-mineralizer");
  assert.equal(document.approvalStatus, "approved");
  assert.equal(exhibitionProducts["water-mineralizer"].knowledgeStatus, "approved");
  assert.ok(Object.values(exhibitionProducts).every(({ knowledgeStatus }) => knowledgeStatus === "approved"));
});

test("purpose, composition, use, storage, safety and numerical facts retrieve standalone evidence", async () => {
  const questions = [
    "What is the Water Mineralizer?",
    "What does the Water Mineralizer do?",
    "How do I use the Water Mineralizer?",
    "What minerals does the Water Mineralizer add?",
    "How much water can the Water Mineralizer prepare?",
    "What are the Water Mineralizer restrictions?",
  ];
  for (const question of questions) {
    const { query, result } = await search(question);
    assert.equal(query.activeProduct, "water-mineralizer", question);
    assert.equal(result.insufficientKnowledge, false, question);
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, "WATER-MINERALIZER-MANUAL-001", question);
  }
  const approved = (await loader.load()).find(({ sourceId }) => sourceId === "WATER-MINERALIZER-MANUAL-001")?.content ?? "";
  for (const fact of ["1:1500", "2 mL", "20-30 g/L", "10-15 g/L", "6-8 g/L", "12 months"])
    assert.match(approved, new RegExp(fact.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("five languages resolve Water Mineralizer identity to one authoritative source", async () => {
  const cases: Array<[VisitorSession["language"], string]> = [
    ["en", "How do I use the Water Mineralizer?"],
    ["ru", "Как использовать минерализатор воды?"],
    ["zh", "水矿化器怎么使用？"],
    ["yue", "水礦化器點樣用？"],
    ["fr", "Comment utiliser le minéralisateur d’eau ?"],
  ];
  for (const [language, question] of cases) {
    const { query, result } = await search(question, { language });
    assert.equal(query.activeProduct, "water-mineralizer", language);
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, "WATER-MINERALIZER-MANUAL-001", language);
  }
});

test("follow-ups and Product Explorer context retain standalone Water Mineralizer identity", async () => {
  for (const question of ["How does it work?", "How do I use it?", "What minerals does it contain?", "What are its restrictions?"]) {
    const { query, result } = await search(question, {
      activeProduct: "water-mineralizer",
      viewedProducts: ["water-mineralizer"],
      conversationHistory: [
        { role: "user", content: "Tell me about the Water Mineralizer." },
        { role: "assistant", content: "It is the standalone Severyanka mineral additive." },
      ],
    });
    assert.equal(query.activeProduct, "water-mineralizer");
    assert.equal(result.matchedChunks[0]?.chunk.product, "water-mineralizer", question);
  }
});

test("standalone Water Mineralizer and PRO mineralisation remain isolated", async () => {
  const standalone = await search("How do I use the standalone Water Mineralizer?");
  assert.ok(standalone.result.matchedChunks.every(({ chunk }) => chunk.product === "water-mineralizer"));

  const pro = await search("How do I use PRO mineralisation?");
  assert.equal(pro.query.activeProduct, "advanced");
  assert.equal(pro.result.matchedChunks[0]?.chunk.product, "advanced");
  assert.ok(pro.result.matchedChunks.every(({ chunk }) => chunk.product !== "water-mineralizer"));

  const go = await search("Does GO have mineralisation?");
  assert.equal(go.query.activeProduct, "everyday");
  assert.ok(go.result.matchedChunks.every(({ chunk }) => chunk.product !== "water-mineralizer"));
});

test("other product evidence remains isolated", async () => {
  for (const [question, product] of [
    ["How long does GO take?", "everyday"],
    ["How does PRO hydrogen inhalation work?", "advanced"],
    ["What pH does the Water Ionizer produce?", "water-ionizer"],
    ["How long is one Face & Body Generator spray?", "face-body-generator"],
    ["Does the Air Purifier have a pre-filter?", "air-purifier"],
  ] as const) {
    const other = await search(question);
    assert.equal(other.result.matchedChunks[0]?.chunk.product, product, question);
    assert.ok(other.result.matchedChunks.every(({ chunk }) => chunk.product !== "water-mineralizer"), question);
  }
});

test("withheld claims and unsupported hardware facts do not become approved evidence", async () => {
  const approved = (await loader.load())
    .filter(({ product }) => product === "water-mineralizer")
    .map(({ content }) => content)
    .join("\n");
  for (const claim of ["treats disease", "detoxifies", "improves immunity", "prevents illness"])
    assert.doesNotMatch(approved, new RegExp(claim, "i"));
  for (const question of [
    "What is the Water Mineralizer charging time?",
    "What is the Water Mineralizer warranty?",
    "What final pH does the Water Mineralizer guarantee?",
  ]) {
    const { result } = await search(question);
    assert.ok(result.matchedChunks.every(({ chunk }) => !/charging time|warranty|guaranteed final pH/i.test(chunk.text)), question);
  }
});

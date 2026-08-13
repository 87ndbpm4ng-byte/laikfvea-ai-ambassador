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
    sessionId: "face-body-generator-test",
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

test("approved Face & Body Generator manual is indexed under its stable identity", async () => {
  const document = (await loader.load()).find(
    ({ sourceId }) => sourceId === "FACE-BODY-GENERATOR-MANUAL-001",
  );
  assert.ok(document);
  assert.equal(document.product, "face-body-generator");
  assert.equal(document.approvalStatus, "approved");
  assert.equal(exhibitionProducts["face-body-generator"].knowledgeStatus, "approved");
});

test("core operation, usage, duration, water, cleaning, specifications and safety retrieve the manual", async () => {
  const questions = [
    "What is the Face & Body Generator?",
    "How does the Face & Body Generator work?",
    "How do I use the Face & Body Generator?",
    "How often can I use the Face & Body Generator?",
    "How long should I use the Face & Body Generator?",
    "What water does the Face & Body Generator use?",
    "How do I clean the Face & Body Generator?",
    "What are the Face & Body Generator specifications?",
    "Are there restrictions for the Face & Body Generator?",
  ];
  for (const question of questions) {
    const { query, result } = await search(question);
    assert.equal(query.activeProduct, "face-body-generator", question);
    assert.equal(result.insufficientKnowledge, false, question);
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, "FACE-BODY-GENERATOR-MANUAL-001", question);
  }
});

test("five languages resolve to the same approved source", async () => {
  const cases: Array<[VisitorSession["language"], string]> = [
    ["en", "How do I use the Face & Body Generator?"],
    ["ru", "Как использовать генератор водородной воды для лица и тела?"],
    ["zh", "如何使用面部及身体用氢水生成器？"],
    ["yue", "面部及身體用氫水生成器點樣用？"],
    ["fr", "Comment utiliser le générateur d’eau hydrogénée pour le visage et le corps ?"],
  ];
  for (const [language, question] of cases) {
    const { query, result } = await search(question, { language });
    assert.equal(query.activeProduct, "face-body-generator", language);
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, "FACE-BODY-GENERATOR-MANUAL-001", language);
  }
});

test("follow-ups retain Face & Body Generator context", async () => {
  for (const question of ["How do I use it?", "How often can I use it?"]) {
    const { query, result } = await search(question, {
      activeProduct: "face-body-generator",
      viewedProducts: ["face-body-generator"],
      conversationHistory: [
        { role: "user", content: "Tell me about the Face & Body Generator." },
        { role: "assistant", content: "It is a portable skin-care water sprayer." },
      ],
    });
    assert.equal(query.activeProduct, "face-body-generator");
    assert.equal(result.matchedChunks[0]?.chunk.product, "face-body-generator");
  }
});

test("reservoir-capacity follow-up retrieves the documented 15 mL specification", async () => {
  const { query, result } = await search("What is its reservoir capacity?", {
    activeProduct: "face-body-generator",
    viewedProducts: ["face-body-generator"],
  });
  assert.equal(query.activeProduct, "face-body-generator");
  assert.equal(result.matchedChunks[0]?.chunk.sourceId, "FACE-BODY-GENERATOR-MANUAL-001");
  assert.match(result.matchedChunks[0]?.chunk.text ?? "", /15 mL/);
});

test("Face & Body Generator evidence stays isolated from every other product", async () => {
  const { result } = await search("How does the Face & Body Generator work?");
  assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === "face-body-generator"));

  const otherCases = [
    ["How does PRO hydrogen inhalation work?", "advanced"],
    ["How long does GO take?", "everyday"],
    ["What pH does the Water Ionizer produce?", "water-ionizer"],
  ] as const;
  for (const [question, product] of otherCases) {
    const other = await search(question);
    assert.equal(other.result.matchedChunks[0]?.chunk.product, product, question);
    assert.ok(other.result.matchedChunks.every(({ chunk }) => chunk.product !== "face-body-generator"), question);
  }
  assert.equal(exhibitionProducts["water-mineralizer"].knowledgeStatus, "approved");
  assert.equal(exhibitionProducts["air-purifier"].knowledgeStatus, "approved");
});

test("withheld claims and unsupported facts are absent from approved evidence", async () => {
  const approved = (await loader.load())
    .filter(({ product }) => product === "face-body-generator")
    .map(({ content }) => content)
    .join("\n");
  for (const forbidden of [
    "neutralizing free radicals",
    "acne and other skin conditions",
    "improves skin texture",
    "protect skin from ultraviolet",
  ]) {
    assert.doesNotMatch(approved, new RegExp(forbidden, "i"));
  }
  const { result } = await search("How much does the Face & Body Generator weigh?");
  assert.ok(result.matchedChunks.every(({ chunk }) => !/weight\s*[:|]/i.test(chunk.text)));
});

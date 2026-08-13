import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { createRetrievalQuery } from "@/lib/retrieval/retrieval-query";
import type { VisitorSession } from "@/lib/session/session-types";

const knowledgeRoot = path.join(process.cwd(), "knowledge");
const loader = new ApprovedKnowledgeLoader(knowledgeRoot);
const engine = new RetrievalEngine(loader);

function session(overrides: Partial<VisitorSession> = {}): VisitorSession {
  return {
    sessionId: "go-manual-test",
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

test("the approved GO manual is indexed under the stable everyday identity", async () => {
  const documents = await loader.load();
  const go = documents.find(({ sourceId }) => sourceId === "GO-BOTTLE-MANUAL-001");
  assert.ok(go);
  assert.equal(go.product, "everyday");
  assert.equal(go.approvalStatus, "approved");
  assert.match(go.content, /1300–1500 ppb/);
  assert.match(go.content, /about 5 minutes/);
});

test("GO cycle and concentration questions retrieve only GO evidence", async () => {
  for (const question of [
    "How long does GO take to make hydrogen water?",
    "What is the hydrogen concentration of GO?",
  ]) {
    const { query, result } = await search(question);
    assert.equal(query.activeProduct, "everyday", question);
    assert.equal(result.insufficientKnowledge, false, question);
    assert.equal(result.matchedChunks[0]?.chunk.product, "everyday", question);
    assert.ok(
      result.matchedChunks.every(({ chunk }) => chunk.product !== "advanced"),
      question,
    );
  }
});

test("GO and PRO comparison retrieves approved evidence from both manuals", async () => {
  const { query, result } = await search("What is the difference between GO and PRO?");
  assert.equal(query.activeProduct, null);
  assert.equal(result.insufficientKnowledge, false);
  assert.ok(result.matchedChunks.some(({ chunk }) => chunk.product === "everyday"));
  assert.ok(result.matchedChunks.some(({ chunk }) => chunk.product === "advanced"));
});

test("PRO cycle, concentration, and inhalation remain isolated from GO", async () => {
  for (const question of [
    "How long does PRO take?",
    "What is the hydrogen concentration of PRO?",
    "Does PRO support hydrogen inhalation?",
  ]) {
    const { query, result } = await search(question);
    assert.equal(query.activeProduct, "advanced", question);
    assert.equal(result.insufficientKnowledge, false, question);
    assert.equal(result.matchedChunks[0]?.chunk.product, "advanced", question);
    assert.ok(
      result.matchedChunks.every(({ chunk }) => chunk.product !== "everyday"),
      question,
    );
  }
});

test("GO does not inherit PRO inhalation or mineralisation evidence", async () => {
  for (const question of [
    "Does GO support hydrogen inhalation?",
    "Does GO have mineralisation?",
  ]) {
    const { query, result } = await search(question, { viewedProducts: ["everyday"] });
    assert.equal(query.activeProduct, "everyday", question);
    assert.ok(
      result.matchedChunks.every(({ chunk }) => chunk.product !== "advanced"),
      question,
    );
  }
});

test("standalone Water Mineralizer receives no bottle mineralisation evidence", async () => {
  const { result } = await search("Tell me about the Water Mineralizer", {
    viewedProducts: ["water-mineralizer"],
  });
  assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === "water-mineralizer"));
  assert.equal(result.matchedChunks[0]?.chunk.sourceId, "WATER-MINERALIZER-MANUAL-001");
  assert.equal(result.insufficientKnowledge, false);
});

test("five languages route GO duration questions to the same approved manual", async () => {
  const cases: Array<[VisitorSession["language"], string]> = [
    ["en", "How long does GO take to make hydrogen water?"],
    ["ru", "Сколько времени GO готовит водородную воду?"],
    ["zh", "GO 制作氢水需要多久？"],
    ["yue", "GO 製作氫水要幾耐？"],
    ["fr", "Combien de temps faut-il à GO pour produire de l’eau hydrogénée ?"],
  ];

  for (const [language, question] of cases) {
    const { query, result } = await search(question, { language });
    assert.equal(query.activeProduct, "everyday", `${language}: ${query.text}`);
    assert.equal(result.insufficientKnowledge, false, language);
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, "GO-BOTTLE-MANUAL-001", language);
    assert.ok(
      result.matchedChunks.some(({ chunk }) => /5 minutes/.test(chunk.text)),
      language,
    );
  }
});

test("GO follow-up keeps everyday context and retrieves the documented duration", async () => {
  const { query, result } = await search("How long does it take?", {
    viewedProducts: ["everyday"],
    activeProduct: "everyday",
    activeTopic: "hydrogen water",
    conversationHistory: [
      { role: "user", content: "Tell me about GO." },
      { role: "assistant", content: "GO is the Hydrogen Water Bottle GO." },
    ],
  });
  assert.equal(query.activeProduct, "everyday");
  assert.equal(result.matchedChunks[0]?.chunk.sourceId, "GO-BOTTLE-MANUAL-001");
  assert.ok(result.matchedChunks.some(({ chunk }) => /5 minutes/.test(chunk.text)));
});

test("unsupported GO facts remain outside approved evidence", async () => {
  const { result } = await search("What warranty does GO have?");
  assert.ok(
    result.matchedChunks.every(({ chunk }) => !/warranty/i.test(chunk.text)),
  );
});

test("withheld GO health claims are absent from approved retrievable facts", async () => {
  const documents = await loader.load();
  const goText = documents
    .filter(({ product }) => product === "everyday")
    .map(({ content }) => content)
    .join("\n")
    .toLocaleLowerCase("en");
  for (const forbiddenClaim of [
    "neutralizes free radicals",
    "strengthens the immune system",
    "prevents thrombosis",
    "promotes overall body rejuvenation",
    "increases stress resistance",
    "helps normalize metabolism",
  ]) {
    assert.doesNotMatch(goText, new RegExp(forbiddenClaim, "i"));
  }
});

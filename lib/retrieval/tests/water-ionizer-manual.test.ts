import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import { createRetrievalQuery } from "@/lib/retrieval/retrieval-query";
import type { VisitorSession } from "@/lib/session/session-types";

const loader = new ApprovedKnowledgeLoader(path.join(process.cwd(), "knowledge"));
const engine = new RetrievalEngine(loader);

function session(overrides: Partial<VisitorSession> = {}): VisitorSession {
  return {
    sessionId: "water-ionizer-test",
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

test("approved Water Ionizer manual is indexed under water-ionizer", async () => {
  const document = (await loader.load()).find(
    ({ sourceId }) => sourceId === "WATER-IONIZER-MANUAL-001",
  );
  assert.ok(document);
  assert.equal(document.product, "water-ionizer");
  assert.equal(document.approvalStatus, "approved");
  assert.match(document.content, /3\.5 L \/ 0\.5 L/);
});

test("real exhibition questions retrieve approved Water Ionizer evidence", async () => {
  const cases: Array<[string, RegExp]> = [
    ["What does the Water Ionizer do?", /purpose|operating principle/i],
    ["How does the Water Ionizer work?", /purpose|operating principle/i],
    ["What kinds of water can the Water Ionizer make?", /water types/i],
    ["What pH levels does the Water Ionizer produce?", /pH and ORP/i],
    ["How do I use the Water Ionizer?", /preparing|controls/i],
    ["How do I choose a water mode on the Water Ionizer?", /controls|preparing/i],
    ["What filter does the Water Ionizer use?", /membrane/i],
    ["When do I replace the Water Ionizer membrane?", /membrane/i],
    ["How do I clean the Water Ionizer?", /cleaning/i],
    ["What maintenance does the Water Ionizer need?", /cleaning|membrane/i],
    ["What are the Water Ionizer technical specifications?", /technical specifications/i],
  ];
  for (const [question, heading] of cases) {
    const { query, result } = await search(question);
    assert.equal(query.activeProduct, "water-ionizer", question);
    assert.equal(result.insufficientKnowledge, false, question);
    assert.equal(result.matchedChunks[0]?.chunk.product, "water-ionizer", question);
    assert.ok(result.matchedChunks.some(({ chunk }) => heading.test(chunk.heading)), question);
  }
});

test("pH levels remain differentiated and do not collapse into generic alkaline water", async () => {
  const { result } = await search("What pH levels does the Water Ionizer produce?");
  const context = result.matchedChunks.map(({ chunk }) => chunk.text).join("\n");
  for (const value of ["8.0-8.3", "9.2-9.4", "9.5-9.9", "11.0-11.2"]) {
    assert.match(context, new RegExp(value.replace(".", "\\.")), value);
  }
});

test("Water Ionizer retrieval is isolated from bottles and standalone Mineralizer", async () => {
  const { result } = await search("How does the Water Ionizer work?");
  assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === "water-ionizer"));

  const mineralizer = await search("Is the Water Ionizer the same as the Water Mineralizer?", {
    viewedProducts: ["water-mineralizer"],
  });
  assert.ok(
    mineralizer.result.matchedChunks.every(
      ({ chunk }) => chunk.product !== "advanced" && chunk.product !== "everyday",
    ),
  );
});

test("Water Ionizer hydrogen parameters never replace GO or PRO values", async () => {
  for (const [question, product, source] of [
    ["What is the hydrogen concentration of the Water Ionizer?", "water-ionizer", "WATER-IONIZER-MANUAL-001"],
    ["What is the hydrogen concentration of GO?", "everyday", "GO-BOTTLE-MANUAL-001"],
    ["What is the hydrogen concentration of PRO?", "advanced", "ADVANCED-BOTTLE-MANUAL-001"],
  ] as const) {
    const { result } = await search(question);
    assert.equal(result.matchedChunks[0]?.chunk.product, product, question);
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, source, question);
  }
});

test("five languages route Water Ionizer pH questions to one approved source", async () => {
  const cases: Array<[VisitorSession["language"], string]> = [
    ["en", "What pH levels does the Water Ionizer produce?"],
    ["ru", "Какие уровни pH производит ионизатор воды?"],
    ["zh", "水离子机可以产生哪些 pH 水平？"],
    ["yue", "水離子機可以整到邊啲 pH 水平？"],
    ["fr", "Quels niveaux de pH produit l’ioniseur d’eau ?"],
  ];
  for (const [language, question] of cases) {
    const { query, result } = await search(question, { language });
    assert.equal(query.activeProduct, "water-ionizer", `${language}: ${query.text}`);
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, "WATER-IONIZER-MANUAL-001", language);
  }
});

test("Water Ionizer follow-ups retain active product context", async () => {
  const { query, result } = await search("What kinds of water can it make?", {
    activeProduct: "water-ionizer",
    viewedProducts: ["water-ionizer"],
    conversationHistory: [
      { role: "user", content: "Tell me about the Water Ionizer." },
      { role: "assistant", content: "The Water Ionizer uses electrolysis." },
    ],
  });
  assert.equal(query.activeProduct, "water-ionizer");
  assert.equal(result.matchedChunks[0]?.chunk.product, "water-ionizer");
});

test("generic Water Ionizer operation follow-ups retrieve its approved source", async () => {
  for (const question of ["How does it work?", "How do I use it?"]) {
    const { query, result } = await search(question, {
      activeProduct: "water-ionizer",
      viewedProducts: ["water-ionizer"],
      conversationHistory: [
        { role: "user", content: "Tell me about the Water Ionizer." },
        { role: "assistant", content: "It is the exhibition Water Ionizer." },
      ],
    });
    assert.equal(query.activeProduct, "water-ionizer");
    assert.equal(result.matchedChunks[0]?.chunk.sourceId, "WATER-IONIZER-MANUAL-001");
  }
});

test("unsupported Water Ionizer facts and health claims are absent", async () => {
  const documents = await loader.load();
  const approved = documents
    .filter(({ product }) => product === "water-ionizer")
    .map(({ content }) => content)
    .join("\n");
  for (const forbidden of [
    "improved blood rheological properties",
    "poisoning, diarrhea",
    "treating wounds",
    "supports the body's detox systems",
    "can be given to children",
  ]) {
    assert.doesNotMatch(approved, new RegExp(forbidden, "i"));
  }
  const { result } = await search("What are the Water Ionizer dimensions?");
  assert.ok(result.matchedChunks.every(({ chunk }) => !/dimensions?\s*[:|]/i.test(chunk.text)));
});

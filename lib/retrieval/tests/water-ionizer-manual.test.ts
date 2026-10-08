import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import {
  createRetrievalQuery,
  shouldRunRetrieval,
} from "@/lib/retrieval/retrieval-query";
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
  assert.equal(document.sourcePriority, 500);
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

test("general Water Ionizer use keeps the documented operating modes available", async () => {
  const { result } = await search("How do I use the Water Ionizer?");
  assert.equal(result.insufficientKnowledge, false);
  assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === "water-ionizer"));
  const headings = result.matchedChunks.map(({ chunk }) => chunk.heading).join(" ");
  assert.match(headings, /alkaline and acidic/i);
  assert.match(headings, /hydrogen-water/i);
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

test("French Water Ionizer Quick Questions retrieve the active product manual", async () => {
  const cases: Array<[string, RegExp]> = [
    ["Comment fonctionne l’ioniseur d’eau ?", /product purpose and operating principle/i],
    [
      "Quels types d’eau l’ioniseur d’eau peut-il produire ?",
      /water types and production volumes/i,
    ],
    ["Comment sélectionner un niveau de pH ?", /preparing alkaline and acidic water/i],
    ["Comment le nettoyer ?", /cleaning and maintenance/i],
  ];

  for (const [question, heading] of cases) {
    const context = session({
      language: "fr",
      activeProduct: "water-ionizer",
      viewedProducts: ["water-ionizer"],
    });
    assert.equal(shouldRunRetrieval(question, "fr", context), true, question);

    const query = createRetrievalQuery({ message: question, session: context });
    const result = await engine.search(query);
    assert.equal(query.activeProduct, "water-ionizer", question);
    assert.equal(result.insufficientKnowledge, false, question);
    assert.ok(
      result.matchedChunks.every(({ chunk }) => chunk.product === "water-ionizer"),
      question,
    );
    assert.ok(result.matchedChunks.some(({ chunk }) => heading.test(chunk.heading)), question);
  }
});

test("Russian Water Ionizer questions expand to grounded manual concepts", async () => {
  const cases: Array<[string, RegExp, RegExp]> = [
    [
      "Как работает ионизатор воды?",
      /product purpose.*operating principle/i,
      /operating principle/i,
    ],
    [
      "Какие виды воды производит ионизатор воды?",
      /water types and production volumes/i,
      /water types/i,
    ],
    [
      "Как пользоваться ионизатором воды?",
      /preparing alkaline and acidic water/i,
      /preparing|controls/i,
    ],
    [
      "Как выбрать уровень pH?",
      /selectable ionization level/i,
      /preparing|pH and ORP/i,
    ],
    [
      "Как чистить ионизатор воды?",
      /cleaning and maintenance/i,
      /cleaning/i,
    ],
    [
      "Какую воду можно использовать?",
      /water supply requirements/i,
      /source-water requirements/i,
    ],
    [
      "Что такое Silver Ion?",
      /silver.*(?:water|electrode)/i,
      /silver/i,
    ],
    [
      "Что такое водородная вода?",
      /hydrogen.*water.*mode/i,
      /hydrogen-water/i,
    ],
    [
      "Как работает электролиз?",
      /operating principle/i,
      /operating principle/i,
    ],
    [
      "Какой диапазон pH?",
      /approved.*orp.*levels/i,
      /pH and ORP/i,
    ],
    ["Что такое ORP?", /orp.*approved.*levels/i, /pH and ORP/i],
    [
      "Как обслуживать устройство?",
      /cleaning and maintenance/i,
      /cleaning/i,
    ],
  ];

  for (const [question, canonicalTerm, heading] of cases) {
    const context = session({
      language: "ru",
      activeProduct: "water-ionizer",
      viewedProducts: ["water-ionizer"],
    });
    const query = createRetrievalQuery({ message: question, session: context });
    const result = await engine.search(query);

    assert.match(query.normalizedTerms.join(" "), canonicalTerm, question);
    assert.equal(query.activeProduct, "water-ionizer", question);
    assert.equal(result.insufficientKnowledge, false, question);
    assert.ok(
      result.matchedChunks.every(({ chunk }) => chunk.product === "water-ionizer"),
      question,
    );
    assert.ok(result.matchedChunks.some(({ chunk }) => heading.test(chunk.heading)), question);
  }
});

test("context-bound Water Ionizer Quick Questions remain retrievable across non-English languages", async () => {
  const cases: Array<[VisitorSession["language"], string]> = [
    ["ru", "Как выбрать уровень pH?"],
    ["ru", "Как его чистить?"],
    ["zh", "如何选择 pH 档位？"],
    ["zh", "如何清洁？"],
    ["yue", "點樣選擇 pH 級別？"],
    ["yue", "點樣清潔？"],
  ];

  for (const [language, question] of cases) {
    const context = session({
      language,
      activeProduct: "water-ionizer",
      viewedProducts: ["water-ionizer"],
    });
    assert.equal(shouldRunRetrieval(question, language, context), true, `${language}: ${question}`);

    const query = createRetrievalQuery({ message: question, session: context });
    const result = await engine.search(query);
    assert.equal(query.activeProduct, "water-ionizer", `${language}: ${question}`);
    assert.equal(result.insufficientKnowledge, false, `${language}: ${question}`);
    assert.ok(
      result.matchedChunks.every(({ chunk }) => chunk.product === "water-ionizer"),
      `${language}: ${question}`,
    );
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

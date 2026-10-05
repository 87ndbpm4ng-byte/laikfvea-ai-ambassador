import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { createRetrievalQuery } from "@/lib/retrieval/retrieval-query";
import type { VisitorSession } from "@/lib/session/session-types";
import type { ProductId } from "@/types/product";

function session(activeProduct: ProductId, language: VisitorSession["language"] = "en"): VisitorSession {
  return {
    sessionId: `master-training-${activeProduct}-${language}`,
    createdAt: "2026-10-05T00:00:00.000Z",
    lastInteraction: "2026-10-05T00:00:00.000Z",
    status: "active",
    currentConversationStage: "DISCOVERY",
    currentIntent: "SUPPORT",
    activeProduct,
    activeTopic: null,
    lastDiscussedFeature: null,
    language,
    discussedTopics: [],
    viewedProducts: [activeProduct],
    questionsAsked: [],
    visitorGoals: [],
    conversationHistory: [],
    completedConversation: false,
    endedAt: null,
  };
}

const knowledgeRoot = path.join(process.cwd(), "knowledge");
const loader = new ApprovedKnowledgeLoader(knowledgeRoot);
const engine = new RetrievalEngine(loader);

test("the master HK2026 training PDF and six product supplements are registered", async () => {
  assert.equal(
    existsSync(path.join(knowledgeRoot, "source-materials", "hk2026-master-exhibition-training.pdf")),
    true,
  );

  const documents = await loader.load();
  const expected = [
    ["AIR-PURIFIER-EXHIBITION-TRAINING-001", "air-purifier"],
    ["WATER-IONIZER-EXHIBITION-TRAINING-001", "water-ionizer"],
    ["PRO-EXHIBITION-TRAINING-001", "advanced"],
    ["GO-EXHIBITION-TRAINING-001", "everyday"],
    ["AIR-HUMIDIFIER-EXHIBITION-TRAINING-001", "air-humidifier"],
    ["FACE-BODY-GENERATOR-EXHIBITION-TRAINING-001", "face-body-generator"],
  ] as const;

  for (const [sourceId, product] of expected) {
    const document = documents.find((entry) => entry.sourceId === sourceId);
    assert.equal(document?.product, product, sourceId);
    assert.equal(document?.sourcePriority, 400, sourceId);
  }
});

const detailedCases: Array<[ProductId, string, string]> = [
  ["air-purifier", "What does the 365 nm UV-A activate?", "photocatalytic"],
  ["water-ionizer", "Why can the silver electrode turn dark?", "silver"],
  ["advanced", "What is the documented PRO hydrogen concentration?", "ppb"],
  ["everyday", "What is GO's documented hydrogen concentration?", "ppb"],
  ["air-humidifier", "What are the four humidifier mist outputs?", "mist"],
  ["face-body-generator", "What ultrasonic frequency does the Face and Body generator use?", "160"],
];

for (const [product, message, evidenceTerm] of detailedCases) {
  test(`master training retrieves detailed ${product} evidence without product leakage`, async () => {
    const result = await engine.search(
      createRetrievalQuery({ message, session: session(product) }),
    );
    assert.equal(result.insufficientKnowledge, false, message);
    assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === product), message);
    assert.ok(
      result.matchedChunks.some(({ chunk }) =>
        chunk.text.toLocaleLowerCase("en").includes(evidenceTerm),
      ),
      message,
    );
  });
}

test("multilingual Water Ionizer questions remain product-isolated and grounded", async () => {
  const cases = [
    ["Comment fonctionne l’ioniseur d’eau ?", "fr"],
    ["Как работает ионизатор воды?", "ru"],
    ["水离子机如何工作？", "zh"],
    ["水離子機係點樣運作㗎？", "yue"],
  ] as const;

  for (const [message, language] of cases) {
    const result = await engine.search(
      createRetrievalQuery({ message, session: session("water-ionizer", language) }),
    );
    assert.equal(result.insufficientKnowledge, false, `${language}: ${message}`);
    assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === "water-ionizer"), message);
  }
});

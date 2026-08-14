import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  getGeneralQuickQuestions,
  getProductQuickQuestions,
  resolveQuickQuestionProduct,
} from "@/lib/data/quick-questions";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import { createRetrievalQuery } from "@/lib/retrieval/retrieval-query";
import type { VisitorSession } from "@/lib/session/session-types";
import type { SupportedLanguage } from "@/types/language";
import { PRODUCT_IDS, type ProductId } from "@/types/product";

const languages = ["en", "ru", "zh", "yue", "fr"] as const;
const engine = new RetrievalEngine(
  new ApprovedKnowledgeLoader(path.join(process.cwd(), "knowledge")),
);

function session(
  language: SupportedLanguage,
  activeProduct: ProductId,
): VisitorSession {
  return {
    sessionId: `quick-question-${language}-${activeProduct}`,
    createdAt: "2026-08-14T00:00:00.000Z",
    lastInteraction: "2026-08-14T00:00:00.000Z",
    status: "active",
    currentConversationStage: "DISCOVERY",
    currentIntent: "SUPPORT",
    activeProduct,
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

test("general Quick Questions stay concise, useful and non-commercial", () => {
  for (const language of languages) {
    const questions = getGeneralQuickQuestions(language);
    assert.equal(questions.length, 4, language);
    assert.equal(questions[0].action, "explore-products", language);
    assert.equal(questions[2].relatedProduct, "water-ionizer", language);
    assert.equal(questions[3].relatedProduct, "air-purifier", language);
    assert.doesNotMatch(
      questions.map(({ label }) => label).join(" "),
      /price|pricing|moq|oem|health|best|buy|стоим|цен|здоров|价格|健康|價錢|prix|santé/iu,
      language,
    );
  }
});

test("all six products have four localized, product-bound Quick Questions", () => {
  for (const productId of PRODUCT_IDS) {
    for (const language of languages) {
      const questions = getProductQuickQuestions(productId, language);
      assert.equal(questions.length, 4, `${productId}:${language}`);
      assert.ok(
        questions.every(
          ({ label, relatedProduct, action }) =>
            label.trim().length > 0 &&
            relatedProduct === productId &&
            action === undefined,
        ),
        `${productId}:${language}`,
      );
    }
  }
});

test("every product Quick Question retrieves its own approved knowledge", async () => {
  for (const productId of PRODUCT_IDS) {
    for (const language of languages) {
      for (const quickQuestion of getProductQuickQuestions(productId, language)) {
        const query = createRetrievalQuery({
          message: quickQuestion.label,
          session: session(language, productId),
        });
        const result = await engine.search(query);

        assert.equal(query.activeProduct, productId, quickQuestion.label);
        assert.equal(result.insufficientKnowledge, false, quickQuestion.label);
        assert.equal(
          result.matchedChunks[0]?.chunk.product,
          productId,
          `${productId}:${language}:${quickQuestion.label}`,
        );
      }
    }
  }
});

test("explicit multilingual product switches replace stale suggestion context", () => {
  const cases: readonly [SupportedLanguage, string, ProductId][] = [
    ["en", "Now tell me about the Air Purifier.", "air-purifier"],
    ["ru", "Теперь расскажите об очистителе воздуха.", "air-purifier"],
    ["zh", "现在请介绍一下空气净化器。", "air-purifier"],
    ["yue", "而家介紹一下空氣淨化器。", "air-purifier"],
    ["fr", "Présentez-moi maintenant le purificateur d’air.", "air-purifier"],
  ];

  for (const [language, message, expected] of cases) {
    assert.equal(resolveQuickQuestionProduct(message, language), expected);
  }
});

test("Cantonese Quick Questions use Traditional Chinese", () => {
  const cantonese = PRODUCT_IDS.flatMap((productId) =>
    getProductQuickQuestions(productId, "yue").map(({ label }) => label),
  ).join(" ");

  assert.match(cantonese, /點樣|係咩|嘅|佢/);
  assert.doesNotMatch(cantonese, /这|个|产|浓|质|储|滤|换|净/);
});

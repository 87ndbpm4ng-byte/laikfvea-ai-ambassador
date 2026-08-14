import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { guides } from "@/lib/data/guides";
import {
  analyzeCommercialIntent,
  commercialHandoffResponse,
} from "@/lib/orchestrator/commercial-handoff";
import { OrchestratorPipeline } from "@/lib/orchestrator/orchestrator-pipeline";
import type {
  OrchestratorAIProvider,
  OrchestratorPrompt,
} from "@/lib/orchestrator/orchestrator-types";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import { SessionManager } from "@/lib/session/session-manager";
import { InMemorySessionStore } from "@/lib/session/session-store";
import type { SupportedLanguage } from "@/types/language";
import type { ProductId } from "@/types/product";

const commercialQuestions: Record<SupportedLanguage, readonly string[]> = {
  en: [
    "How much does PRO cost?",
    "What is your MOQ?",
    "Can you do OEM?",
    "Can I buy a sample?",
    "I want to become a distributor.",
  ],
  ru: [
    "Сколько стоит PRO?",
    "Какой у вас минимальный объём заказа?",
    "Вы делаете OEM?",
    "Можно купить образец?",
    "Я хочу стать дистрибьютором.",
  ],
  zh: [
    "PRO 的价格是多少？",
    "你们的最低起订量是多少？",
    "可以做 OEM 吗？",
    "我可以买一个样品吗？",
    "我想成为经销商。",
  ],
  yue: [
    "PRO 嘅價錢係幾多？",
    "你哋嘅最低訂購量係幾多？",
    "可唔可以做 OEM？",
    "我可唔可以買一個樣品？",
    "我想成為經銷商。",
  ],
  fr: [
    "Combien coûte PRO ?",
    "Quelle est votre quantité minimale de commande ?",
    "Proposez-vous l’OEM ?",
    "Puis-je acheter un échantillon ?",
    "Je souhaite devenir distributeur.",
  ],
};

const expectedHandoffs: Record<SupportedLanguage, string> = {
  en: "For pricing, MOQ, OEM, samples, distribution or other commercial enquiries, please speak with a member of our team at the stand.",
  ru: "По вопросам цен, минимального заказа, OEM, образцов, дистрибуции и других коммерческих условий, пожалуйста, обратитесь к представителю нашей команды на стенде.",
  zh: "如需咨询价格、最小起订量、OEM、样品、经销或其他商务事宜，请联系展位上的工作人员。",
  yue: "如果想查詢價錢、最低訂購量、OEM、樣品、經銷或者其他商務事宜，請同展位嘅工作人員聯絡。",
  fr: "Pour les prix, les quantités minimales, l’OEM, les échantillons, la distribution ou toute autre question commerciale, veuillez vous adresser à un membre de notre équipe sur le stand.",
};

class GroundedTestProvider implements OrchestratorAIProvider {
  readonly id = "grounded-test-provider";
  calls: OrchestratorPrompt[] = [];

  async generate(prompt: OrchestratorPrompt) {
    this.calls.push(prompt);
    const passage = prompt.approvedKnowledgeContext?.passages[0]?.text;
    return passage ?? "The available product documentation does not provide that information.";
  }
}

function createPipeline() {
  const sessionManager = new SessionManager({
    store: new InMemorySessionStore(),
  });
  const provider = new GroundedTestProvider();
  const pipeline = new OrchestratorPipeline({
    sessionManager,
    provider,
    retrieval: new RetrievalEngine(
      new ApprovedKnowledgeLoader(path.join(process.cwd(), "knowledge")),
    ),
  });

  return { sessionManager, provider, pipeline };
}

for (const language of ["en", "ru", "zh", "yue", "fr"] as const) {
  test(`${language} pure commercial questions resolve to the localized handoff`, () => {
    for (const question of commercialQuestions[language]) {
      assert.deepEqual(
        analyzeCommercialIntent(question, language),
        { kind: "pure", productMessage: null },
        question,
      );
    }
    assert.equal(commercialHandoffResponse(language), expectedHandoffs[language]);
  });
}

test("ordinary product wording does not produce commercial false positives", () => {
  const questions: readonly [string, SupportedLanguage][] = [
    ["What is the minimum amount of water for GO?", "en"],
    ["How is hydrogen produced?", "en"],
    ["What sample of water should I use?", "en"],
    ["What warranty does the manual state?", "en"],
    ["How do I order the operating modes?", "en"],
    ["What parts need replacing?", "en"],
    ["Какое минимальное количество воды нужно для GO?", "ru"],
    ["氢气是怎样产生的？", "zh"],
    ["我應該用咩水樣本？", "yue"],
    ["Quelle garantie le manuel indique-t-il ?", "fr"],
  ];

  for (const [question, language] of questions) {
    assert.equal(analyzeCommercialIntent(question, language).kind, "none", question);
  }
});

test("pure commercial requests bypass retrieval and the AI provider", async () => {
  const { pipeline, provider } = createPipeline();
  const result = await pipeline.execute({
    message: "What is your MOQ?",
    guide: guides.daniel,
    language: "en",
    activeProduct: "advanced",
  });

  assert.equal(result.response, expectedHandoffs.en);
  assert.equal(result.retrieval.skipped, true);
  assert.equal(result.session.activeProduct, "advanced");
  assert.equal(provider.calls.length, 0);
});

test("commercial handoff works without context and across every active product", async () => {
  const products: readonly (ProductId | null)[] = [
    null,
    "everyday",
    "advanced",
    "water-ionizer",
    "face-body-generator",
    "water-mineralizer",
    "air-purifier",
  ];

  for (const activeProduct of products) {
    const { pipeline, provider } = createPipeline();
    const result = await pipeline.execute({
      message: "Can you provide a wholesale price?",
      guide: guides.daniel,
      language: "en",
      ...(activeProduct ? { activeProduct } : {}),
    });

    assert.equal(result.response, expectedHandoffs.en);
    assert.equal(result.session.activeProduct, activeProduct);
    assert.equal(result.retrieval.skipped, true);
    assert.equal(provider.calls.length, 0);
  }
});

test("mixed product and price questions ground the product portion and append handoff", async () => {
  const { pipeline, provider } = createPipeline();
  const result = await pipeline.execute({
    message: "How does GO work and what does it cost?",
    guide: guides.daniel,
    language: "en",
    activeProduct: "everyday",
  });

  assert.equal(result.session.activeProduct, "everyday");
  assert.equal(result.retrieval.insufficientKnowledge, false);
  assert.ok(result.retrieval.matchedChunks.length > 0);
  assert.match(result.response, new RegExp(`${expectedHandoffs.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  assert.ok(provider.calls.length >= 1);
  assert.equal(provider.calls[0].userMessage, "How does GO work");
  assert.doesNotMatch(provider.calls[0].userMessage, /cost|price/iu);
});

test("a commercial turn preserves product context for the next technical follow-up", async () => {
  const { pipeline, sessionManager } = createPipeline();
  const session = sessionManager.createSession({ language: "en" });
  sessionManager.markProductViewed(session.sessionId, "advanced");

  const handoff = await pipeline.execute({
    message: "Can I buy a sample?",
    guide: guides.daniel,
    language: "en",
    sessionId: session.sessionId,
  });
  assert.equal(handoff.session.activeProduct, "advanced");

  const followUp = await pipeline.execute({
    message: "How long is the 18-minute mode?",
    guide: guides.daniel,
    language: "en",
    sessionId: session.sessionId,
  });
  assert.equal(followUp.session.activeProduct, "advanced");
  assert.equal(followUp.retrieval.matchedChunks[0]?.chunk.product, "advanced");
  assert.notEqual(followUp.response, expectedHandoffs.en);
});

test("commercial handoff also preserves a non-bottle product", async () => {
  const { pipeline, sessionManager } = createPipeline();
  const session = sessionManager.createSession({ language: "fr" });
  sessionManager.markProductViewed(session.sessionId, "air-purifier");

  const result = await pipeline.execute({
    message: "Quel est votre prix de gros ?",
    guide: guides.emily,
    language: "fr",
    sessionId: session.sessionId,
  });

  assert.equal(result.response, expectedHandoffs.fr);
  assert.equal(result.session.activeProduct, "air-purifier");
});

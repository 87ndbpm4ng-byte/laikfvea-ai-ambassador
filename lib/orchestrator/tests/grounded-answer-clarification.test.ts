import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import type {
  OrchestratorAIProvider,
  OrchestratorPrompt,
} from "@/lib/orchestrator/orchestrator-types";
import { guides } from "@/lib/data/guides";
import type { SupportedLanguage } from "@/types/language";

const boundaries: Record<SupportedLanguage, string> = {
  en: "The available product documentation does not give me enough information to answer that reliably.",
  ru: "В доступной документации недостаточно информации, чтобы надёжно ответить на этот вопрос.",
  zh: "现有产品资料不足以可靠回答这个问题。",
  yue: "現有產品資料未足夠回答呢個問題。",
  fr: "Les informations produit disponibles ne permettent pas de répondre à cette question de manière fiable.",
};

const groundedAnswers: Record<SupportedLanguage, string> = {
  en: "The documented process uses electrolysis in drinking water. The device offers 3-minute and 18-minute cycles, and its display shows the timer, hydrogen concentration and ORP.",
  ru: "В документированном процессе используется электролиз питьевой воды. Устройство предлагает циклы на 3 и 18 минут, а дисплей показывает таймер, концентрацию водорода и ORP.",
  zh: "资料记载的制备过程使用饮用水进行电解。设备提供 3 分钟和 18 分钟两种模式，屏幕会显示计时、氢气浓度和 ORP。",
  yue: "文件記載嘅製備過程會用飲用水進行電解。設備有 3 分鐘同 18 分鐘模式，畫面會顯示時間、氫氣濃度同 ORP。",
  fr: "Le procédé documenté utilise l’électrolyse de l’eau potable. L’appareil propose des cycles de 3 et 18 minutes, et l’écran affiche le minuteur, la concentration d’hydrogène et l’ORP.",
};

class BoundaryThenGroundedProvider implements OrchestratorAIProvider {
  readonly id = "boundary-then-grounded";
  calls: OrchestratorPrompt[] = [];

  constructor(private readonly language: SupportedLanguage) {}

  async generate(prompt: OrchestratorPrompt) {
    this.calls.push(prompt);
    return this.calls.length % 2 === 1
      ? boundaries[this.language]
      : groundedAnswers[this.language];
  }
}

class BoundaryProvider implements OrchestratorAIProvider {
  readonly id = "boundary";
  calls: OrchestratorPrompt[] = [];

  constructor(private readonly language: SupportedLanguage) {}

  async generate(prompt: OrchestratorPrompt) {
    this.calls.push(prompt);
    return boundaries[this.language];
  }
}

async function createOrchestrator(provider: OrchestratorAIProvider) {
  const [{ AIOrchestrator }, { OrchestratorPipeline }, { RetrievalEngine }, { ApprovedKnowledgeLoader }, { SessionManager }, { InMemorySessionStore }] =
    await Promise.all([
      import("@/lib/orchestrator/ai-orchestrator"),
      import("@/lib/orchestrator/orchestrator-pipeline"),
      import("@/lib/retrieval/retrieval-engine"),
      import("@/lib/retrieval/retrieval-loader"),
      import("@/lib/session/session-manager"),
      import("@/lib/session/session-store"),
    ]);
  const sessionManager = new SessionManager({
    store: new InMemorySessionStore(),
  });
  return new AIOrchestrator(
    new OrchestratorPipeline({
      sessionManager,
      provider,
      retrieval: new RetrievalEngine(
        new ApprovedKnowledgeLoader(path.join(process.cwd(), "knowledge")),
      ),
    }),
  );
}

const genericQuestions: Record<SupportedLanguage, string> = {
  en: "How does hydrogen water work?",
  ru: "Как работает водородная вода?",
  zh: "氢水是如何工作的？",
  yue: "氫水係點樣運作㗎？",
  fr: "Comment fonctionne l’eau hydrogénée ?",
};

for (const language of ["en", "ru", "zh", "yue", "fr"] as const) {
  test(`${language} generic hydrogen-water answers use sufficient approved context before a total boundary`, async () => {
    for (let run = 0; run < 5; run += 1) {
      const provider = new BoundaryThenGroundedProvider(language);
      const orchestrator = await createOrchestrator(provider);
      const result = await orchestrator.handleMessage({
        message: genericQuestions[language],
        guide: guides.daniel,
        language,
      });

      assert.equal(result.retrieval.insufficientKnowledge, false);
      assert.equal(
        result.retrieval.sourceReferences[0],
        "ADVANCED-BOTTLE-MANUAL-001-P2-HYDROGEN-WATER-PREPARATION-PROCESS-22",
      );
      assert.notEqual(result.response, boundaries[language]);
      assert.equal(provider.calls.length, 2);
      assert.ok(provider.calls[0].approvedKnowledgeContext?.passages.length);
      assert.match(
        provider.calls[1].responseDirectives.join("\n"),
        /answer the useful portion directly supported/i,
      );
    }
  });
}

test("an explicit unsupported electrode-mechanism request retains the approved boundary", async () => {
  const provider = new BoundaryProvider("en");
  const orchestrator = await createOrchestrator(provider);
  const result = await orchestrator.handleMessage({
    message: "What chemical reaction occurs at the electrodes?",
    guide: guides.daniel,
    language: "en",
  });

  assert.equal(result.response, boundaries.en);
  assert.equal(provider.calls.length, 2);
  assert.match(
    provider.calls[1].responseDirectives.join("\n"),
    /explicitly requests a specific fact, scientific mechanism, or technical detail/i,
  );
});

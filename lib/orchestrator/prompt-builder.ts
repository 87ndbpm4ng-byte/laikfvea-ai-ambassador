import "server-only";

import type { OrchestratorContext } from "@/lib/orchestrator/orchestrator-context";
import type {
  OrchestratorPrompt,
  PromptContextFragment,
} from "@/lib/orchestrator/orchestrator-types";
import { createSystemPrompt } from "@/lib/ai/system-prompt";

export type BuildPromptInput = {
  context: OrchestratorContext;
  supplementalContext?: readonly PromptContextFragment[];
};

function createResponseDirectives(context: OrchestratorContext) {
  const strategy = context.responseStrategy;

  return [
    `Conversation goal: ${strategy.conversationGoal}`,
    `Response profile: ${strategy.profile}`,
    `Response length: ${strategy.responseLength}`,
    `Tone: ${strategy.tone}`,
    `Educational level: ${strategy.educationalLevel}`,
    `Commercial level: ${strategy.commercialLevel}`,
    `Question strategy: ${strategy.questionStrategy}`,
    `Ask one follow-up question: ${strategy.shouldAskFollowUp}`,
    `Summarise prior context: ${strategy.shouldSummarise}`,
    `Compare products: ${strategy.shouldCompareProducts}`,
    `Mention products: ${strategy.shouldMentionProducts}`,
    `Mention purchase: ${strategy.shouldMentionPurchase}`,
    `Mention science: ${strategy.shouldMentionScience}`,
    `Mention technology: ${strategy.shouldMentionTechnology}`,
    `Recommended sections: ${strategy.recommendedSections.join(", ")}`,
    ...strategy.experienceGuidance.map(
      (guidance) => `Experience guidance: ${guidance}`,
    ),
    ...strategy.activeRules.map((rule) => `Active response rule: ${rule}`),
  ];
}

/**
 * Assembles a structured prompt package after conversation strategy has been
 * decided. Supplemental context is an optional provider-neutral insertion
 * point; no retrieval is performed here.
 */
export class PromptBuilder {
  build({
    context,
    supplementalContext = [],
  }: BuildPromptInput): OrchestratorPrompt {
    if (!context.userMessage.trim()) {
      throw new Error("Prompt construction requires a user message.");
    }

    return {
      systemInstructions: createSystemPrompt(context.metadata.guide),
      responseDirectives: createResponseDirectives(context),
      sessionContext: {
        sessionId: context.session.sessionId,
        conversationStage: context.session.currentConversationStage,
        visitorIntent: context.session.currentIntent,
        language: context.session.language,
        discussedTopics: [...context.session.discussedTopics],
        viewedProducts: [...context.session.viewedProducts],
        visitorGoals: [...context.session.visitorGoals],
      },
      conversationHistory: context.conversationHistory.map((entry) => ({
        ...entry,
      })),
      userMessage: context.userMessage,
      supplementalContext: supplementalContext.map((fragment) => ({
        ...fragment,
        content: fragment.content.trim(),
      })),
    };
  }

  renderForExistingService(prompt: OrchestratorPrompt) {
    const supplementalContext = prompt.supplementalContext.flatMap(
      (fragment) => {
        if (!fragment.content) {
          return [];
        }

        const label = fragment.sourceLabel ?? fragment.id;
        return [`Supplemental context (${label}): ${fragment.content}`];
      },
    );

    return [
      "Construct the response using the following conversation direction.",
      ...prompt.responseDirectives,
      `Current stage: ${prompt.sessionContext.conversationStage}`,
      `Current intent: ${prompt.sessionContext.visitorIntent ?? "UNKNOWN"}`,
      ...supplementalContext,
      `Visitor message: ${prompt.userMessage}`,
    ].join("\n");
  }
}

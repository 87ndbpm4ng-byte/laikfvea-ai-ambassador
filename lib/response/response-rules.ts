import type { ResponseContext } from "@/lib/response/response-context";
import type {
  RecommendedSection,
  ResponseStrategy,
} from "@/lib/response/response-types";

export type ResponseRule = {
  id: string;
  description: string;
  apply: (
    context: ResponseContext,
    strategy: ResponseStrategy,
  ) => ResponseStrategy;
};

function addSection(
  sections: readonly RecommendedSection[],
  section: RecommendedSection,
) {
  return sections.includes(section) ? [...sections] : [...sections, section];
}

function removeSection(
  sections: readonly RecommendedSection[],
  section: RecommendedSection,
) {
  return sections.filter((currentSection) => currentSection !== section);
}

function applyRule(
  strategy: ResponseStrategy,
  ruleId: string,
  updates: Partial<ResponseStrategy>,
): ResponseStrategy {
  return {
    ...strategy,
    ...updates,
    activeRules: [...strategy.activeRules, ruleId],
  };
}

export const responseRules: readonly ResponseRule[] = [
  {
    id: "prefer-concise-explanations",
    description: "Prefer concise, exhibition-friendly explanations.",
    apply: (context, strategy) => {
      if (
        context.conversationStage.id === "WELCOME" ||
        context.conversationStage.id === "CLOSING"
      ) {
        return applyRule(strategy, "prefer-concise-explanations", {
          responseLength: "brief",
        });
      }

      return applyRule(strategy, "prefer-concise-explanations", {
        responseLength:
          strategy.responseLength === "detailed"
            ? "standard"
            : strategy.responseLength,
      });
    },
  },
  {
    id: "single-follow-up-question",
    description: "Use no more than one appropriate follow-up question.",
    apply: (_context, strategy) => {
      const shouldAskFollowUp = strategy.questionStrategy !== "none";
      let recommendedSections = strategy.recommendedSections;

      recommendedSections = shouldAskFollowUp
        ? addSection(recommendedSections, "follow-up-question")
        : removeSection(recommendedSections, "follow-up-question");

      return applyRule(strategy, "single-follow-up-question", {
        shouldAskFollowUp,
        recommendedSections,
      });
    },
  },
  {
    id: "avoid-repeating-answers",
    description:
      "Use prior conversation context and summarise only when it improves clarity.",
    apply: (context, strategy) => {
      const shouldSummarise =
        context.conversationHistory.length >= 6 ||
        context.conversationStage.id === "CLOSING";

      return applyRule(strategy, "avoid-repeating-answers", {
        shouldSummarise,
        recommendedSections: shouldSummarise
          ? addSection(strategy.recommendedSections, "summary")
          : strategy.recommendedSections,
      });
    },
  },
  {
    id: "educational-before-commercial",
    description:
      "Keep welcome, discovery and learning responses non-commercial.",
    apply: (context, strategy) => {
      if (
        context.conversationStage.id === "WELCOME" ||
        context.conversationStage.id === "DISCOVERY" ||
        context.conversationStage.id === "LEARNING"
      ) {
        return applyRule(strategy, "educational-before-commercial", {
          commercialLevel: "none",
          shouldMentionPurchase: false,
        });
      }

      return applyRule(strategy, "educational-before-commercial", {});
    },
  },
  {
    id: "natural-product-reveal",
    description:
      "Mention products only after relevant visitor intent, exploration or comparison.",
    apply: (context, strategy) => {
      const productRelevant =
        context.conversationStage.id === "COMPARISON" ||
        context.conversationStage.id === "DECISION" ||
        context.session.currentIntent === "COMPARISON" ||
        context.session.currentIntent === "BUYING_INTEREST" ||
        context.session.viewedProducts.length > 0;

      return applyRule(strategy, "natural-product-reveal", {
        shouldMentionProducts: productRelevant,
        shouldCompareProducts:
          strategy.conversationGoal === "COMPARE" && productRelevant,
      });
    },
  },
  {
    id: "purchase-only-at-decision",
    description:
      "Mention purchase only during an appropriate decision-stage recommendation.",
    apply: (context, strategy) => {
      const shouldMentionPurchase =
        context.conversationStage.id === "DECISION" &&
        strategy.conversationGoal === "RECOMMEND";

      return applyRule(strategy, "purchase-only-at-decision", {
        commercialLevel: shouldMentionPurchase
          ? "recommendation"
          : strategy.commercialLevel,
        shouldMentionPurchase,
      });
    },
  },
  {
    id: "approved-information-only",
    description:
      "Never invent information or exaggerate scientific or product claims.",
    apply: (_context, strategy) =>
      applyRule(strategy, "approved-information-only", {
        recommendedSections: addSection(
          strategy.recommendedSections,
          "limitations",
        ),
      }),
  },
  {
    id: "topic-alignment",
    description:
      "Include science or technology framing only when the visitor intent supports it.",
    apply: (context, strategy) =>
      applyRule(strategy, "topic-alignment", {
        shouldMentionScience: context.session.currentIntent === "SCIENCE",
        shouldMentionTechnology:
          context.session.currentIntent === "TECHNOLOGY",
      }),
  },
  {
    id: "no-pressure",
    description: "Never pressure the visitor or exaggerate urgency.",
    apply: (_context, strategy) =>
      applyRule(strategy, "no-pressure", {
        commercialLevel:
          strategy.commercialLevel === "recommendation"
            ? "recommendation"
            : strategy.commercialLevel,
      }),
  },
];

export function applyResponseRules(
  context: ResponseContext,
  initialStrategy: ResponseStrategy,
) {
  return responseRules.reduce(
    (strategy, rule) => rule.apply(context, strategy),
    initialStrategy,
  );
}

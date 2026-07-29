import type {
  ResponseGoal,
  ResponseProfile,
  ResponseStrategy,
} from "@/lib/response/response-types";

/**
 * Creates a complete behavior-only strategy from a profile and conversation
 * goal. Deterministic response rules can then refine this baseline.
 */
export function createProfileStrategy(
  profile: ResponseProfile,
  conversationGoal: ResponseGoal,
): ResponseStrategy {
  const { defaults } = profile;

  return {
    profile: profile.id,
    conversationGoal,
    responseLength: defaults.responseLength,
    tone: defaults.tone,
    educationalLevel: defaults.educationalLevel,
    commercialLevel: defaults.commercialLevel,
    questionStrategy: defaults.questionStrategy,
    shouldAskFollowUp: defaults.questionStrategy !== "none",
    shouldSummarise: false,
    shouldCompareProducts: conversationGoal === "COMPARE",
    shouldMentionProducts: false,
    shouldMentionPurchase: false,
    shouldMentionScience: false,
    shouldMentionTechnology: false,
    recommendedSections: [...defaults.recommendedSections],
    experienceGuidance: [],
    activeRules: [],
  };
}

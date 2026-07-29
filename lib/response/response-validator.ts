import type { ResponseContext } from "@/lib/response/response-context";
import type {
  ResponseStrategy,
  ResponseValidationIssue,
  ResponseValidationResult,
} from "@/lib/response/response-types";

const allowedGoalsByStage = {
  WELCOME: ["WELCOME"],
  DISCOVERY: ["CLARIFY", "EXPLORE", "SUPPORT"],
  LEARNING: ["EDUCATE", "EXPLORE", "SUPPORT"],
  COMPARISON: ["COMPARE"],
  DECISION: ["RECOMMEND", "EXPLORE"],
  CLOSING: ["CLOSE"],
} as const;

/**
 * Validates strategy consistency and stage alignment. It never evaluates
 * generated text.
 */
export function validateResponseStrategy(
  strategy: ResponseStrategy,
  context: ResponseContext,
): ResponseValidationResult {
  const issues: ResponseValidationIssue[] = [];
  const expectsQuestion = strategy.questionStrategy !== "none";

  if (strategy.shouldAskFollowUp !== expectsQuestion) {
    issues.push({
      code: "QUESTION_STATE_CONFLICT",
      message:
        "Follow-up state must agree with the selected question strategy.",
    });
  }

  if (
    strategy.shouldCompareProducts &&
    (!strategy.shouldMentionProducts ||
      strategy.conversationGoal !== "COMPARE")
  ) {
    issues.push({
      code: "COMPARISON_STATE_CONFLICT",
      message:
        "Product comparison requires a comparison goal and product mention.",
    });
  }

  if (
    (context.conversationStage.id === "WELCOME" ||
      context.conversationStage.id === "DISCOVERY" ||
      context.conversationStage.id === "LEARNING") &&
    strategy.commercialLevel !== "none"
  ) {
    issues.push({
      code: "COMMERCIAL_LEVEL_CONFLICT",
      message:
        "Welcome, discovery and learning stages must remain non-commercial.",
    });
  }

  if (
    strategy.shouldMentionPurchase &&
    (context.conversationStage.id !== "DECISION" ||
      strategy.commercialLevel !== "recommendation")
  ) {
    issues.push({
      code: "PURCHASE_MENTION_CONFLICT",
      message:
        "Purchase mention requires a decision-stage recommendation strategy.",
    });
  }

  if (
    strategy.shouldMentionProducts &&
    context.conversationStage.id === "WELCOME"
  ) {
    issues.push({
      code: "PRODUCT_REVEAL_CONFLICT",
      message: "The welcome stage cannot reveal products.",
    });
  }

  const allowedGoals = allowedGoalsByStage[context.conversationStage.id];

  if (!(allowedGoals as readonly string[]).includes(strategy.conversationGoal)) {
    issues.push({
      code: "STAGE_GOAL_CONFLICT",
      message: `Goal "${strategy.conversationGoal}" is not valid for stage "${context.conversationStage.id}".`,
    });
  }

  if (
    strategy.shouldAskFollowUp &&
    !strategy.recommendedSections.includes("follow-up-question")
  ) {
    issues.push({
      code: "SECTION_CONFLICT",
      message:
        "A follow-up strategy requires a follow-up-question response section.",
    });
  }

  if (
    strategy.shouldSummarise &&
    !strategy.recommendedSections.includes("summary")
  ) {
    issues.push({
      code: "SECTION_CONFLICT",
      message: "A summary strategy requires a summary response section.",
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export class ResponseStrategyValidationError extends Error {
  readonly issues: readonly ResponseValidationIssue[];

  constructor(issues: readonly ResponseValidationIssue[]) {
    super("Response strategy validation failed.");
    this.name = "ResponseStrategyValidationError";
    this.issues = issues;
  }
}

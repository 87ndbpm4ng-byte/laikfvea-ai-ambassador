import { getResponseProfile } from "@/lib/response/response-profile";
import type { ResponseContext } from "@/lib/response/response-context";
import { applyResponseRules } from "@/lib/response/response-rules";
import { createProfileStrategy } from "@/lib/response/response-strategy";
import type {
  CommercialLevel,
  QuestionStrategy,
  ResponseEvaluation,
  ResponseGoal,
  ResponseLength,
  ResponseProfileId,
  ResponseStrategy,
  ResponseTone,
} from "@/lib/response/response-types";
import {
  ResponseStrategyValidationError,
  validateResponseStrategy,
} from "@/lib/response/response-validator";

/**
 * Directs how the next assistant response should be constructed.
 *
 * ResponseEngine is deterministic and provider-independent. It does not
 * generate text, call an LLM, access retrieval, or know about the UI.
 */
export class ResponseEngine {
  createStrategy(context: ResponseContext): ResponseStrategy {
    const evaluation = this.evaluateConversation(context);
    const profile = getResponseProfile(evaluation.profile);
    const baseStrategy = createProfileStrategy(profile, evaluation.goal);
    const directedStrategy: ResponseStrategy = {
      ...baseStrategy,
      responseLength: this.determineLength(context, evaluation),
      tone: this.determineTone(context, evaluation),
      commercialLevel: this.determineCommercialLevel(
        context,
        evaluation,
      ),
      questionStrategy: this.determineQuestionStrategy(
        context,
        evaluation,
      ),
      experienceGuidance: [
        ...context.experience.recommendedBehaviour,
        ...context.experience.recommendedConversationStyle,
      ],
      shouldMentionScience: context.session.currentIntent === "SCIENCE",
      shouldMentionTechnology:
        context.session.currentIntent === "TECHNOLOGY",
    };
    const strategy = applyResponseRules(context, directedStrategy);
    const validation = validateResponseStrategy(strategy, context);

    if (!validation.valid) {
      throw new ResponseStrategyValidationError(validation.issues);
    }

    return strategy;
  }

  evaluateConversation(context: ResponseContext): ResponseEvaluation {
    const goal = this.determineGoal(context);

    return {
      stage: context.conversationStage.id,
      intent: context.session.currentIntent,
      goal,
      profile: this.determineProfile(context, goal),
      hasPriorConversation: context.conversationHistory.length > 0,
      hasDiscussedTopics: context.session.discussedTopics.length > 0,
      hasViewedProducts: context.session.viewedProducts.length > 0,
    };
  }

  determineGoal(context: ResponseContext): ResponseGoal {
    const { id: stage } = context.conversationStage;
    const intent = context.session.currentIntent;

    if (stage === "WELCOME") {
      return "WELCOME";
    }

    if (stage === "CLOSING") {
      return "CLOSE";
    }

    if (stage === "COMPARISON") {
      return "COMPARE";
    }

    if (stage === "DECISION") {
      return "RECOMMEND";
    }

    if (intent === "SUPPORT") {
      return "SUPPORT";
    }

    if (stage === "LEARNING") {
      return "EDUCATE";
    }

    if (!intent || intent === "UNKNOWN") {
      return "CLARIFY";
    }

    return "EXPLORE";
  }

  determineTone(
    context: ResponseContext,
    evaluation = this.evaluateConversation(context),
  ): ResponseTone {
    return getResponseProfile(evaluation.profile).defaults.tone;
  }

  determineLength(
    context: ResponseContext,
    evaluation = this.evaluateConversation(context),
  ): ResponseLength {
    if (
      evaluation.goal === "WELCOME" ||
      evaluation.goal === "CLOSE"
    ) {
      return "brief";
    }

    if (
      evaluation.goal === "COMPARE" ||
      evaluation.profile === "technical"
    ) {
      return "standard";
    }

    return "concise";
  }

  determineQuestionStrategy(
    context: ResponseContext,
    evaluation = this.evaluateConversation(context),
  ): QuestionStrategy {
    if (evaluation.goal === "WELCOME") {
      return "discovery";
    }

    if (evaluation.goal === "CLOSE") {
      return "closing";
    }

    if (evaluation.goal === "COMPARE") {
      return "comparison";
    }

    if (
      evaluation.goal === "CLARIFY" ||
      evaluation.goal === "SUPPORT"
    ) {
      return "clarifying";
    }

    if (
      context.conversationStage.id === "DISCOVERY" &&
      context.session.visitorGoals.length === 0
    ) {
      return "discovery";
    }

    return "none";
  }

  determineCommercialLevel(
    context: ResponseContext,
    evaluation = this.evaluateConversation(context),
  ): CommercialLevel {
    if (
      context.conversationStage.id === "WELCOME" ||
      context.conversationStage.id === "DISCOVERY" ||
      context.conversationStage.id === "LEARNING"
    ) {
      return "none";
    }

    if (evaluation.goal === "RECOMMEND") {
      return "recommendation";
    }

    if (evaluation.goal === "COMPARE") {
      return "contextual";
    }

    return "none";
  }

  private determineProfile(
    context: ResponseContext,
    goal: ResponseGoal,
  ): ResponseProfileId {
    if (goal === "CLOSE") {
      return "closing";
    }

    if (goal === "COMPARE") {
      return "comparison";
    }

    if (goal === "SUPPORT") {
      return "support";
    }

    if (
      context.session.currentIntent === "SCIENCE" ||
      context.session.currentIntent === "TECHNOLOGY"
    ) {
      return "technical";
    }

    if (goal === "RECOMMEND") {
      return "lifestyle";
    }

    return "educational";
  }
}

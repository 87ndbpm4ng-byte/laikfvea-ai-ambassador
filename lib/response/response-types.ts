import type {
  ConversationStageId,
  VisitorIntentId,
} from "@/types/experience";

export type ResponseGoal =
  | "WELCOME"
  | "EDUCATE"
  | "CLARIFY"
  | "EXPLORE"
  | "COMPARE"
  | "RECOMMEND"
  | "SUPPORT"
  | "CLOSE";

export type ResponseTone =
  | "welcoming"
  | "educational"
  | "precise"
  | "supportive"
  | "neutral"
  | "reassuring";

export type ResponseLength =
  | "brief"
  | "concise"
  | "standard"
  | "detailed";

export type CommercialLevel = "none" | "contextual" | "recommendation";

export type EducationalLevel =
  | "introductory"
  | "accessible"
  | "detailed";

export type QuestionStrategy =
  | "none"
  | "clarifying"
  | "discovery"
  | "comparison"
  | "closing";

export type ResponseProfileId =
  | "educational"
  | "technical"
  | "lifestyle"
  | "comparison"
  | "support"
  | "closing";

export type RecommendedSection =
  | "direct-answer"
  | "brief-explanation"
  | "approved-information"
  | "comparison"
  | "limitations"
  | "summary"
  | "next-step"
  | "follow-up-question";

export type ResponseStrategy = {
  profile: ResponseProfileId;
  conversationGoal: ResponseGoal;
  responseLength: ResponseLength;
  tone: ResponseTone;
  educationalLevel: EducationalLevel;
  commercialLevel: CommercialLevel;
  questionStrategy: QuestionStrategy;
  shouldAskFollowUp: boolean;
  shouldSummarise: boolean;
  shouldCompareProducts: boolean;
  shouldMentionProducts: boolean;
  shouldMentionPurchase: boolean;
  shouldMentionScience: boolean;
  shouldMentionTechnology: boolean;
  recommendedSections: readonly RecommendedSection[];
  experienceGuidance: readonly string[];
  activeRules: readonly string[];
};

export type ResponseProfile = {
  id: ResponseProfileId;
  description: string;
  defaults: Pick<
    ResponseStrategy,
    | "responseLength"
    | "tone"
    | "educationalLevel"
    | "commercialLevel"
    | "questionStrategy"
    | "recommendedSections"
  >;
};

export type ResponseEvaluation = {
  stage: ConversationStageId;
  intent: VisitorIntentId | null;
  goal: ResponseGoal;
  profile: ResponseProfileId;
  hasPriorConversation: boolean;
  hasDiscussedTopics: boolean;
  hasViewedProducts: boolean;
};

export type ResponseValidationIssueCode =
  | "QUESTION_STATE_CONFLICT"
  | "COMPARISON_STATE_CONFLICT"
  | "COMMERCIAL_LEVEL_CONFLICT"
  | "PURCHASE_MENTION_CONFLICT"
  | "PRODUCT_REVEAL_CONFLICT"
  | "STAGE_GOAL_CONFLICT"
  | "SECTION_CONFLICT";

export type ResponseValidationIssue = {
  code: ResponseValidationIssueCode;
  message: string;
};

export type ResponseValidationResult = {
  valid: boolean;
  issues: readonly ResponseValidationIssue[];
};

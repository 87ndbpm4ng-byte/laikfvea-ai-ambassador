export type ConversationStageId =
  | "WELCOME"
  | "DISCOVERY"
  | "LEARNING"
  | "COMPARISON"
  | "DECISION"
  | "CLOSING";

export type VisitorIntentId =
  | "GREETING"
  | "GENERAL_CURIOSITY"
  | "SCIENCE"
  | "TECHNOLOGY"
  | "COMPARISON"
  | "BUYING_INTEREST"
  | "SUPPORT"
  | "UNKNOWN";

export type ConversationStage = {
  id: ConversationStageId;
  title: string;
  purpose: string;
  allowedTransitions: readonly ConversationStageId[];
  recommendedBehaviour: readonly string[];
};

export type VisitorIntent = {
  id: VisitorIntentId;
  title: string;
  description: string;
  recommendedStage: ConversationStageId;
};

export type ExperienceRule = {
  id: string;
  instruction: string;
};

export type ExperienceContext = {
  currentStage: ConversationStageId;
  visitorIntent?: VisitorIntentId;
  completedStages?: readonly ConversationStageId[];
};

export type ExperienceRecommendation = {
  currentStage: ConversationStage;
  possibleNextStages: readonly ConversationStage[];
  recommendedBehaviour: readonly string[];
  recommendedConversationStyle: readonly string[];
};

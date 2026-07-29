import {
  getConversationStage,
} from "@/lib/experience/conversation-stages";
import {
  experienceRules,
  recommendedConversationStyle,
} from "@/lib/experience/experience-rules";
import { getVisitorIntent } from "@/lib/experience/visitor-intents";
import type {
  ConversationStage,
  ExperienceContext,
  ExperienceRecommendation,
} from "@/types/experience";

function getPossibleNextStages(
  currentStage: ConversationStage,
  context: ExperienceContext,
) {
  const allowedStages = currentStage.allowedTransitions.map(
    getConversationStage,
  );

  if (!context.visitorIntent) {
    return allowedStages;
  }

  const recommendedStage = getVisitorIntent(
    context.visitorIntent,
  ).recommendedStage;
  const preferredStage = allowedStages.find(
    (stage) => stage.id === recommendedStage,
  );

  if (!preferredStage) {
    return allowedStages;
  }

  return [
    preferredStage,
    ...allowedStages.filter((stage) => stage.id !== preferredStage.id),
  ];
}

export function getExperienceRecommendation(
  context: ExperienceContext,
): ExperienceRecommendation {
  const currentStage = getConversationStage(context.currentStage);

  return {
    currentStage,
    possibleNextStages: getPossibleNextStages(currentStage, context),
    recommendedBehaviour: [
      ...currentStage.recommendedBehaviour,
      ...experienceRules.map((rule) => rule.instruction),
    ],
    recommendedConversationStyle,
  };
}

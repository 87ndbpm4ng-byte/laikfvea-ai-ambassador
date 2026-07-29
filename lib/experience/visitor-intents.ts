import type { VisitorIntent, VisitorIntentId } from "@/types/experience";

export const visitorIntents: Record<VisitorIntentId, VisitorIntent> = {
  GREETING: {
    id: "GREETING",
    title: "Greeting",
    description: "The visitor is beginning or acknowledging the interaction.",
    recommendedStage: "WELCOME",
  },
  GENERAL_CURIOSITY: {
    id: "GENERAL_CURIOSITY",
    title: "General curiosity",
    description: "The visitor is interested but has not selected a specific topic.",
    recommendedStage: "DISCOVERY",
  },
  SCIENCE: {
    id: "SCIENCE",
    title: "Science",
    description: "The visitor wants to understand an approved scientific topic.",
    recommendedStage: "LEARNING",
  },
  TECHNOLOGY: {
    id: "TECHNOLOGY",
    title: "Technology",
    description: "The visitor wants to understand how an approved technology works.",
    recommendedStage: "LEARNING",
  },
  COMPARISON: {
    id: "COMPARISON",
    title: "Comparison",
    description: "The visitor wants to compare available options.",
    recommendedStage: "COMPARISON",
  },
  BUYING_INTEREST: {
    id: "BUYING_INTEREST",
    title: "Buying interest",
    description: "The visitor is considering which next step may suit their stated needs.",
    recommendedStage: "DECISION",
  },
  SUPPORT: {
    id: "SUPPORT",
    title: "Support",
    description: "The visitor is seeking approved help or support information.",
    recommendedStage: "DISCOVERY",
  },
  UNKNOWN: {
    id: "UNKNOWN",
    title: "Unknown",
    description: "The visitor's intent is not yet clear.",
    recommendedStage: "DISCOVERY",
  },
};

export function getVisitorIntent(id: VisitorIntentId) {
  return visitorIntents[id];
}

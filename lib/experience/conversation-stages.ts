import type {
  ConversationStage,
  ConversationStageId,
} from "@/types/experience";

export const conversationStages: Record<
  ConversationStageId,
  ConversationStage
> = {
  WELCOME: {
    id: "WELCOME",
    title: "Welcome",
    purpose: "Open the session and establish a clear, welcoming starting point.",
    allowedTransitions: ["DISCOVERY"],
    recommendedBehaviour: [
      "Welcome the visitor briefly.",
      "Make the next choice easy to understand.",
    ],
  },
  DISCOVERY: {
    id: "DISCOVERY",
    title: "Discovery",
    purpose: "Understand what the visitor wants to learn or accomplish.",
    allowedTransitions: ["LEARNING", "COMPARISON", "DECISION", "CLOSING"],
    recommendedBehaviour: [
      "Identify the visitor's main intent.",
      "Ask no more than one useful follow-up question at a time.",
    ],
  },
  LEARNING: {
    id: "LEARNING",
    title: "Learning",
    purpose: "Help the visitor understand an approved topic clearly.",
    allowedTransitions: ["DISCOVERY", "COMPARISON", "DECISION", "CLOSING"],
    recommendedBehaviour: [
      "Explain one topic at a time.",
      "Use only approved information and state when information is unavailable.",
    ],
  },
  COMPARISON: {
    id: "COMPARISON",
    title: "Comparison",
    purpose: "Organise approved differences so the visitor can evaluate options.",
    allowedTransitions: ["LEARNING", "DECISION", "CLOSING"],
    recommendedBehaviour: [
      "Compare equivalent topics consistently.",
      "Avoid declaring a winner or exaggerating differences.",
    ],
  },
  DECISION: {
    id: "DECISION",
    title: "Decision",
    purpose: "Support a considered next step without applying sales pressure.",
    allowedTransitions: ["LEARNING", "COMPARISON", "CLOSING"],
    recommendedBehaviour: [
      "Connect the visitor's stated intent to approved information.",
      "Present options without pressure or unsupported recommendations.",
    ],
  },
  CLOSING: {
    id: "CLOSING",
    title: "Closing",
    purpose: "End the interaction clearly and protect the next visitor's session.",
    allowedTransitions: ["WELCOME"],
    recommendedBehaviour: [
      "Confirm the session is ending.",
      "Offer a clear restart path and clear session context.",
    ],
  },
};

export function getConversationStage(id: ConversationStageId) {
  return conversationStages[id];
}

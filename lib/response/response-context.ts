import { getConversationStage } from "@/lib/experience/conversation-stages";
import { getVisitorIntent } from "@/lib/experience/visitor-intents";
import type { SessionConversationEntry } from "@/lib/session/conversation-history";
import type { VisitorSession } from "@/lib/session/session-types";
import type {
  ConversationStage,
  ExperienceRecommendation,
  VisitorIntent,
} from "@/types/experience";

export type ResponseContext = {
  session: VisitorSession;
  conversationStage: ConversationStage;
  visitorIntent: VisitorIntent | null;
  conversationHistory: readonly SessionConversationEntry[];
  experience: ExperienceRecommendation;
};

export type CreateResponseContextInput = {
  session: VisitorSession;
  experience: ExperienceRecommendation;
};

/**
 * Creates the normalized, provider-independent input consumed by the
 * Response Engine.
 */
export function createResponseContext({
  session,
  experience,
}: CreateResponseContextInput): ResponseContext {
  if (experience.currentStage.id !== session.currentConversationStage) {
    throw new Error(
      "Experience recommendation and session stage must describe the same conversation stage.",
    );
  }

  return {
    session,
    conversationStage: getConversationStage(
      session.currentConversationStage,
    ),
    visitorIntent: session.currentIntent
      ? getVisitorIntent(session.currentIntent)
      : null,
    conversationHistory: session.conversationHistory,
    experience,
  };
}

import type { ExperienceRecommendation } from "@/types/experience";
import type { ResponseStrategy } from "@/lib/response/response-types";
import type { SessionConversationEntry } from "@/lib/session/conversation-history";
import type { VisitorSession } from "@/lib/session/session-types";
import type { OrchestratorMetadata } from "@/lib/orchestrator/orchestrator-types";
import type { RetrievalContext } from "@/lib/retrieval/retrieval-types";

export type OrchestratorContext = {
  session: VisitorSession;
  experience: ExperienceRecommendation;
  responseStrategy: ResponseStrategy;
  conversationHistory: readonly SessionConversationEntry[];
  userMessage: string;
  metadata: OrchestratorMetadata;
  retrievalContext: RetrievalContext | null;
};

export type CreateOrchestratorContextInput = {
  session: VisitorSession;
  experience: ExperienceRecommendation;
  responseStrategy: ResponseStrategy;
  userMessage: string;
  metadata: OrchestratorMetadata;
  retrievalContext?: RetrievalContext | null;
};

/**
 * Creates the complete context shared by prompt construction and provider
 * execution after session, experience and response decisions are complete.
 */
export function createOrchestratorContext({
  session,
  experience,
  responseStrategy,
  userMessage,
  metadata,
  retrievalContext = null,
}: CreateOrchestratorContextInput): OrchestratorContext {
  const normalizedMessage = userMessage.trim();

  if (!normalizedMessage) {
    throw new Error("Orchestrator context requires a user message.");
  }

  if (session.status !== "active") {
    throw new Error("Orchestrator context requires an active session.");
  }

  if (experience.currentStage.id !== session.currentConversationStage) {
    throw new Error(
      "Session and experience context must use the same conversation stage.",
    );
  }

  return {
    session,
    experience,
    responseStrategy,
    conversationHistory: session.conversationHistory,
    userMessage: normalizedMessage,
    metadata,
    retrievalContext,
  };
}

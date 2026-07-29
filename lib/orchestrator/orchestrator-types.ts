import type { SessionConversationEntry } from "@/lib/session/conversation-history";
import type { VisitorSession } from "@/lib/session/session-types";
import type { ResponseStrategy } from "@/lib/response/response-types";
import type { Guide } from "@/types/guide";
import type {
  RetrievalContext,
  RetrievalResult,
} from "@/lib/retrieval/retrieval-types";
import type { RetrievalDiagnostics } from "@/lib/retrieval/retrieval-diagnostics";
import type {
  ActiveSessionProduct,
  ConversationTopic,
  SessionReferenceResolution,
} from "@/lib/session/session-types";

export type OrchestratorMetadata = {
  requestId: string;
  receivedAt: string;
  providerId: string;
  guide: Guide;
};

export type PromptContextFragment = {
  id: string;
  content: string;
  sourceLabel?: string;
};

export type OrchestratorPrompt = {
  systemInstructions: string;
  responseDirectives: readonly string[];
  sessionContext: {
    sessionId: string;
    conversationStage: string;
    visitorIntent: string | null;
    activeProduct: ActiveSessionProduct | null;
    activeTopic: ConversationTopic | null;
    lastDiscussedFeature: string | null;
    previousQuestion: string | null;
    previousAnswer: string | null;
    resolvedQuestion: string | null;
    referenceResolution: SessionReferenceResolution | null;
    summary: string;
    language: string | null;
    discussedTopics: readonly string[];
    viewedProducts: readonly string[];
    visitorGoals: readonly string[];
  };
  conversationHistory: readonly SessionConversationEntry[];
  userMessage: string;
  supplementalContext: readonly PromptContextFragment[];
  approvedKnowledgeContext: RetrievalContext | null;
};

export type OrchestrateMessageInput = {
  message: string;
  guide: Guide;
  sessionId?: string;
  language?: string | null;
  supplementalContext?: readonly PromptContextFragment[];
};

export type OrchestratorResult = {
  sessionId: string;
  response: string;
  responseStrategy: ResponseStrategy;
  session: VisitorSession;
  retrieval: RetrievalResult;
  diagnostics?: RetrievalDiagnostics;
};

export interface OrchestratorAIProvider {
  readonly id: string;
  generate(
    prompt: OrchestratorPrompt,
    guide: Guide,
  ): Promise<string>;
}

export type OrchestratorClock = () => Date;
export type OrchestratorIdFactory = () => string;

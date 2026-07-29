import type { SessionConversationEntry } from "@/lib/session/conversation-history";
import type {
  ConversationStageId,
  VisitorIntentId,
} from "@/types/experience";
import type { ProductId } from "@/types/product";

export type SessionId = string;

export type SessionStatus = "active" | "ended";

export type ActiveSessionProduct = ProductId | "both";

export type ConversationTopic =
  | "battery"
  | "charging"
  | "cleaning"
  | "comparison"
  | "hydrogen-inhalation"
  | "hydrogen-water"
  | "maintenance"
  | "mineralisation"
  | "product-selection"
  | "setup";

export type SessionReferenceResolution = {
  reference: string;
  resolvedTo: string | null;
  ambiguous: boolean;
};

export type ResetReason =
  | "VISITOR_LEFT"
  | "IDLE_TIMEOUT"
  | "MANUAL_RESET"
  | "RESTART"
  | "COMPLETED_INTERACTION";

export type VisitorSession = {
  sessionId: SessionId;
  createdAt: string;
  lastInteraction: string;
  status: SessionStatus;
  currentConversationStage: ConversationStageId;
  currentIntent: VisitorIntentId | null;
  activeProduct?: ActiveSessionProduct | null;
  activeTopic?: ConversationTopic | null;
  lastDiscussedFeature?: string | null;
  previousQuestion?: string | null;
  previousAnswer?: string | null;
  resolvedQuestion?: string | null;
  referenceResolution?: SessionReferenceResolution | null;
  comparisonProducts?: readonly ProductId[];
  language: string | null;
  discussedTopics: readonly string[];
  viewedProducts: readonly ProductId[];
  questionsAsked: readonly string[];
  visitorGoals: readonly string[];
  conversationHistory: readonly SessionConversationEntry[];
  completedConversation: boolean;
  endedAt: string | null;
};

export type CreateSessionInput = {
  sessionId?: SessionId;
  language?: string | null;
  initialStage?: ConversationStageId;
  initialIntent?: VisitorIntentId | null;
};

export type SessionUpdate = {
  language?: string | null;
  visitorGoals?: readonly string[];
};

export type RecordMessageInput = {
  messageId?: string;
  content: string;
};

export type SessionResetResult = {
  resetReason: ResetReason;
  endedSessionId: SessionId;
  replacementSession: VisitorSession;
};

export type SessionClock = () => Date;
export type SessionIdFactory = () => string;

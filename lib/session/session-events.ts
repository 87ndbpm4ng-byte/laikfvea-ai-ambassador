import type { SessionId } from "@/lib/session/session-types";
import type {
  ConversationStageId,
  VisitorIntentId,
} from "@/types/experience";
import type { ProductId } from "@/types/product";
import type { ResetReason } from "@/lib/session/session-types";

export type SessionEventType =
  | "SESSION_CREATED"
  | "MESSAGE_RECEIVED"
  | "MESSAGE_SENT"
  | "TOPIC_DISCUSSED"
  | "PRODUCT_VIEWED"
  | "STAGE_CHANGED"
  | "INTENT_CHANGED"
  | "SESSION_RESET"
  | "SESSION_ENDED";

type SessionEventBase<TType extends SessionEventType, TPayload> = {
  eventId: string;
  type: TType;
  sessionId: SessionId;
  timestamp: string;
  payload: TPayload;
};

export type SessionEvent =
  | SessionEventBase<
      "SESSION_CREATED",
      { conversationStage: ConversationStageId }
    >
  | SessionEventBase<
      "MESSAGE_RECEIVED",
      {
        messageId: string;
        conversationStage: ConversationStageId;
        intent: VisitorIntentId | null;
      }
    >
  | SessionEventBase<
      "MESSAGE_SENT",
      {
        messageId: string;
        conversationStage: ConversationStageId;
        intent: VisitorIntentId | null;
      }
    >
  | SessionEventBase<"TOPIC_DISCUSSED", { topic: string }>
  | SessionEventBase<"PRODUCT_VIEWED", { productId: ProductId }>
  | SessionEventBase<
      "STAGE_CHANGED",
      {
        previousStage: ConversationStageId;
        nextStage: ConversationStageId;
      }
    >
  | SessionEventBase<
      "INTENT_CHANGED",
      {
        previousIntent: VisitorIntentId | null;
        nextIntent: VisitorIntentId | null;
      }
    >
  | SessionEventBase<"SESSION_RESET", { reason: ResetReason }>
  | SessionEventBase<
      "SESSION_ENDED",
      { reason: ResetReason; completedConversation: boolean }
    >;

export type SessionEventSink = (event: SessionEvent) => void;

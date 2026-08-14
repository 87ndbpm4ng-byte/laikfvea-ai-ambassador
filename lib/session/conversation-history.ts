import type {
  ConversationStageId,
  VisitorIntentId,
} from "@/types/experience";
import { MAX_STORED_CONVERSATION_MESSAGES } from "@/lib/conversation/conversation-limits";

export type SessionConversationRole = "visitor" | "assistant";

export type SessionConversationEntry = {
  id: string;
  role: SessionConversationRole;
  content: string;
  timestamp: string;
  conversationStage: ConversationStageId;
  intent: VisitorIntentId | null;
};

export type CreateConversationEntryInput = {
  id: string;
  role: SessionConversationRole;
  content: string;
  timestamp: string;
  conversationStage: ConversationStageId;
  intent: VisitorIntentId | null;
};

export function createConversationEntry({
  id,
  role,
  content,
  timestamp,
  conversationStage,
  intent,
}: CreateConversationEntryInput): SessionConversationEntry {
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    throw new Error("Conversation history entries require content.");
  }

  return {
    id,
    role,
    content: normalizedContent,
    timestamp,
    conversationStage,
    intent,
  };
}

export function appendConversationEntry(
  history: readonly SessionConversationEntry[],
  entry: SessionConversationEntry,
) {
  return [...history, entry].slice(-MAX_STORED_CONVERSATION_MESSAGES);
}

export function clearConversationHistory(): SessionConversationEntry[] {
  return [];
}

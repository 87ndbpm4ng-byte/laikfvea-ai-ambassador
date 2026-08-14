import type { ConversationMessage } from "@/types/conversation";

/** Selects the next guide response for speech without considering question source. */
export function selectPendingGuideSpeech(
  messages: ConversationMessage[],
  lastSpokenMessageId: string | null,
) {
  const latestGuideMessage = messages.findLast(
    (message) => message.role === "guide",
  );

  if (
    !latestGuideMessage ||
    latestGuideMessage.speakable === false ||
    latestGuideMessage.id === lastSpokenMessageId
  ) {
    return null;
  }

  return latestGuideMessage;
}

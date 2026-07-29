"use client";

import { useCallback, useRef, useState } from "react";
import { generateConversationResponse } from "@/lib/conversation/response-engine";
import type {
  ConversationMessage,
  SuggestedQuestion,
} from "@/types/conversation";
import type { Guide } from "@/types/guide";
import type { ProductId } from "@/types/product";

let fallbackMessageSequence = 0;

function createMessageId(role: ConversationMessage["role"]) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  fallbackMessageSequence += 1;
  return `${role}-${Date.now()}-${fallbackMessageSequence}`;
}

export function useConversation(guide: Guide | null, language?: string | null) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);
  const sessionIdRef = useRef<string | undefined>(undefined);

  const submit = useCallback(
    async ({
      content,
      questionId,
      relatedProduct,
    }: {
      content: string;
      questionId?: string;
      relatedProduct?: ProductId;
    }) => {
      const normalizedContent = content.trim();

      if (!guide || !normalizedContent || loadingRef.current) {
        return false;
      }

      loadingRef.current = true;
      setIsLoading(true);

      const visitorMessage: ConversationMessage = {
        id: createMessageId("visitor"),
        role: "visitor",
        content: normalizedContent,
        timestamp: new Date().toISOString(),
        relatedProduct,
        questionId,
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        visitorMessage,
      ]);

      try {
        const history = messages
          .filter(
            (
              message,
            ): message is ConversationMessage & {
              role: "visitor" | "guide";
            } => message.role === "visitor" || message.role === "guide",
          )
          .slice(-10)
          .map((message) => ({
            role: message.role,
            content: message.content,
          }));
        const response = await generateConversationResponse({
          content: normalizedContent,
          guide,
          history,
          language: language ?? undefined,
          questionId,
          relatedProduct,
          sessionId: sessionIdRef.current,
        });
        sessionIdRef.current = response.sessionId;

        const guideMessage: ConversationMessage = {
          id: createMessageId("guide"),
          role: "guide",
          content: response.content,
          timestamp: new Date().toISOString(),
          relatedProduct: response.relatedProduct,
          questionId,
        };

        setMessages((currentMessages) => [
          ...currentMessages,
          guideMessage,
        ]);
        return true;
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [guide, language, messages],
  );

  const submitSuggestedQuestion = useCallback(
    (question: SuggestedQuestion) =>
      submit({
        content: question.label,
        questionId: question.id,
        relatedProduct: question.relatedProduct,
      }),
    [submit],
  );

  const submitText = useCallback(
    (content: string, relatedProduct?: ProductId) =>
      submit({ content, relatedProduct }),
    [submit],
  );

  const clearHistory = useCallback(() => {
    loadingRef.current = false;
    setIsLoading(false);
    setMessages([]);
    sessionIdRef.current = undefined;
  }, []);

  return {
    messages,
    isLoading,
    submitSuggestedQuestion,
    submitText,
    clearHistory,
  };
}

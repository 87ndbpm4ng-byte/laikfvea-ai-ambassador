"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateConversationResponse } from "@/lib/conversation/response-engine";
import { logVoiceDiagnostic } from "@/lib/voice/voice-diagnostics";
import type {
  ConversationMessage,
  QuestionSubmission,
} from "@/types/conversation";
import type { Guide } from "@/types/guide";
import type { SupportedLanguage } from "@/types/language";
import { VisitorSessionLifecycle } from "@/lib/kiosk/visitor-session-lifecycle";

let fallbackMessageSequence = 0;

function createMessageId(role: ConversationMessage["role"]) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  fallbackMessageSequence += 1;
  return `${role}-${Date.now()}-${fallbackMessageSequence}`;
}

export function useConversation(
  guide: Guide | null,
  language?: SupportedLanguage | null,
) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const lifecycleRef = useRef(new VisitorSessionLifecycle());

  const submitQuestion = useCallback(
    async ({
      content,
      source,
      questionId,
      relatedProduct,
    }: QuestionSubmission) => {
      const normalizedContent = content.trim();

      if (!guide || !normalizedContent || loadingRef.current) {
        return false;
      }

      loadingRef.current = true;
      setIsLoading(true);
      logVoiceDiagnostic("question-submitted", {
        questionSource: source,
      });

      const visitorMessage: ConversationMessage = {
        id: createMessageId("visitor"),
        role: "visitor",
        content: normalizedContent,
        timestamp: new Date().toISOString(),
        relatedProduct,
        questionId,
        source,
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        visitorMessage,
      ]);

      const request = lifecycleRef.current.beginRequest();

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
          signal: request.controller.signal,
        });
        if (!lifecycleRef.current.isCurrent(request.generation, request.controller)) {
          return false;
        }
        sessionIdRef.current = response.sessionId;

        const guideMessage: ConversationMessage = {
          id: createMessageId("guide"),
          role: "guide",
          content: response.content,
          timestamp: new Date().toISOString(),
          relatedProduct: response.relatedProduct,
          questionId,
          source,
        };

        logVoiceDiagnostic("assistant-response", {
          questionSource: source,
          responseReceived: true,
        });

        setMessages((currentMessages) => [
          ...currentMessages,
          guideMessage,
        ]);
        return true;
      } finally {
        if (lifecycleRef.current.isCurrent(request.generation, request.controller)) {
          lifecycleRef.current.finish(request.controller);
          loadingRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [guide, language, messages],
  );

  const clearHistory = useCallback(() => {
    lifecycleRef.current.reset();
    loadingRef.current = false;
    setIsLoading(false);
    setMessages([]);
    sessionIdRef.current = undefined;
  }, []);

  useEffect(() => () => lifecycleRef.current.reset(), []);

  return {
    messages,
    isLoading,
    submitQuestion,
    clearHistory,
  };
}

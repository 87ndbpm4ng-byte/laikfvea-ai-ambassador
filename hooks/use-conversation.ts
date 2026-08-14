"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteConversationSession, generateConversationResponse } from "@/lib/conversation/response-engine";
import { logVoiceDiagnostic } from "@/lib/voice/voice-diagnostics";
import type {
  ConversationMessage,
  QuestionSubmission,
} from "@/types/conversation";
import type { Guide } from "@/types/guide";
import type { SupportedLanguage } from "@/types/language";
import { VisitorSessionLifecycle } from "@/lib/kiosk/visitor-session-lifecycle";
import type { ProductId } from "@/types/product";
import { MAX_CONVERSATION_MESSAGE_LENGTH, MAX_VISIBLE_CONVERSATION_MESSAGES } from "@/lib/conversation/conversation-limits";
import { reconcileActiveProduct } from "@/lib/conversation/active-product-context";
import { classifyInputSignal, getInputSignalMessage, isAccidentalDuplicateSubmission, type RecentSubmission } from "@/lib/conversation/input-signal";

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
  const [conversationNotice, setConversationNotice] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const activeProductRef = useRef<ProductId | undefined>(undefined);
  const lifecycleRef = useRef(new VisitorSessionLifecycle());
  const lastSubmissionRef = useRef<RecentSubmission>(null);

  const submitQuestion = useCallback(
    async ({
      content,
      source,
      questionId,
      relatedProduct,
    }: QuestionSubmission) => {
      const normalizedContent = content.trim();
      const productContext = relatedProduct ?? activeProductRef.current;
      const signalKind = classifyInputSignal(
        content,
        messages.length > 0 || Boolean(productContext),
      );

      if (signalKind !== "valid") {
        setConversationNotice(getInputSignalMessage(signalKind, language));
        return false;
      }

      const submissionKey = `${source}:${questionId ?? ""}:${productContext ?? ""}:${normalizedContent}`;
      const now = Date.now();
      if (isAccidentalDuplicateSubmission(lastSubmissionRef.current, submissionKey, now)) {
        return false;
      }

      if (
        !guide ||
        !normalizedContent ||
        normalizedContent.length > MAX_CONVERSATION_MESSAGE_LENGTH ||
        loadingRef.current
      ) {
        return false;
      }

      lastSubmissionRef.current = { key: submissionKey, at: now };
      setConversationNotice(null);
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
        relatedProduct: productContext,
        questionId,
        source,
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        visitorMessage,
      ].slice(-MAX_VISIBLE_CONVERSATION_MESSAGES));

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
          relatedProduct: productContext,
          sessionId: sessionIdRef.current,
          signal: request.controller.signal,
        });
        if (!lifecycleRef.current.isCurrent(request.generation, request.controller)) {
          return false;
        }
        sessionIdRef.current = response.sessionId;
        activeProductRef.current = reconcileActiveProduct(
          activeProductRef.current,
          response.resolvedActiveProduct,
        );

        const guideMessage: ConversationMessage = {
          id: createMessageId("guide"),
          role: "guide",
          content: response.content,
          timestamp: new Date().toISOString(),
          relatedProduct:
            response.resolvedActiveProduct ??
            response.relatedProduct ??
            productContext,
          questionId,
          source,
          speakable: response.speakable,
        };

        logVoiceDiagnostic("assistant-response", {
          questionSource: source,
          responseReceived: true,
        });

        setMessages((currentMessages) => [
          ...currentMessages,
          guideMessage,
        ].slice(-MAX_VISIBLE_CONVERSATION_MESSAGES));
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
    const sessionId = sessionIdRef.current;
    lifecycleRef.current.reset();
    loadingRef.current = false;
    setIsLoading(false);
    setMessages([]);
    setConversationNotice(null);
    lastSubmissionRef.current = null;
    sessionIdRef.current = undefined;
    activeProductRef.current = undefined;
    if (sessionId) void deleteConversationSession(sessionId);
  }, []);

  const selectProduct = useCallback((productId: ProductId) => {
    activeProductRef.current = productId;
  }, []);

  const cancelPending = useCallback(() => {
    if (!loadingRef.current) return;
    lifecycleRef.current.reset();
    loadingRef.current = false;
    setIsLoading(false);
    setMessages((currentMessages) => {
      const lastMessage = currentMessages.at(-1);
      return lastMessage?.role === "visitor"
        ? currentMessages.slice(0, -1)
        : currentMessages;
    });
  }, []);

  useEffect(() => () => lifecycleRef.current.reset(), []);

  return {
    messages,
    isLoading,
    conversationNotice,
    submitQuestion,
    clearHistory,
    selectProduct,
    cancelPending,
  };
}

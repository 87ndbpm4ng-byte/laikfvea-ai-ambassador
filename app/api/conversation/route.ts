import { NextResponse } from "next/server";
import {
  MAX_OPENAI_HISTORY_MESSAGES,
  MissingOpenAIKeyError,
} from "@/lib/ai/openai-response-engine";
import { guides } from "@/lib/data/guides";
import { AIOrchestrator } from "@/lib/orchestrator/ai-orchestrator";
import {
  AIOrchestratorError,
  InvalidOrchestratorInputError,
  OpenAIFailureError,
  SessionUnavailableError,
} from "@/lib/orchestrator/orchestrator-errors";
import { OrchestratorPipeline } from "@/lib/orchestrator/orchestrator-pipeline";
import { SessionManager } from "@/lib/session/session-manager";
import { InMemorySessionStore } from "@/lib/session/session-store";
import type {
  ConversationApiRequest,
  ConversationApiErrorCode,
  ConversationApiResponse,
  ConversationHistoryItem,
} from "@/types/conversation";
import type { GuideId } from "@/types/guide";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 1_000;
const MAX_HISTORY_ITEM_LENGTH = 2_000;
const MAX_RECEIVED_HISTORY_MESSAGES = 30;
const MAX_LANGUAGE_LENGTH = 40;
const MAX_SESSION_ID_LENGTH = 200;
const sessionManager = new SessionManager({
  store: new InMemorySessionStore(),
});
const orchestrator = new AIOrchestrator(
  new OrchestratorPipeline({ sessionManager }),
);

function errorResponse({
  code,
  message,
  requestId,
  status,
}: {
  code: ConversationApiErrorCode;
  message: string;
  requestId: string;
  status: number;
}) {
  return NextResponse.json<ConversationApiResponse>(
    {
      success: false,
      response: "",
      error: { code, message, requestId },
    },
    { status },
  );
}

function isGuideId(value: unknown): value is GuideId {
  return typeof value === "string" && value in guides;
}

function isHistoryItem(value: unknown): value is ConversationHistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    (item.role === "visitor" || item.role === "guide") &&
    typeof item.content === "string" &&
    item.content.trim().length > 0 &&
    item.content.length <= MAX_HISTORY_ITEM_LENGTH
  );
}

function validateRequest(value: unknown): ConversationApiRequest | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const request = value as Record<string, unknown>;

  if (
    typeof request.message !== "string" ||
    request.message.trim().length === 0 ||
    request.message.length > MAX_MESSAGE_LENGTH ||
    !isGuideId(request.guideId) ||
    (request.language !== undefined &&
      (typeof request.language !== "string" ||
        request.language.trim().length === 0 ||
        request.language.length > MAX_LANGUAGE_LENGTH)) ||
    (request.sessionId !== undefined &&
      (typeof request.sessionId !== "string" ||
        request.sessionId.length === 0 ||
        request.sessionId.length > MAX_SESSION_ID_LENGTH)) ||
    !Array.isArray(request.history) ||
    request.history.length > MAX_RECEIVED_HISTORY_MESSAGES ||
    !request.history.every(isHistoryItem)
  ) {
    return null;
  }

  return {
    message: request.message.trim(),
    guideId: request.guideId,
    history: request.history.slice(-MAX_OPENAI_HISTORY_MESSAGES),
    language:
      typeof request.language === "string"
        ? request.language.trim()
        : undefined,
    sessionId:
      typeof request.sessionId === "string"
        ? request.sessionId
        : undefined,
  };
}

function getOpenAIErrorStatus(error: unknown) {
  if (error instanceof InvalidOrchestratorInputError) return 400;
  if (error instanceof SessionUnavailableError) return 409;
  if (error instanceof OpenAIFailureError) return 503;
  return error instanceof AIOrchestratorError ? 500 : 502;
}

function errorChainIncludes(
  error: unknown,
  predicate: (candidate: Error) => boolean,
) {
  let candidate = error;
  const visited = new Set<unknown>();

  while (candidate instanceof Error && !visited.has(candidate)) {
    if (predicate(candidate)) {
      return true;
    }

    visited.add(candidate);
    candidate = candidate.cause;
  }

  return false;
}

function getPublicErrorCode(error: unknown): ConversationApiErrorCode {
  if (
    errorChainIncludes(
      error,
      (candidate) => candidate instanceof MissingOpenAIKeyError,
    )
  ) {
    return "MISSING_API_KEY";
  }

  if (
    errorChainIncludes(
      error,
      (candidate) =>
        candidate.name === "APIConnectionTimeoutError" ||
        candidate.name === "TimeoutError" ||
        /timed?\s*out|timeout/i.test(candidate.message),
    )
  ) {
    return "REQUEST_TIMEOUT";
  }

  if (error instanceof InvalidOrchestratorInputError) {
    return "INVALID_REQUEST";
  }

  if (error instanceof SessionUnavailableError) {
    return "SESSION_UNAVAILABLE";
  }

  return "SERVICE_UNAVAILABLE";
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse({
      code: "INVALID_REQUEST",
      message: "The conversation request could not be processed.",
      requestId,
      status: 400,
    });
  }

  const conversationRequest = validateRequest(body);

  if (!conversationRequest) {
    return errorResponse({
      code: "INVALID_REQUEST",
      message: "The conversation request could not be processed.",
      requestId,
      status: 400,
    });
  }

  try {
    const usableSessionId =
      conversationRequest.sessionId &&
      sessionManager.readSession(conversationRequest.sessionId)?.status ===
        "active"
        ? conversationRequest.sessionId
        : undefined;
    const result = await orchestrator.handleMessage({
      message: conversationRequest.message,
      guide: guides[conversationRequest.guideId],
      sessionId: usableSessionId,
      language: conversationRequest.language,
    });

    return NextResponse.json<ConversationApiResponse>({
      success: true,
      response: result.response,
      sessionId: result.sessionId,
      requestId,
    });
  } catch (error) {
    const status = getOpenAIErrorStatus(error);
    const code = getPublicErrorCode(error);

    console.error("[conversation-api] Conversation request failed", {
      requestId,
      name: error instanceof Error ? error.name : "UnknownError",
      status,
      publicCode: code,
      orchestratorCode:
        error instanceof AIOrchestratorError ? error.code : undefined,
    });

    return errorResponse({
      code,
      message: "The conversation service is temporarily unavailable.",
      requestId,
      status,
    });
  }
}

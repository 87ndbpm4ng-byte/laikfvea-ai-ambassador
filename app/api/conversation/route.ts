import { NextResponse } from "next/server";
import { MAX_OPENAI_HISTORY_MESSAGES } from "@/lib/ai/openai-response-engine";
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

function errorResponse(error: string, status: number) {
  return NextResponse.json<ConversationApiResponse>(
    { success: false, response: "", error },
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

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON request.", 400);
  }

  const conversationRequest = validateRequest(body);

  if (!conversationRequest) {
    return errorResponse("Invalid conversation request.", 400);
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
    });
  } catch (error) {
    const status = getOpenAIErrorStatus(error);

    console.error("[conversation-api] OpenAI request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      status,
      code: error instanceof AIOrchestratorError ? error.code : undefined,
    });

    return errorResponse(
      "The conversation service is temporarily unavailable.",
      status,
    );
  }
}

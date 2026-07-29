import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  EmptyOpenAIResponseError,
  MAX_OPENAI_HISTORY_MESSAGES,
  MissingOpenAIKeyError,
  generateOpenAIResponse,
} from "@/lib/ai/openai-response-engine";
import { guides } from "@/lib/data/guides";
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
  };
}

function getOpenAIErrorStatus(error: unknown) {
  if (error instanceof MissingOpenAIKeyError) {
    return 503;
  }

  if (error instanceof OpenAI.RateLimitError) {
    return 429;
  }

  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return 504;
  }

  if (error instanceof OpenAI.APIError && error.status >= 400) {
    return error.status >= 500 ? 502 : error.status;
  }

  return 502;
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
    const response = await generateOpenAIResponse({
      message: conversationRequest.message,
      guide: guides[conversationRequest.guideId],
      history: conversationRequest.history,
    });

    return NextResponse.json<ConversationApiResponse>({
      success: true,
      response,
    });
  } catch (error) {
    const status = getOpenAIErrorStatus(error);

    console.error("[conversation-api] OpenAI request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      status,
      requestId:
        error instanceof OpenAI.APIError ? error.requestID : undefined,
      emptyResponse: error instanceof EmptyOpenAIResponseError,
    });

    return errorResponse(
      status === 429
        ? "The conversation service is temporarily busy."
        : "The conversation service is temporarily unavailable.",
      status,
    );
  }
}

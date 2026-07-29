import {
  placeholderFallbackResponse,
  placeholderResponses,
} from "@/lib/data/placeholder-responses";
import { suggestedQuestions } from "@/lib/data/suggested-questions";
import type {
  ConversationApiResponse,
  ConversationHistoryItem,
} from "@/types/conversation";
import type { Guide } from "@/types/guide";
import type { ProductId } from "@/types/product";

export type ResponseRequest = {
  content: string;
  guide: Guide;
  history: ConversationHistoryItem[];
  language?: string;
  questionId?: string;
  relatedProduct?: ProductId;
  sessionId?: string;
};

export type ResponseResult = {
  content: string;
  relatedProduct?: ProductId;
  sessionId?: string;
};

export function generateLocalConversationResponse({
  content,
  questionId,
  relatedProduct,
}: Omit<ResponseRequest, "guide" | "history">): ResponseResult {
  const normalizedContent = content.trim().toLocaleLowerCase();
  const matchedQuestion = suggestedQuestions.find(
    (question) =>
      question.id === questionId ||
      question.label.toLocaleLowerCase() === normalizedContent,
  );

  if (matchedQuestion) {
    return {
      content: placeholderResponses[matchedQuestion.responseKey],
      relatedProduct: matchedQuestion.relatedProduct ?? relatedProduct,
    };
  }

  return {
    content: placeholderFallbackResponse,
    relatedProduct,
  };
}

async function requestOpenAIResponse({
  content,
  guide,
  history,
  language,
  sessionId,
}: ResponseRequest): Promise<ConversationApiResponse> {
  const response = await fetch("/api/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: content,
      guideId: guide.id,
      history,
      language,
      sessionId,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const result: unknown = await response.json();

  if (
    !response.ok ||
    !isConversationApiResponse(result) ||
    !result.success ||
    !result.response.trim()
  ) {
    throw new Error("OpenAI response unavailable.");
  }

  return {
    ...result,
    response: result.response.trim(),
  };
}

function isConversationApiResponse(
  value: unknown,
): value is ConversationApiResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    typeof result.success === "boolean" &&
    typeof result.response === "string" &&
    (result.error === undefined || typeof result.error === "string")
  );
}

export async function generateConversationResponse(
  request: ResponseRequest,
): Promise<ResponseResult> {
  try {
    // A future knowledge-base or alternative provider can replace this
    // request while preserving the response-engine contract used by the UI.
    const response = await requestOpenAIResponse(request);

    return {
      content: response.response,
      relatedProduct: request.relatedProduct,
      sessionId: response.sessionId,
    };
  } catch {
    return generateLocalConversationResponse(request);
  }
}

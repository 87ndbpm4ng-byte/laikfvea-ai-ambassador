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
  questionId?: string;
  relatedProduct?: ProductId;
};

export type ResponseResult = {
  content: string;
  relatedProduct?: ProductId;
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
}: ResponseRequest): Promise<string> {
  const response = await fetch("/api/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: content,
      guideId: guide.id,
      history,
    }),
  });

  const result = (await response.json()) as ConversationApiResponse;

  if (!response.ok || !result.success || !result.response.trim()) {
    throw new Error("OpenAI response unavailable.");
  }

  return result.response.trim();
}

export async function generateConversationResponse(
  request: ResponseRequest,
): Promise<ResponseResult> {
  try {
    const response = await requestOpenAIResponse(request);

    return {
      content: response,
      relatedProduct: request.relatedProduct,
    };
  } catch {
    return generateLocalConversationResponse(request);
  }
}

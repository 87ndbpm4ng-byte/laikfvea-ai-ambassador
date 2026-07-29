import {
  placeholderFallbackResponse,
  placeholderResponses,
} from "@/lib/data/placeholder-responses";
import { suggestedQuestions } from "@/lib/data/suggested-questions";
import type { Guide } from "@/types/guide";
import type { ProductId } from "@/types/product";

export type ResponseRequest = {
  content: string;
  guide: Guide;
  questionId?: string;
  relatedProduct?: ProductId;
};

export type ResponseResult = {
  content: string;
  relatedProduct?: ProductId;
};

export async function generateConversationResponse({
  content,
  questionId,
  relatedProduct,
}: ResponseRequest): Promise<ResponseResult> {
  const normalizedContent = content.trim().toLocaleLowerCase();
  const matchedQuestion = suggestedQuestions.find(
    (question) =>
      question.id === questionId ||
      question.label.toLocaleLowerCase() === normalizedContent,
  );

  // Future OpenAI or other provider integration replaces this local lookup.
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

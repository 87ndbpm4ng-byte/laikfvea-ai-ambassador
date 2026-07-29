import {
  placeholderFallbackResponse,
  placeholderResponses,
} from "@/lib/data/placeholder-responses";
import { suggestedQuestions } from "@/lib/data/suggested-questions";
import type {
  ConversationApiErrorCode,
  ConversationApiResponse,
  ConversationApiSuccessResponse,
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
  demoFallback?: "suggested-question";
};

export type ResponseResult = {
  content: string;
  relatedProduct?: ProductId;
  sessionId?: string;
};

export const serviceUnavailableResponse =
  "I’m unable to access the product information service right now. Please try again in a moment.";

type ConversationFailureKind =
  | "http"
  | "invalid-json"
  | "invalid-response"
  | "network"
  | "timeout";

export class ConversationRequestError extends Error {
  constructor(
    readonly kind: ConversationFailureKind,
    readonly diagnostics: {
      status?: number;
      apiErrorCode?: ConversationApiErrorCode;
      requestId?: string;
      responseBody?: string;
    } = {},
    options?: ErrorOptions,
  ) {
    super("The conversation service request failed.", options);
    this.name = "ConversationRequestError";
  }
}

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

function isAbortTimeout(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" ||
      error.name === "AbortError" ||
      /timed?\s*out|timeout/i.test(error.message))
  );
}

function logDevelopmentFailure(error: ConversationRequestError) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error("[conversation-client] Request failed", {
    kind: error.kind,
    status: error.diagnostics.status,
    apiErrorCode: error.diagnostics.apiErrorCode,
    requestId: error.diagnostics.requestId,
    responseBody: error.diagnostics.responseBody,
  });
}

async function requestOpenAIResponse({
  content,
  guide,
  history,
  language,
  sessionId,
}: ResponseRequest): Promise<ConversationApiSuccessResponse> {
  let response: Response;

  try {
    response = await fetch("/api/conversation", {
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
  } catch (error) {
    throw new ConversationRequestError(
      isAbortTimeout(error) ? "timeout" : "network",
      {},
      { cause: error },
    );
  }

  const responseBody = await response.text();
  let result: unknown;

  try {
    result = JSON.parse(responseBody);
  } catch (error) {
    throw new ConversationRequestError(
      "invalid-json",
      {
        status: response.status,
        responseBody: responseBody.slice(0, 1_000),
      },
      { cause: error },
    );
  }

  if (!isConversationApiResponse(result)) {
    throw new ConversationRequestError("invalid-response", {
      status: response.status,
      responseBody: responseBody.slice(0, 1_000),
    });
  }

  if (!response.ok || !result.success) {
    throw new ConversationRequestError("http", {
      status: response.status,
      apiErrorCode: result.success ? undefined : result.error.code,
      requestId: result.success ? result.requestId : result.error.requestId,
      responseBody: responseBody.slice(0, 1_000),
    });
  }

  if (!result.response.trim()) {
    throw new ConversationRequestError("invalid-response", {
      status: response.status,
      requestId: result.requestId,
      responseBody: responseBody.slice(0, 1_000),
    });
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

  if (result.success === true) {
    return (
      typeof result.response === "string" &&
      (result.sessionId === undefined ||
        typeof result.sessionId === "string") &&
      (result.requestId === undefined ||
        typeof result.requestId === "string")
    );
  }

  if (
    result.success !== false ||
    result.response !== "" ||
    !result.error ||
    typeof result.error !== "object"
  ) {
    return false;
  }

  const error = result.error as Record<string, unknown>;

  return (
    typeof error.code === "string" &&
    typeof error.message === "string" &&
    typeof error.requestId === "string"
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
  } catch (error) {
    const requestError =
      error instanceof ConversationRequestError
        ? error
        : new ConversationRequestError("network", {}, { cause: error });

    logDevelopmentFailure(requestError);

    if (request.demoFallback === "suggested-question" && request.questionId) {
      return generateLocalConversationResponse(request);
    }

    return {
      content: serviceUnavailableResponse,
      relatedProduct: request.relatedProduct,
    };
  }
}

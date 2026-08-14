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
import type { SupportedLanguage } from "@/types/language";
import { isProductId } from "@/lib/data/exhibition-products";
import {
  analyzeCommercialIntent,
  commercialHandoffResponse,
} from "@/lib/orchestrator/commercial-handoff";

export type ResponseRequest = {
  content: string;
  guide: Guide;
  history: ConversationHistoryItem[];
  language?: SupportedLanguage;
  questionId?: string;
  relatedProduct?: ProductId;
  sessionId?: string;
  demoFallback?: "suggested-question";
  signal?: AbortSignal;
};

export type ResponseResult = {
  content: string;
  relatedProduct?: ProductId;
  sessionId?: string;
  resolvedActiveProduct?: ProductId;
  speakable?: boolean;
};

export const serviceUnavailableResponse =
  "I’m unable to access the product information service right now. Please try again in a moment.";

export function getServiceUnavailableResponse(language?: SupportedLanguage) {
  if (language === "ru") {
    return "Сейчас мне не удаётся получить доступ к информации о продукте. Пожалуйста, попробуйте ещё раз через минуту.";
  }
  if (language === "zh") {
    return "暂时无法获取产品信息，请稍后再试。";
  }
  if (language === "yue") {
    return "暫時未能取得產品資料，請稍後再試。";
  }
  if (language === "fr") {
    return "Les informations produit sont momentanément indisponibles. Veuillez réessayer dans un instant.";
  }
  return serviceUnavailableResponse;
}

export async function deleteConversationSession(sessionId: string) {
  try {
    const response = await fetch(
      `/api/conversation?sessionId=${encodeURIComponent(sessionId)}`,
      { method: "DELETE", signal: AbortSignal.timeout(3_000) },
    );
    return response.ok;
  } catch {
    return false;
  }
}

function unavailableResult(request: ResponseRequest, kind: ConversationFailureKind): ResponseResult {
  const commercial = analyzeCommercialIntent(request.content, request.language);
  const handoff = commercialHandoffResponse(request.language);
  const recovery = getConversationFailureResponse(kind, request.language);

  return {
    content:
      commercial.kind === "pure"
        ? handoff
        : commercial.kind === "mixed"
          ? `${recovery} ${handoff}`
          : recovery,
    relatedProduct: request.relatedProduct,
    speakable: false,
  };
}

export function getConversationFailureResponse(
  kind: ConversationFailureKind,
  language?: SupportedLanguage,
) {
  if (kind === "network") {
    if (language === "ru") return "Сейчас не удалось подключиться. Попробуйте ещё раз или выберите быстрый вопрос.";
    if (language === "zh") return "目前无法连接。请重试或选择快捷问题。";
    if (language === "yue") return "而家暫時連線唔到。請再試或者揀快速問題。";
    if (language === "fr") return "Je ne peux pas me connecter pour le moment. Réessayez ou choisissez une question rapide.";
    return "I couldn’t connect right now. Please try again, or choose a Quick Question.";
  }

  if (kind === "timeout") {
    if (language === "ru") return "Ответ занял слишком много времени. Попробуйте задать вопрос ещё раз.";
    if (language === "zh") return "回答时间过长，请重新提问。";
    if (language === "yue") return "回答等咗太耐，請再問一次。";
    if (language === "fr") return "La réponse prend trop de temps. Veuillez poser à nouveau votre question.";
    return "The response is taking too long. Please ask your question again.";
  }

  return getServiceUnavailableResponse(language);
}

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
  relatedProduct,
  sessionId,
  signal,
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
        activeProduct: relatedProduct,
      }),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(25_000)])
        : AbortSignal.timeout(25_000),
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
        typeof result.requestId === "string") &&
      (result.resolvedActiveProduct === undefined ||
        isProductId(result.resolvedActiveProduct))
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
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return unavailableResult(request, "network");
  }

  try {
    // A future knowledge-base or alternative provider can replace this
    // request while preserving the response-engine contract used by the UI.
    const response = await requestOpenAIResponse(request);

    return {
      content: response.response,
      relatedProduct: request.relatedProduct,
      sessionId: response.sessionId,
      resolvedActiveProduct: response.resolvedActiveProduct,
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

    return unavailableResult(request, requestError.kind);
  }
}

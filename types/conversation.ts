import type { ProductId } from "@/types/product";
import type { GuideId } from "@/types/guide";
import type { SupportedLanguage } from "@/types/language";

export type ConversationRole = "visitor" | "guide" | "system";

export type PlaceholderResponseKey =
  | "hydrogen-water-overview"
  | "product-comparison"
  | "product-guidance"
  | "hydrogen-inhalation";

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  content: string;
  timestamp: string;
  relatedProduct?: ProductId;
  questionId?: string;
  source?: QuestionSubmissionSource;
};

export type ConversationHistoryItem = {
  role: Extract<ConversationRole, "visitor" | "guide">;
  content: string;
};

export type QuestionSubmissionSource =
  | "typed"
  | "voice"
  | "quick-topic"
  | "product";

export type QuestionSubmission = {
  content: string;
  source: QuestionSubmissionSource;
  questionId?: string;
  relatedProduct?: ProductId;
};

export type ConversationApiRequest = {
  message: string;
  guideId: GuideId;
  history: ConversationHistoryItem[];
  language?: SupportedLanguage;
  sessionId?: string;
  activeProduct?: ProductId;
};

export type ConversationApiErrorCode =
  | "INVALID_REQUEST"
  | "SESSION_UNAVAILABLE"
  | "MISSING_API_KEY"
  | "REQUEST_TIMEOUT"
  | "SERVICE_UNAVAILABLE";

export type ConversationApiSuccessResponse = {
  success: true;
  response: string;
  sessionId?: string;
  requestId?: string;
};

export type ConversationApiErrorResponse = {
  success: false;
  response: "";
  error: {
    code: ConversationApiErrorCode;
    message: string;
    requestId: string;
  };
};

export type ConversationApiResponse =
  | ConversationApiSuccessResponse
  | ConversationApiErrorResponse;

export type SuggestedQuestion = {
  id: string;
  label: string;
  category: "technology" | "products" | "guidance";
  responseKey: PlaceholderResponseKey;
  relatedProduct?: ProductId;
};

export type JourneyScreen =
  | "idle"
  | "language"
  | "conversation"
  | "products"
  | "product-detail"
  | "comparison"
  | "end";

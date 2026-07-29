import type { ProductId } from "@/types/product";

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
};

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
  | "guide"
  | "introduction"
  | "conversation"
  | "products"
  | "product-detail"
  | "comparison"
  | "end";

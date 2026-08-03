import type { ConversationMessage } from "@/types/conversation";

export type PresentationType =
  | "product"
  | "comparison"
  | "infographic"
  | "feature";

export type PresentationAssetId =
  | "go-bottle"
  | "pro-bottle"
  | "go-vs-pro"
  | "hydrogen-water"
  | "oxidative-stress"
  | "hydrogen-process"
  | "hydrogen-inhalation"
  | "premium-materials"
  | "mineralisation"
  | "charging"
  | "maintenance";

export type Presentation = {
  type: PresentationType;
  asset: PresentationAssetId;
};

export type PresentationAsset = Presentation & {
  title: string;
  alt: string;
  src: string;
  fit: "contain" | "cover";
};

export type PresentationConversationState = {
  messages: readonly ConversationMessage[];
};

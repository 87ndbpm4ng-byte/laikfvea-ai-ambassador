import type { ConversationMessage } from "@/types/conversation";

export type PresentationType =
  | "product"
  | "comparison"
  | "infographic"
  | "feature";

export type PresentationPlacement = "conversation-support";

export type PresentationDuration = "until-topic-change";

export type PresentationLayout =
  | "product-portrait"
  | "wide-comparison"
  | "diagram"
  | "feature-detail";

export type PresentationMedia = {
  kind: "image";
  src: string;
};

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
  placement: PresentationPlacement;
  duration: PresentationDuration;
};

export type PresentationAsset = {
  id: PresentationAssetId;
  title: string;
  category: PresentationType;
  layout: PresentationLayout;
  tags: readonly string[];
  alt: string;
  media: PresentationMedia;
  fit: "contain" | "cover";
};

export type PresentationConversationState = {
  messages: readonly ConversationMessage[];
};

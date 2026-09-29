import type { SupportedLanguage } from "@/types/language";

export const PRODUCT_IDS = [
  "everyday",
  "advanced",
  "water-ionizer",
  "face-body-generator",
  "water-mineralizer",
  "air-purifier",
  "air-humidifier",
] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];
/** Products presented in the Hong Kong exhibition catalogue. */
export const EXHIBITION_PRODUCT_IDS = [
  "air-purifier",
  "water-ionizer",
  "advanced",
  "everyday",
  "air-humidifier",
  "face-body-generator",
] as const satisfies readonly ProductId[];

export type ExhibitionProductId = (typeof EXHIBITION_PRODUCT_IDS)[number];
export type BottleProductId = Extract<ProductId, "everyday" | "advanced">;

export const PRODUCT_CATEGORY_IDS = [
  "functional-water",
  "indoor-environment",
] as const;
export type ProductCategoryId = (typeof PRODUCT_CATEGORY_IDS)[number];

export type ProductKnowledgeStatus = "approved" | "pending";

export type ExhibitionProduct = {
  id: ProductId;
  exhibitionName: string;
  category: ProductCategoryId;
  displayNames: Readonly<Record<SupportedLanguage, string>>;
  aliases: readonly string[];
  knowledgeStatus: ProductKnowledgeStatus;
  knowledgeProductNames: readonly string[];
  presentationAssetId: string | null;
  comparableWith: readonly ProductId[];
  capabilities: readonly string[];
};

export type Product = {
  id: BottleProductId;
  shortName: string;
  name: string;
  overview: string;
  features: readonly string[];
  useCases: readonly string[];
};

export type ProductComparisonRow = {
  id: string;
  label: string;
  everyday: string;
  advanced: string;
};

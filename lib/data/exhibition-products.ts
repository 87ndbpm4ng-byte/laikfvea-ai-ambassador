import type {
  ExhibitionProduct,
  ProductCategoryId,
  ProductId,
} from "@/types/product";

export const productCategoryNames = {
  "functional-water": {
    en: "Functional Water",
    ru: "Функциональная вода",
    zh: "功能水",
    yue: "功能水",
    fr: "Eau fonctionnelle",
  },
  "clean-air": {
    en: "Clean Air",
    ru: "Чистый воздух",
    zh: "洁净空气",
    yue: "潔淨空氣",
    fr: "Air pur",
  },
} as const satisfies Readonly<
  Record<ProductCategoryId, Readonly<Record<"en" | "ru" | "zh" | "yue" | "fr", string>>>
>;

/**
 * Structural exhibition portfolio metadata only.
 *
 * This registry establishes identity and relationships. It is not approved
 * product knowledge and must never be used as evidence for factual answers.
 */
export const exhibitionProducts = {
  everyday: {
    id: "everyday",
    exhibitionName: "Hydrogen Water Bottle GO",
    category: "functional-water",
    displayNames: {
      en: "Hydrogen Water Bottle GO",
      ru: "Бутылка для водородной воды GO",
      zh: "GO 氢水瓶",
      yue: "GO 氫水樽",
      fr: "Bouteille d’eau hydrogénée GO",
    },
    aliases: ["GO", "GO bottle", "Hydrogen Water Bottle GO", "Everyday Bottle"],
    knowledgeStatus: "approved",
    knowledgeProductNames: ["everyday", "Everyday Bottle"],
    presentationAssetId: "go-bottle",
    comparableWith: ["advanced"],
    capabilities: [],
  },
  advanced: {
    id: "advanced",
    exhibitionName: "Hydrogen Water Bottle PRO",
    category: "functional-water",
    displayNames: {
      en: "Hydrogen Water Bottle PRO",
      ru: "Бутылка для водородной воды PRO",
      zh: "PRO 氢水瓶",
      yue: "PRO 氫水樽",
      fr: "Bouteille d’eau hydrogénée PRO",
    },
    aliases: ["PRO", "PRO bottle", "Hydrogen Water Bottle PRO", "Advanced Bottle"],
    knowledgeStatus: "approved",
    knowledgeProductNames: ["advanced", "Advanced Bottle"],
    presentationAssetId: "pro-bottle",
    comparableWith: ["everyday"],
    capabilities: ["hydrogen-inhalation", "mineralisation-feature"],
  },
  "water-ionizer": {
    id: "water-ionizer",
    exhibitionName: "Water Ionizer",
    category: "functional-water",
    displayNames: {
      en: "Water Ionizer",
      ru: "Ионизатор воды",
      zh: "水离子机",
      yue: "水離子機",
      fr: "Ioniseur d’eau",
    },
    aliases: ["Water Ionizer"],
    knowledgeStatus: "approved",
    knowledgeProductNames: ["water-ionizer", "Water Ionizer"],
    presentationAssetId: null,
    comparableWith: [],
    capabilities: [],
  },
  "face-body-generator": {
    id: "face-body-generator",
    exhibitionName: "Hydrogen Water Generator for Face & Body",
    category: "functional-water",
    displayNames: {
      en: "Hydrogen Water Generator for Face & Body",
      ru: "Генератор водородной воды для лица и тела",
      zh: "面部及身体用氢水生成器",
      yue: "面部及身體用氫水生成器",
      fr: "Générateur d’eau hydrogénée pour le visage et le corps",
    },
    aliases: ["Hydrogen Water Generator for Face & Body"],
    knowledgeStatus: "pending",
    knowledgeProductNames: [
      "face-body-generator",
      "Hydrogen Water Generator for Face & Body",
    ],
    presentationAssetId: null,
    comparableWith: [],
    capabilities: [],
  },
  "water-mineralizer": {
    id: "water-mineralizer",
    exhibitionName: "Water Mineralizer",
    category: "functional-water",
    displayNames: {
      en: "Water Mineralizer",
      ru: "Минерализатор воды",
      zh: "水矿化器",
      yue: "水礦化器",
      fr: "Minéralisateur d’eau",
    },
    aliases: ["Water Mineralizer"],
    knowledgeStatus: "pending",
    knowledgeProductNames: ["water-mineralizer", "Water Mineralizer"],
    presentationAssetId: null,
    comparableWith: [],
    capabilities: [],
  },
  "air-purifier": {
    id: "air-purifier",
    exhibitionName: "Air Purifier",
    category: "clean-air",
    displayNames: {
      en: "Air Purifier",
      ru: "Очиститель воздуха",
      zh: "空气净化器",
      yue: "空氣淨化器",
      fr: "Purificateur d’air",
    },
    aliases: ["Air Purifier"],
    knowledgeStatus: "pending",
    knowledgeProductNames: ["air-purifier", "Air Purifier"],
    presentationAssetId: null,
    comparableWith: [],
    capabilities: [],
  },
} as const satisfies Readonly<Record<ProductId, ExhibitionProduct>>;

export const exhibitionProductList: readonly ExhibitionProduct[] =
  Object.values(exhibitionProducts);

export function isProductId(value: unknown): value is ProductId {
  return typeof value === "string" && value in exhibitionProducts;
}

export function resolveKnowledgeProductId(value: unknown): ProductId | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLocaleLowerCase("en");
  return (
    exhibitionProductList.find((product) =>
      product.knowledgeProductNames.some(
        (name) => name.toLocaleLowerCase("en") === normalized,
      ),
    )?.id ?? null
  );
}

import type {
  Product,
  ProductComparisonRow,
  ProductId,
} from "@/types/product";

export const products: Record<ProductId, Product> = {
  everyday: {
    id: "everyday",
    shortName: "Everyday",
    name: "Everyday Bottle",
    overview:
      "A compact everyday bottle designed for portable hydrogen water generation.",
    features: [
      "Compact everyday bottle",
      "Hydrogen water generation",
      "Portable design",
    ],
    useCases: ["Everyday use", "Portable use"],
  },
  advanced: {
    id: "advanced",
    shortName: "Advanced",
    name: "Advanced Bottle",
    overview:
      "An advanced hydrogen bottle with hydrogen water generation and additional capabilities.",
    features: [
      "Advanced hydrogen bottle",
      "Hydrogen water generation",
      "Inhalation capability",
      "Mineralisation support",
    ],
    useCases: ["Advanced use", "Hydrogen inhalation"],
  },
};

export const productComparisonRows: readonly ProductComparisonRow[] = [
  {
    id: "intended-use",
    label: "Intended use",
    everyday: "Everyday use",
    advanced: "Advanced use",
  },
  {
    id: "portability",
    label: "Portability",
    everyday: "Portable design",
    advanced: "Advanced bottle",
  },
  {
    id: "hydrogen-water",
    label: "Hydrogen water",
    everyday: "Included",
    advanced: "Included",
  },
  {
    id: "inhalation",
    label: "Inhalation",
    everyday: "Not included",
    advanced: "Included",
  },
  {
    id: "mineralisation",
    label: "Mineralisation",
    everyday: "Not included",
    advanced: "Included",
  },
];

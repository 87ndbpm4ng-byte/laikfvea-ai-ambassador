export type ProductId = "everyday" | "advanced";

export type Product = {
  id: ProductId;
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

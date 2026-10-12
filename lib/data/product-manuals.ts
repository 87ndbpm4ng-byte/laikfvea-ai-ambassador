export type ProductManualId = "everyday" | "advanced" | "water-ionizer" | "air-purifier";

export type ProductManual = {
  id: ProductManualId;
  href: string;
  filename?: string;
};

export const productManuals: readonly ProductManual[] = [
  { id: "water-ionizer", href: "/manuals/water-ionizer-user-manual.pdf", filename: "water-ionizer-user-manual.pdf" },
  { id: "air-purifier", href: "/manuals/air-purifier-user-manual.pdf", filename: "air-purifier-user-manual.pdf" },
  { id: "advanced", href: "/manuals/pro-user-manual.pdf", filename: "pro-user-manual.pdf" },
  { id: "everyday", href: "/manuals/go-user-manual.pdf", filename: "go-user-manual.pdf" },
];

export function getProductManual(productId: string): ProductManual | null {
  return productManuals.find((manual) => manual.id === productId) ?? null;
}

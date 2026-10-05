export type ProductManualId = "everyday" | "advanced" | "water-ionizer";

export type ProductManual = {
  id: ProductManualId;
  href: string;
};

export const productManuals: readonly ProductManual[] = [
  { id: "water-ionizer", href: "/manuals/water-ionizer-user-manual.pdf" },
  { id: "advanced", href: "/manuals/pro-user-manual.pdf" },
  { id: "everyday", href: "/manuals/go-user-manual.pdf" },
];

export function getProductManual(productId: string): ProductManual | null {
  return productManuals.find((manual) => manual.id === productId) ?? null;
}

export type ProductManualId = "everyday" | "advanced";

export type ProductManual = {
  id: ProductManualId;
  href: string;
};

export const productManuals: readonly ProductManual[] = [
  { id: "everyday", href: "/manuals/go-user-manual.pdf" },
  { id: "advanced", href: "/manuals/pro-user-manual.pdf" },
];

export function getProductManual(productId: string): ProductManual | null {
  return productManuals.find((manual) => manual.id === productId) ?? null;
}

import type { ProductId } from "@/types/product";

/** Server session resolution wins; an omitted resolution preserves valid context. */
export function reconcileActiveProduct(
  currentProduct: ProductId | undefined,
  resolvedProduct: ProductId | undefined,
) {
  return resolvedProduct ?? currentProduct;
}

import assert from "node:assert/strict";
import test from "node:test";
import {
  exhibitionProductList,
  exhibitionProducts,
  isProductId,
  productCategoryNames,
  resolveKnowledgeProductId,
} from "@/lib/data/exhibition-products";
import { products } from "@/lib/data/products";
import { PRODUCT_CATEGORY_IDS, PRODUCT_IDS } from "@/types/product";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";

test("the registry contains the six Hong Kong exhibition products", () => {
  assert.deepEqual(PRODUCT_IDS, [
    "everyday",
    "advanced",
    "water-ionizer",
    "face-body-generator",
    "water-mineralizer",
    "air-purifier",
  ]);
  assert.deepEqual(exhibitionProductList.map(({ id }) => id), PRODUCT_IDS);
  for (const id of PRODUCT_IDS) assert.equal(isProductId(id), true);
  assert.equal(isProductId("unknown-product"), false);
});

test("portfolio categories match the physical exhibition", () => {
  assert.deepEqual(PRODUCT_CATEGORY_IDS, ["functional-water", "clean-air"]);
  for (const id of PRODUCT_IDS.filter((id) => id !== "air-purifier")) {
    assert.equal(exhibitionProducts[id].category, "functional-water", id);
  }
  assert.equal(exhibitionProducts["air-purifier"].category, "clean-air");
});

test("GO and PRO retain compatible internal identities and their pair relationship", () => {
  assert.equal(products.everyday.id, "everyday");
  assert.equal(products.advanced.id, "advanced");
  assert.deepEqual(exhibitionProducts.everyday.comparableWith, ["advanced"]);
  assert.deepEqual(exhibitionProducts.advanced.comparableWith, ["everyday"]);
  for (const id of PRODUCT_IDS.filter((id) => id !== "everyday" && id !== "advanced")) {
    assert.deepEqual(exhibitionProducts[id].comparableWith, [], id);
  }
});

test("knowledge availability is explicit and does not become factual content", () => {
  assert.equal(exhibitionProducts.advanced.knowledgeStatus, "approved");
  for (const id of PRODUCT_IDS.filter((id) => id !== "advanced")) {
    assert.equal(exhibitionProducts[id].knowledgeStatus, "pending", id);
  }
  assert.deepEqual(exhibitionProducts["water-mineralizer"].capabilities, []);
  assert.ok(exhibitionProducts.advanced.capabilities.includes("mineralisation-feature"));
  assert.ok(exhibitionProducts.advanced.capabilities.includes("hydrogen-inhalation"));
  assert.ok(!exhibitionProducts["face-body-generator"].capabilities.includes("hydrogen-inhalation"));
});

test("all products and categories have display identities in all five languages", () => {
  for (const { code } of SUPPORTED_LANGUAGES) {
    for (const product of exhibitionProductList) {
      assert.ok(product.displayNames[code].trim(), `${product.id}:${code}`);
    }
    for (const category of PRODUCT_CATEGORY_IDS) {
      assert.ok(productCategoryNames[category][code].trim(), `${category}:${code}`);
    }
  }
});

test("approved metadata names resolve structurally without speculative aliases", () => {
  assert.equal(resolveKnowledgeProductId("Advanced Bottle"), "advanced");
  assert.equal(resolveKnowledgeProductId("Everyday Bottle"), "everyday");
  assert.equal(resolveKnowledgeProductId("Water Mineralizer"), "water-mineralizer");
  assert.equal(resolveKnowledgeProductId("mineralisation"), null);
  assert.equal(resolveKnowledgeProductId("hydrogen generator"), null);
});

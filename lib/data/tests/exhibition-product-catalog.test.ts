import assert from "node:assert/strict";
import test from "node:test";
import {
  exhibitionProductCatalog,
  getExhibitionProductCatalog,
} from "@/lib/data/exhibition-product-catalog";
import { exhibitionProductList } from "@/lib/data/exhibition-products";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";

test("each visible exhibition product has a localized, image-led catalogue entry", () => {
  assert.deepEqual(Object.keys(exhibitionProductCatalog), exhibitionProductList.map(({ id }) => id));

  for (const product of exhibitionProductList) {
    const entry = getExhibitionProductCatalog(product.id);
    assert.ok(entry.images.length >= 3, product.id);
    assert.match(entry.images[0].src, new RegExp(`/products/`));

    for (const { code } of SUPPORTED_LANGUAGES) {
      assert.ok(entry.description[code].trim(), `${product.id}:${code}:description`);
      assert.equal(entry.atAGlance[code].length, 3, `${product.id}:${code}:facts`);
      assert.ok(entry.howItWorks[code].trim(), `${product.id}:${code}:how-it-works`);
      assert.ok(entry.care[code].trim(), `${product.id}:${code}:care`);
    }
  }
});

test("the final exhibition catalogue excludes the standalone Water Mineralizer", () => {
  assert.equal("water-mineralizer" in exhibitionProductCatalog, false);
  assert.equal("air-humidifier" in exhibitionProductCatalog, true);
});

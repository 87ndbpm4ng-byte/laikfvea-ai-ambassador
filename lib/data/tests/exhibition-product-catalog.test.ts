import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
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
    assert.equal(
      existsSync(path.join(process.cwd(), "public", entry.images[0].src)),
      true,
      `${product.id} primary image exists`,
    );

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

test("Indoor Environment cards use the approved local hero assets", () => {
  const expectedHeroes = {
    "air-purifier": "/products/air-purifier-m-size/hero-white-isolated.png",
    "air-humidifier": "/products/air-humidifier/hero-white-isolated.png",
  } as const;

  for (const [productId, hero] of Object.entries(expectedHeroes)) {
    assert.equal(getExhibitionProductCatalog(productId as keyof typeof expectedHeroes).images[0].src, hero);
    assert.equal(
      existsSync(path.join(process.cwd(), "public", hero)),
      true,
      `${productId} hero exists`,
    );
  }

  assert.ok(
    getExhibitionProductCatalog("air-purifier").images
      .slice(1)
      .some(({ src }) => src === "/products/air-purifier-m-size/hero.png"),
    "silver purifier remains a secondary gallery image",
  );
  assert.ok(
    getExhibitionProductCatalog("air-humidifier").images
      .slice(1)
      .some(({ src }) => src === "/products/air-humidifier/hero-dining-table.png"),
    "dining-table humidifier remains a secondary gallery image",
  );
  assert.ok(
    getExhibitionProductCatalog("air-humidifier").images
      .slice(1)
      .some(({ src }) => src === "/products/air-humidifier/hero.png"),
    "isolated humidifier remains a secondary gallery image",
  );
});

test("Air Purifier keeps its white hero and registers every supplied gallery image once", () => {
  const images = getExhibitionProductCatalog("air-purifier").images;
  const importedSuppliedAssets = [
    "/products/air-purifier-m-size/lifestyle-desk-app.png",
    "/products/air-purifier-m-size/lifestyle-fruit.png",
    "/products/air-purifier-m-size/lifestyle-bedroom.png",
    "/products/air-purifier-m-size/lifestyle-two-purifiers.png",
    "/products/air-purifier-m-size/variant-silver.png",
    "/products/air-purifier-m-size/variant-purple.png",
    "/products/air-purifier-m-size/variant-black.png",
    "/products/air-purifier-m-size/variant-green.png",
    "/products/air-purifier-m-size/variant-gold.png",
    "/products/air-purifier-m-size/variant-turquoise.png",
    "/products/air-purifier-m-size/variant-red.png",
    "/products/air-purifier-m-size/variant-cream.png",
    "/products/air-purifier-m-size/controls-close-up.png",
    "/products/air-purifier-m-size/isolated-white-front.png",
  ] as const;

  const expectedGalleryOrder = [
    "/products/air-purifier-m-size/hero-white-isolated.png",
    "/products/air-purifier-m-size/desk-use.png",
    "/products/air-purifier-m-size/lifestyle-fruit.png",
    "/products/air-purifier-m-size/bedroom-use.png",
    "/products/air-purifier-m-size/lifestyle-two-purifiers.png",
    "/products/air-purifier-m-size/hero.png",
    "/products/air-purifier-m-size/variant-purple.png",
    "/products/air-purifier-m-size/variant-black.png",
    "/products/air-purifier-m-size/variant-green.png",
    "/products/air-purifier-m-size/variant-gold.png",
    "/products/air-purifier-m-size/variant-turquoise.png",
    "/products/air-purifier-m-size/variant-red.png",
    "/products/air-purifier-m-size/variant-cream.png",
    "/products/air-purifier-m-size/controls.png",
  ];

  assert.deepEqual(images.map(({ src }) => src), expectedGalleryOrder);
  assert.equal(new Set(images.map(({ src }) => src)).size, images.length, "gallery paths are unique");

  for (const asset of importedSuppliedAssets) {
    assert.equal(existsSync(path.join(process.cwd(), "public", asset)), true, `${asset} exists`);
  }

  assert.equal(getExhibitionProductCatalog("air-humidifier").images[0].src, "/products/air-humidifier/hero-white-isolated.png");
});

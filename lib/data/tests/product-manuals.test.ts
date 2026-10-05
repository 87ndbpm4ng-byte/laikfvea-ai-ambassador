import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { getProductManual, productManuals } from "@/lib/data/product-manuals";

test("the visitor manual registry contains only the four approved exhibition manuals", () => {
  assert.deepEqual(
    productManuals,
    [
      { id: "water-ionizer", href: "/manuals/water-ionizer-user-manual.pdf" },
      { id: "air-purifier", href: "/manuals/air-purifier-user-manual.pdf" },
      { id: "advanced", href: "/manuals/pro-user-manual.pdf" },
      { id: "everyday", href: "/manuals/go-user-manual.pdf" },
    ],
  );

  for (const manual of productManuals) {
    assert.equal(
      existsSync(path.join(process.cwd(), "public", manual.href)),
      true,
      `${manual.id} public manual exists`,
    );
  }
});

test("only approved visitor manuals resolve from product detail", () => {
  assert.equal(
    getProductManual("water-ionizer")?.href,
    "/manuals/water-ionizer-user-manual.pdf",
  );
  assert.equal(
    getProductManual("air-purifier")?.href,
    "/manuals/air-purifier-user-manual.pdf",
  );
  assert.equal(getProductManual("everyday")?.href, "/manuals/go-user-manual.pdf");
  assert.equal(getProductManual("advanced")?.href, "/manuals/pro-user-manual.pdf");

  for (const productId of ["air-humidifier", "face-body-generator"]) {
    assert.equal(getProductManual(productId), null, productId);
  }
});

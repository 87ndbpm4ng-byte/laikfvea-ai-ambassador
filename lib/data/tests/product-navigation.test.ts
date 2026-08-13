import assert from "node:assert/strict";
import test from "node:test";
import {
  createAskAboutProductQuestion,
  getProductDisplayName,
} from "@/lib/data/product-navigation";
import { PRODUCT_IDS } from "@/types/product";
import type { SupportedLanguage } from "@/types/language";

const languages: readonly SupportedLanguage[] = ["en", "ru", "zh", "yue", "fr"];

test("every exhibition product has a localized question through one shared builder", () => {
  for (const language of languages) {
    for (const productId of PRODUCT_IDS) {
      const name = getProductDisplayName(productId, language);
      const question = createAskAboutProductQuestion(productId, language);

      assert.ok(name.length > 0, `${language}:${productId}:name`);
      assert.ok(question.includes(name), `${language}:${productId}:question`);
      assert.doesNotMatch(question, /undefined|null/i);
    }
  }
});

test("non-English product questions do not fall back to the English builder", () => {
  assert.match(createAskAboutProductQuestion("air-purifier", "ru"), /^Расскажите/);
  assert.match(createAskAboutProductQuestion("air-purifier", "zh"), /^请介绍/);
  assert.match(createAskAboutProductQuestion("air-purifier", "yue"), /^可唔可以/);
  assert.match(createAskAboutProductQuestion("air-purifier", "fr"), /^Présentez-moi/);
});

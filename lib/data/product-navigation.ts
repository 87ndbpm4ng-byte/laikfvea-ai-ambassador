import { exhibitionProducts } from "@/lib/data/exhibition-products";
import type { ProductId } from "@/types/product";
import type { SupportedLanguage } from "@/types/language";

export function getProductDisplayName(
  productId: ProductId,
  language: SupportedLanguage,
) {
  return exhibitionProducts[productId].displayNames[language];
}

export function createAskAboutProductQuestion(
  productId: ProductId,
  language: SupportedLanguage,
) {
  const name = getProductDisplayName(productId, language);
  const builders: Record<SupportedLanguage, (productName: string) => string> = {
    en: (productName) => `Tell me about ${productName}.`,
    ru: (productName) => `Расскажите о продукте «${productName}».`,
    zh: (productName) => `请介绍一下${productName}。`,
    yue: (productName) => `可唔可以介紹一下${productName}？`,
    fr: (productName) => `Présentez-moi ${productName}.`,
  };
  return builders[language](name);
}

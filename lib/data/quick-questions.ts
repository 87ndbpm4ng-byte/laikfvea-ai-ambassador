import { exhibitionProductList } from "@/lib/data/exhibition-products";
import { createKnowledgeQueryText } from "@/lib/i18n/knowledge-query";
import type { SupportedLanguage } from "@/types/language";
import type { ProductId } from "@/types/product";

export type QuickQuestion = {
  id: string;
  label: string;
  relatedProduct?: ProductId;
  action?: "explore-products";
};

type LocalizedQuestion = Readonly<Record<SupportedLanguage, string>>;

function question(
  id: string,
  labels: LocalizedQuestion,
  relatedProduct?: ProductId,
): Readonly<Record<SupportedLanguage, QuickQuestion>> {
  return Object.fromEntries(
    Object.entries(labels).map(([language, label]) => [
      language,
      { id, label, relatedProduct },
    ]),
  ) as Record<SupportedLanguage, QuickQuestion>;
}

const generalQuestions = {
  explore: question("explore-products", {
    en: "Explore products",
    ru: "Посмотреть продукты",
    zh: "浏览产品",
    yue: "睇吓產品",
    fr: "Découvrir les produits",
  }),
  compare: question("compare-go-pro", {
    en: "Compare GO and PRO",
    ru: "Сравнить GO и PRO",
    zh: "比较 GO 和 PRO",
    yue: "比較 GO 同 PRO",
    fr: "Comparer GO et PRO",
  }),
  ionizer: question(
    "water-ionizer-use",
    {
      en: "How do I use the Water Ionizer?",
      ru: "Как пользоваться ионизатором воды?",
      zh: "如何使用水离子机？",
      yue: "水離子機點樣用？",
      fr: "Comment utiliser l’ioniseur d’eau ?",
    },
    "water-ionizer",
  ),
  purifier: question(
    "air-purifier-overview",
    {
      en: "Tell me about the Air Purifier",
      ru: "Расскажите об очистителе воздуха",
      zh: "请介绍一下空气净化器",
      yue: "可唔可以介紹一下空氣淨化器？",
      fr: "Présentez-moi le purificateur d’air",
    },
    "air-purifier",
  ),
} as const;

const productQuestions: Readonly<
  Record<ProductId, readonly Readonly<Record<SupportedLanguage, QuickQuestion>>[]>
> = {
  everyday: [
    question("go-operation", {
      en: "How does GO work?",
      ru: "Как работает GO?",
      zh: "GO 如何工作？",
      yue: "GO 點樣運作？",
      fr: "Comment fonctionne GO ?",
    }, "everyday"),
    question("go-duration", {
      en: "How long does it take?",
      ru: "Сколько времени это занимает?",
      zh: "需要多长时间？",
      yue: "要幾耐？",
      fr: "Combien de temps faut-il ?",
    }, "everyday"),
    question("go-concentration", {
      en: "What hydrogen concentration does it produce?",
      ru: "Какую концентрацию водорода он создаёт?",
      zh: "它能产生多高的氢浓度？",
      yue: "佢可以產生幾高嘅氫濃度？",
      fr: "Quelle concentration d’hydrogène produit-il ?",
    }, "everyday"),
    question("go-cleaning", {
      en: "How do I clean it?",
      ru: "Как его чистить?",
      zh: "如何清洁？",
      yue: "點樣清潔？",
      fr: "Comment le nettoyer ?",
    }, "everyday"),
  ],
  advanced: [
    question("pro-operation", {
      en: "How does PRO work?",
      ru: "Как работает PRO?",
      zh: "PRO 如何工作？",
      yue: "PRO 點樣運作？",
      fr: "Comment fonctionne PRO ?",
    }, "advanced"),
    question("pro-modes", {
      en: "What are PRO’s 3-minute and 18-minute modes?",
      ru: "Что представляют собой режимы PRO на 3 и 18 минут?",
      zh: "PRO 的 3 分钟和 18 分钟模式是什么？",
      yue: "PRO 嘅 3 分鐘同 18 分鐘模式係咩？",
      fr: "Que sont les modes PRO de 3 et 18 minutes ?",
    }, "advanced"),
    question("pro-inhalation", {
      en: "How does hydrogen inhalation work?",
      ru: "Как работает водородная ингаляция?",
      zh: "吸氢功能如何工作？",
      yue: "吸氫功能點樣運作？",
      fr: "Comment fonctionne l’inhalation d’hydrogène ?",
    }, "advanced"),
    question("pro-comparison", {
      en: "How is PRO different from GO?",
      ru: "Чем PRO отличается от GO?",
      zh: "PRO 与 GO 有什么不同？",
      yue: "PRO 同 GO 有咩分別？",
      fr: "Quelle est la différence entre PRO et GO ?",
    }, "advanced"),
  ],
  "water-ionizer": [
    question("ionizer-operation", {
      en: "How does the Water Ionizer work?",
      ru: "Как работает ионизатор воды?",
      zh: "水离子机如何工作？",
      yue: "水離子機點樣運作？",
      fr: "Comment fonctionne l’ioniseur d’eau ?",
    }, "water-ionizer"),
    question("ionizer-water-types", {
      en: "What types of water can the Water Ionizer make?",
      ru: "Какие виды воды производит ионизатор воды?",
      zh: "水离子机能制备哪些类型的水？",
      yue: "水離子機可以製備邊幾種水？",
      fr: "Quels types d’eau l’ioniseur d’eau peut-il produire ?",
    }, "water-ionizer"),
    question("ionizer-ph", {
      en: "How do I select a pH level?",
      ru: "Как выбрать уровень pH?",
      zh: "如何选择 pH 档位？",
      yue: "點樣選擇 pH 級別？",
      fr: "Comment sélectionner un niveau de pH ?",
    }, "water-ionizer"),
    question("ionizer-cleaning", {
      en: "How do I clean it?",
      ru: "Как его чистить?",
      zh: "如何清洁？",
      yue: "點樣清潔？",
      fr: "Comment le nettoyer ?",
    }, "water-ionizer"),
  ],
  "face-body-generator": [
    question("face-body-operation", {
      en: "How does the Face & Body Generator work?",
      ru: "Как работает генератор для лица и тела?",
      zh: "面部及身体用氢水生成器如何工作？",
      yue: "面部及身體用氫水生成器點樣運作？",
      fr: "Comment fonctionne le générateur pour le visage et le corps ?",
    }, "face-body-generator"),
    question("face-body-use", {
      en: "How do I use the Face & Body Generator?",
      ru: "Как пользоваться генератором для лица и тела?",
      zh: "如何使用面部及身体用氢水生成器？",
      yue: "面部及身體用氫水生成器點樣用？",
      fr: "Comment utiliser le générateur pour le visage et le corps ?",
    }, "face-body-generator"),
    question("face-body-cycle", {
      en: "How long is one Face & Body Generator spray cycle?",
      ru: "Сколько длится цикл распыления генератора для лица и тела?",
      zh: "面部及身体用氢水生成器的一次喷雾周期多长？",
      yue: "面部及身體用氫水生成器嘅一次噴霧週期有幾耐？",
      fr: "Combien de temps dure un cycle du générateur pour le visage et le corps ?",
    }, "face-body-generator"),
    question("face-body-cleaning", {
      en: "How do I clean the Face & Body Generator?",
      ru: "Как чистить генератор для лица и тела?",
      zh: "如何清洁面部及身体用氢水生成器？",
      yue: "面部及身體用氫水生成器點樣清潔？",
      fr: "Comment nettoyer le générateur pour le visage et le corps ?",
    }, "face-body-generator"),
  ],
  "water-mineralizer": [
    question("mineralizer-overview", {
      en: "What is the Water Mineralizer?",
      ru: "Что такое минерализатор воды?",
      zh: "什么是水矿化器？",
      yue: "水礦化器係咩？",
      fr: "Qu’est-ce que le minéralisateur d’eau ?",
    }, "water-mineralizer"),
    question("mineralizer-use", {
      en: "How do I use the Water Mineralizer?",
      ru: "Как пользоваться минерализатором воды?",
      zh: "如何使用水矿化器？",
      yue: "水礦化器點樣用？",
      fr: "Comment utiliser le minéralisateur d’eau ?",
    }, "water-mineralizer"),
    question("mineralizer-composition", {
      en: "What minerals does the Water Mineralizer contain?",
      ru: "Какие минералы содержит минерализатор воды?",
      zh: "水矿化器含有哪些矿物质？",
      yue: "水礦化器含有咩礦物質？",
      fr: "Quels minéraux le minéralisateur d’eau contient-il ?",
    }, "water-mineralizer"),
    question("mineralizer-storage", {
      en: "How should I store the Water Mineralizer?",
      ru: "Как хранить минерализатор воды?",
      zh: "水矿化器应该如何储存？",
      yue: "水礦化器應該點樣儲存？",
      fr: "Comment conserver le minéralisateur d’eau ?",
    }, "water-mineralizer"),
  ],
  "air-purifier": [
    question("purifier-operation", {
      en: "How does the Air Purifier work?",
      ru: "Как работает очиститель воздуха?",
      zh: "空气净化器如何工作？",
      yue: "空氣淨化器點樣運作？",
      fr: "Comment fonctionne le purificateur d’air ?",
    }, "air-purifier"),
    question("purifier-modes", {
      en: "What operating modes does the Air Purifier have?",
      ru: "Какие режимы работы есть у очистителя воздуха?",
      zh: "空气净化器有哪些运行模式？",
      yue: "空氣淨化器有咩運作模式？",
      fr: "Quels modes de fonctionnement propose le purificateur d’air ?",
    }, "air-purifier"),
    question("purifier-coverage", {
      en: "What room size is the Air Purifier designed for?",
      ru: "Для помещения какой площади предназначен очиститель воздуха?",
      zh: "空气净化器适用于多大的房间？",
      yue: "空氣淨化器適合幾大嘅房間？",
      fr: "Pour quelle superficie de pièce le purificateur d’air est-il conçu ?",
    }, "air-purifier"),
    question("purifier-filter", {
      en: "When should I replace the Air Purifier pre-filter?",
      ru: "Когда нужно менять предварительный фильтр очистителя воздуха?",
      zh: "什么时候需要更换空气净化器的预过滤器？",
      yue: "幾時要更換空氣淨化器嘅預過濾器？",
      fr: "Quand faut-il remplacer le préfiltre du purificateur d’air ?",
    }, "air-purifier"),
  ],
};

export function getGeneralQuickQuestions(language: SupportedLanguage) {
  return [
    { ...generalQuestions.explore[language], action: "explore-products" as const },
    generalQuestions.compare[language],
    generalQuestions.ionizer[language],
    generalQuestions.purifier[language],
  ];
}

export function getProductQuickQuestions(
  productId: ProductId,
  language: SupportedLanguage,
) {
  return productQuestions[productId].map((localized) => localized[language]);
}

export function resolveQuickQuestionProduct(
  message: string,
  language: SupportedLanguage,
): ProductId | null {
  const normalized = createKnowledgeQueryText(message, language).toLocaleLowerCase("en");

  if (/\bgo\b/.test(normalized) && /\bpro\b/.test(normalized)) return null;
  if (/\bgo\b/.test(normalized)) return "everyday";
  if (/\bpro\b/.test(normalized)) return "advanced";

  return (
    exhibitionProductList.find((product) =>
      [product.exhibitionName, ...product.aliases].some((name) =>
        normalized.includes(name.toLocaleLowerCase("en")),
      ),
    )?.id ?? null
  );
}

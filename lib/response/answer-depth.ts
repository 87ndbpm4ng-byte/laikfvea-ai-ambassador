import type { SupportedLanguage } from "@/types/language";

export type AnswerDepth = "quick" | "standard" | "detailed";

const detailedPatterns: Record<SupportedLanguage, readonly RegExp[]> = {
  en: [
    /\b(?:explain|describe)\s+(?:it\s+)?in detail\b/iu,
    /\b(?:tell|give)\s+me\s+(?:more|everything)\b/iu,
    /\bstep[ -]by[ -]step\b/iu,
    /\b(?:full|complete|detailed)\s+(?:specifications?|instructions?|explanation|comparison)\b/iu,
    /\bcompare\b|\bwhat(?:'s| is) the difference\b/iu,
  ],
  ru: [
    /(?:расскажи(?:те)?|объясни(?:те)?)\s+подробнее/iu,
    /подробн(?:ее|ая|ое|ые|ый)/iu,
    /пошагов(?:о|ая|ые|ый)/iu,
    /полн(?:ые|ая|ое|ый)\s+(?:характеристики|инструкции|сравнение)/iu,
    /сравни(?:те|ть)?|в ч[её]м разница/iu,
  ],
  zh: [
    /详细(?:说明|解释|介绍)?|更多详情|告诉我更多|逐步|一步一步|完整(?:规格|参数|说明|比较)|全面比较|比较.*区别|有什么区别/u,
  ],
  yue: [
    /詳細(?:講解|解釋|介紹)?|講多啲|更多詳情|逐步|一步一步|完整(?:規格|參數|說明|比較)|全面比較|比較.*分別|有咩分別/u,
  ],
  fr: [
    /\bplus de d[ée]tails?\b/iu,
    /\b(?:expliquez?|d[ée]crivez?)\s+(?:le|la|les|cela|ça|ceci|m['’]en)?\s*(?:en )?d[ée]tail\b/iu,
    /\b[ée]tape par [ée]tape\b/iu,
    /\b(?:caract[ée]ristiques|instructions|explication|comparaison)\s+compl[èe]tes?\b/iu,
    /\bcomparez?\b|\bquelle est la diff[ée]rence\b/iu,
  ],
};

const quickFactPatterns: Record<SupportedLanguage, readonly RegExp[]> = {
  en: [
    /\bhow (?:long|much|many|often)\b/iu,
    /\bwhat (?:is|are|'s) (?:the )?(?:capacity|duration|cycle time|charging time|pH|orp|coverage|room size|weight|dimensions?|concentration|dilution|dose|dosage|replacement interval)\b/iu,
    /\bwhat\b[^?!.]*\b(?:capacity|duration|cycle time|charging time|battery runtime|flow rate|pH|orp|coverage|area|room size|cadr|weight|dimensions?|concentration|dilution|dose|dosage|replacement interval)\b/iu,
    /\bwhen should .* (?:filter|pre-filter|prefilter) be replaced\b/iu,
  ],
  ru: [
    /сколько (?:времени|минут|секунд|воды|миллилитров|литров)/iu,
    /как(?:ая|ов|ой|ие|ое)\s+(?:ёмкость|объём|длительность|продолжительность|pH|ОВП|площадь|вес|размеры|концентрация|дозировка)/iu,
    /когда .* замен(?:ять|ить) .*фильтр/iu,
  ],
  zh: [
    /(?:需要|要|需时|需時)多久|多长时间|多長時間|多少(?:毫升|升|分钟|分鐘|秒)|(?:容量|时长|時長|周期|充电时间|充電時間|pH|ORP|覆盖面积|覆蓋面積|重量|尺寸|浓度|濃度|稀释比例|稀釋比例|用量)是多少|什么时候更换.*滤网|什麼時候更換.*濾網/u,
  ],
  yue: [
    /要幾耐|需時幾耐|幾多(?:毫升|升|分鐘|秒)|(?:容量|時長|週期|充電時間|pH|ORP|覆蓋面積|重量|尺寸|濃度|稀釋比例|用量)係幾多|幾時要換.*濾網/u,
  ],
  fr: [
    /\bcombien de (?:temps|minutes|secondes|millilitres|litres)\b/iu,
    /\bquelle est (?:la|le) (?:capacit[ée]|dur[ée]e|temps de charge|pH|orp|surface couverte|poids|dimension|concentration|dilution|dosage)\b/iu,
    /\bquand faut-il remplacer .*filtre\b/iu,
  ],
};

function matchesAny(message: string, patterns: readonly RegExp[]) {
  return patterns.some((pattern) => pattern.test(message));
}

export function classifyAnswerDepth(
  message: string,
  language: SupportedLanguage | null | undefined,
): AnswerDepth {
  const normalized = message.trim();
  const resolvedLanguage = language ?? "en";

  if (matchesAny(normalized, detailedPatterns[resolvedLanguage])) {
    return "detailed";
  }

  if (matchesAny(normalized, quickFactPatterns[resolvedLanguage])) {
    return "quick";
  }

  return "standard";
}

export function responseLengthForDepth(depth: AnswerDepth) {
  switch (depth) {
    case "quick":
      return "concise" as const;
    case "detailed":
      return "detailed" as const;
    default:
      return "standard" as const;
  }
}

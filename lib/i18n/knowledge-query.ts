import { resolveSupportedLanguage } from "@/lib/i18n/languages";

const RUSSIAN_QUERY_TERMS: readonly [RegExp, string][] = [
  [/привет\w*|здравств\w*/giu, " hello "],
  [/спасибо|благодар\w*/giu, " thanks "],
  [/пока|до свидания/giu, " bye "],
  [/чем отличаются|разниц\w*|сравн\w*/giu, " compare difference "],
  [/обе|обоих|две бутылки|два продукта/giu, " both products "],
  [/какую|какой из них|которую/giu, " which one "],
  [/поезд\w*|путешеств\w*|портатив\w*/giu, " travel portable "],
  [/заряж\w*|зарядк\w*/giu, " charging "],
  [/аккумулятор\w*|батаре\w*/giu, " battery "],
  [/чист\w*|мыть|мойк\w*/giu, " cleaning "],
  [/обслужив\w*|уход\w*/giu, " maintenance "],
  [/безопас\w*/giu, " safety warning "],
  [/ингаляц\w*|вдых\w*/giu, " inhalation "],
  [/водородн\w+ вод\w*/giu, " hydrogen water "],
  [/электролиз\w*/giu, " electrolysis "],
  [/генерир\w* водород\w*/giu, " generate hydrogen operation "],
  [/минерализ\w*|фильтр\w*|картридж\w*/giu, " mineralisation filter cartridge "],
  [/характеристик\w*|размер\w*|техническ\w*/giu, " technical specifications "],
  [/Advanced Bottle|усовершенствованн\w+ бутыл\w*/giu, " advanced bottle "],
  [/Everyday Bottle|повседневн\w+ бутыл\w*/giu, " everyday bottle "],
  [/бутыл\w*/giu, " bottle "],
  [/расскажи подробнее|подробнее/giu, " tell me more "],
  [/почему/giu, " why "],
  [/её|ее|она|это|этим|этого/giu, " it this "],
];

const CHINESE_QUERY_TERMS: readonly [RegExp, string][] = [
  [/你好|您好/gu, " hello "],
  [/谢谢/gu, " thanks "],
  [/再见/gu, " bye "],
  [/有什么区别|区别|比较|对比/gu, " compare difference "],
  [/两款|两个产品|两种/gu, " both products "],
  [/哪一款|哪款|哪个/gu, " which one "],
  [/旅行|出行|便携/gu, " travel portable "],
  [/充电/gu, " charging "],
  [/电池|续航/gu, " battery "],
  [/清洁|清洗/gu, " cleaning "],
  [/维护|保养/gu, " maintenance "],
  [/安全|警告|注意事项/gu, " safety warning "],
  [/吸入|吸氢/gu, " inhalation "],
  [/氢水|富氢水/gu, " hydrogen water "],
  [/电解/gu, " electrolysis "],
  [/生成氢气|制氢|产生氢气/gu, " generate hydrogen operation "],
  [/矿化|滤芯|滤盒/gu, " mineralisation filter cartridge "],
  [/规格|尺寸|技术/gu, " technical specifications "],
  [/高级款|进阶款/gu, " advanced bottle "],
  [/日常款/gu, " everyday bottle "],
  [/瓶子|水瓶/gu, " bottle "],
  [/再详细一点|详细说说|更多细节/gu, " tell me more "],
  [/为什么/gu, " why "],
  [/它|这个|这款/gu, " it this "],
];

export function createKnowledgeQueryText(
  message: string,
  language?: string | null,
) {
  const resolvedLanguage = resolveSupportedLanguage(language);
  if (resolvedLanguage === "en") return message.trim();

  const terms =
    resolvedLanguage === "ru" ? RUSSIAN_QUERY_TERMS : CHINESE_QUERY_TERMS;

  return terms.reduce(
    (translated, [pattern, replacement]) =>
      translated.replace(pattern, replacement),
    message,
  )
    .replace(/[^\p{Script=Latin}\p{Number}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

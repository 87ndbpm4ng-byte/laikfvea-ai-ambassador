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
  [/комплект\w*|упаковк\w*|коробк\w*|аксессуар\w*/giu, " package contents accessories included "],
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
  [/материал\w*|из чего|электрод\w*|мембран\w*|покрыти\w*|титан\w*|платин\w*/giu, " material electrode membrane coating titanium platinum "],
  [/объ[её]м\w*|вместимост\w*|сколько вод\w*/giu, " capacity water volume "],
  [/концентрац\w*|ppb|ppm/giu, " hydrogen concentration ppb "],
  [/цикл\w*|режим\w*|сколько длит\w*|как долго/giu, " cycle mode duration "],
  [/горяч\w+ вод\w*|холодн\w+ вод\w*|температур\w*/giu, " water temperature "],
  [/газированн\w+ вод\w*|газировк\w*/giu, " carbonated sparkling water liquids "],
  [/сразу выпить|пить сразу/giu, " drink immediately "],
  [/хранить вод\w*|оставить вод\w*|сколько хран\w*/giu, " store water hours "],
  [/повторн\w+ цикл\w*|ещ[её] один цикл|два цикл\w*/giu, " consecutive repeated cycle pressure "],
  [/перв\w+ использован\w*|перед использован\w*|нов\w+ бутыл\w*/giu, " initial setup first use "],
  [/проточн\w+ вод\w*|под кран\w*|ополаскив\w*/giu, " running water rinse maintenance "],
  [/давно не использ\w*|несколько месяцев|долг\w+ хран\w*/giu, " long time warm drinking water rinse "],
  [/мощност\w*/giu, " power charging "],
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
  [/包装|盒子|配件|包含|随附|套装/gu, " package contents accessories included "],
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
  [/材料|什么做的|电极|膜|涂层|钛|铂/gu, " material electrode membrane coating titanium platinum "],
  [/容量|容积|多少水/gu, " capacity water volume "],
  [/浓度|ppb|ppm/gu, " hydrogen concentration ppb "],
  [/循环|模式|多长时间|多久/gu, " cycle mode duration "],
  [/热水|冷水|温度/gu, " water temperature "],
  [/气泡水|碳酸水/gu, " carbonated sparkling water liquids "],
  [/立即喝|马上喝/gu, " drink immediately "],
  [/储存.*水|保存.*水|能放多久/gu, " store water hours "],
  [/再运行一次|再来一个循环|第二次循环|连续循环/gu, " consecutive repeated cycle pressure "],
  [/第一次使用|首次使用|使用前|新水瓶/gu, " initial setup first use "],
  [/流水冲洗|水龙头下|冲洗/gu, " running water rinse maintenance "],
  [/几个月没用|长期存放|长时间不用/gu, " long time warm drinking water rinse "],
  [/功率/gu, " power charging "],
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

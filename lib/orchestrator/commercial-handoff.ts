import { resolveSupportedLanguage } from "@/lib/i18n/languages";
import type { SupportedLanguage } from "@/types/language";

export type CommercialIntentKind = "none" | "pure" | "mixed";

export type CommercialIntentAnalysis = {
  kind: CommercialIntentKind;
  productMessage: string | null;
};

const COMMERCIAL_HANDOFF_RESPONSES: Record<SupportedLanguage, string> = {
  en: "For pricing, MOQ, OEM, samples, distribution or other commercial enquiries, please speak with a member of our team at the stand.",
  ru: "По вопросам цен, минимального заказа, OEM, образцов, дистрибуции и других коммерческих условий, пожалуйста, обратитесь к представителю нашей команды на стенде.",
  zh: "如需咨询价格、最小起订量、OEM、样品、经销或其他商务事宜，请联系展位上的工作人员。",
  yue: "如果想查詢價錢、最低訂購量、OEM、樣品、經銷或者其他商務事宜，請同展位嘅工作人員聯絡。",
  fr: "Pour les prix, les quantités minimales, l’OEM, les échantillons, la distribution ou toute autre question commerciale, veuillez vous adresser à un membre de notre équipe sur le stand.",
};

const UNIVERSAL_COMMERCIAL_PATTERNS = [
  /\bmoq\b/iu,
  /\boem\b/iu,
  /\bprivate[ -]?label\b/iu,
  /\bincoterms?\b/iu,
] as const;

const COMMERCIAL_PATTERNS: Record<SupportedLanguage, readonly RegExp[]> = {
  en: [
    /\b(?:price|pricing|price list|wholesale price|quotation|sales quote)\b/iu,
    /\bhow much (?:does|do|is|are|would|will)\b[^?!.]*(?:cost|to buy|to order)\b/iu,
    /\bwhat (?:does|do|would|will)\b[^?!.]*\bcost\b/iu,
    /\bminimum order quantity\b/iu,
    /\b(?:wholesale|distribut(?:or|ion)|reseller|retail partnership|exclusiv(?:e|ity))\b/iu,
    /\b(?:payment|shipping|commercial supply) terms?\b/iu,
    /\bproduction lead time\b/iu,
    /\border quantit(?:y|ies)\b/iu,
    /\b(?:custom branding|brand customization|customise (?:the )?(?:logo|packaging)|customize (?:the )?(?:logo|packaging))\b/iu,
    /\b(?:buy|purchase|order) (?:a |an |this |that |one |some |the product\b|\d+[\d, ]* units?\b)/iu,
    /\b(?:place|make) (?:a |an )?order\b/iu,
    /\b(?:buy|purchase|request|order|get|receive) (?:a |an )?samples?\b/iu,
    /\bsamples? (?:price|cost|purchase|request|order|availability)\b/iu,
    /\bavailable (?:to|for) (?:buy|purchase|order)\b/iu,
    /\bin stock\b/iu,
    /\b(?:negotiate|extend|commercial|bulk|order)\b[^?!.]*\bwarrant(?:y|ies)\b/iu,
  ],
  ru: [
    /(?:цен[аыуеы]|стоимост[ьи]|прайс(?:-лист)?|коммерческ\p{L}* предложен\p{L}*|котировк\p{L}*)/iu,
    /сколько(?:\s+\p{L}+){0,3}\s+(?:стоит|будет стоить)/iu,
    /минимальн\p{L}* (?:заказ|парт\p{L}*)/iu,
    /минимальн\p{L}* объ[её]м\p{L}* заказ\p{L}*/iu,
    /(?:опт\p{L}*|дистрибьютор\p{L}*|дистрибуц\p{L}*|реселлер\p{L}*|розничн\p{L}* партнёр\p{L}*|эксклюзив\p{L}*)/iu,
    /(?:услови\p{L}* оплат\p{L}*|услови\p{L}* доставк\p{L}*|срок\p{L}* производств\p{L}*)/iu,
    /(?:купить|приобрести|заказать|оформить заказ)/iu,
    /(?:купить|заказать|получить|запросить)[^?!.]*образ(?:ец|цы|цов)/iu,
    /образ(?:ец|цы|цов)[^?!.]*(?:цен|стоим|заказ|куп|получ)\p{L}*/iu,
    /(?:собственн\p{L}* бренд|частн\p{L}* марк\p{L}*|нанести логотип|брендирован\p{L}*|кастомизац\p{L}*)/iu,
    /(?:коммерческ\p{L}*|оптов\p{L}*|для заказ\p{L}*)[^?!.]*гаранти\p{L}*/iu,
  ],
  zh: [
    /(?:价格|价钱|报价|批发价|价目表)/u,
    /(?:最小起订量|最低起订量|最低订购量|起订量)/u,
    /(?:批发|经销商|经销|分销|代理商|零售合作|独家代理|区域独家)/u,
    /(?:付款条款|支付条款|运输条款|交货条款|生产交期|生产周期)/u,
    /(?:购买|采购|下单|订购|订货)/u,
    /(?:买|购买|申请|索取|订购|寄送).{0,8}样品/u,
    /样品.{0,8}(?:价格|费用|购买|申请|订购)/u,
    /(?:定制品牌|品牌定制|定制标志|定制包装|贴牌)/u,
    /(?:商业|批量|订单).{0,8}(?:保修|质保)/u,
  ],
  yue: [
    /(?:價錢|價格|報價|批發價|價目表)/u,
    /(?:最低訂購量|最低起訂量|起訂量)/u,
    /(?:批發|經銷商|經銷|分銷|代理商|零售合作|獨家代理|地區獨家)/u,
    /(?:付款條款|支付條款|運輸條款|送貨條款|生產交期|生產需時)/u,
    /(?:買|購買|採購|落單|訂購|訂貨)/u,
    /(?:買|申請|索取|訂購|寄送).{0,8}樣品/u,
    /樣品.{0,8}(?:價錢|價格|費用|購買|申請|訂購)/u,
    /(?:品牌定制|品牌訂製|定制標誌|訂製標誌|定制包裝|訂製包裝|貼牌)/u,
    /(?:商業|批量|訂單).{0,8}(?:保養|保用|保修)/u,
  ],
  fr: [
    /\b(?:prix|tarif(?:s|aire)?|devis|prix de gros)\b/iu,
    /\bcombien (?:coûte|coute|coûtent|coutent|cela coûte|ça coûte)\b/iu,
    /\bquantit[ée] minimale (?:de commande)?\b/iu,
    /\b(?:vente en gros|grossiste|distribut(?:eur|ion)|revendeur|partenariat commercial|exclusivit[ée])\b/iu,
    /\b(?:conditions? de paiement|conditions? d['’]exp[ée]dition|conditions? de livraison|d[ée]lai de production)\b/iu,
    /\b(?:acheter|commander|passer une commande|faire un achat)\b/iu,
    /\b(?:acheter|commander|demander|recevoir|obtenir)\b[^?!.]*\b[ée]chantillons?\b/iu,
    /\b[ée]chantillons?\b[^?!.]*\b(?:prix|coût|cout|commande|achat|disponibilit[ée])\b/iu,
    /\b(?:marque personnalis[ée]e|personnaliser (?:le )?(?:logo|conditionnement|emballage)|marque blanche)\b/iu,
    /\b(?:commerciale?|volume|commande)\b[^?!.]*\bgarantie\b/iu,
  ],
};

const CLAUSE_SEPARATORS: Record<SupportedLanguage, RegExp> = {
  en: /(?:[.!?;]+|,\s+|\s+(?:and|also|but|plus)\s+)/iu,
  ru: /(?:[.!?;]+|,\s+|\s+(?:и|а также|но|плюс)\s+)/iu,
  zh: /(?:[。！？；]+|，|、|以及|还有|另外)/u,
  yue: /(?:[。！？；]+|，|、|同埋|仲有|另外)/u,
  fr: /(?:[.!?;]+|,\s+|\s+(?:et|mais|ainsi que|plus)\s+)/iu,
};

function hasCommercialSignal(text: string) {
  return [
    ...UNIVERSAL_COMMERCIAL_PATTERNS,
    ...Object.values(COMMERCIAL_PATTERNS).flat(),
  ].some(
    (pattern) => pattern.test(text),
  );
}

const MULTILINGUAL_CLAUSE_SEPARATOR = new RegExp(
  Object.values(CLAUSE_SEPARATORS)
    .map((separator) => `(?:${separator.source})`)
    .join("|"),
  "iu",
);

function normalizedClauses(message: string) {
  return message
    .split(MULTILINGUAL_CLAUSE_SEPARATOR)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

export function commercialHandoffResponse(language?: string | null) {
  return COMMERCIAL_HANDOFF_RESPONSES[resolveSupportedLanguage(language)];
}

export function analyzeCommercialIntent(
  message: string,
  _language?: string | null,
): CommercialIntentAnalysis {
  void _language;
  const trimmed = message.trim();

  if (!trimmed || !hasCommercialSignal(trimmed)) {
    return { kind: "none", productMessage: null };
  }

  const clauses = normalizedClauses(trimmed);
  const productClauses = clauses.filter(
    (clause) => !hasCommercialSignal(clause),
  );

  if (productClauses.length === 0) {
    return { kind: "pure", productMessage: null };
  }

  return {
    kind: "mixed",
    productMessage: productClauses.join(". "),
  };
}

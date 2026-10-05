import {
  GREETING_TERMS,
  RETRIEVAL_CONFIG,
  RETRIEVAL_TOPIC_GROUPS,
  type RetrievalTopicGroup,
} from "@/lib/retrieval/retrieval-config";
import type {
  RetrievalProduct,
  RetrievalQuery,
} from "@/lib/retrieval/retrieval-types";
import type { SessionConversationEntry } from "@/lib/session/conversation-history";
import type { VisitorSession } from "@/lib/session/session-types";
import { createKnowledgeQueryText } from "@/lib/i18n/knowledge-query";
import {
  exhibitionProducts,
  isProductId,
  resolveProductFromText,
} from "@/lib/data/exhibition-products";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "does",
  "for",
  "how",
  "i",
  "is",
  "it",
  "me",
  "of",
  "the",
  "this",
  "to",
  "use",
  "what",
]);

const CONVERSATIONAL_TRANSITION =
  /^(?:hello|hi|hey|thanks?|thank you|goodbye|bye|okay|ok|that's interesting|what do you mean)\??[.!]?$/i;
const CONTEXTUAL_FOLLOW_UP =
  /^(?:which one|what about (?:that|it|the other one)|how much|how long|what power|and the (?:other )?(?:mode|one)|what about the electrodes?)\??[.!]?$/i;

export function detectRetrievalTopicGroups(text: string): RetrievalTopicGroup[] {
  return (Object.entries(RETRIEVAL_TOPIC_GROUPS) as Array<
    [RetrievalTopicGroup, (typeof RETRIEVAL_TOPIC_GROUPS)[RetrievalTopicGroup]]
  >)
    .filter(([, group]) => group.rules.some(({ pattern }) => pattern.test(text)))
    .map(([topic]) => topic);
}

function expandedTerms(text: string, session?: VisitorSession) {
  const terms: string[] = Object.values(RETRIEVAL_TOPIC_GROUPS).flatMap((group) =>
    group.rules.flatMap(({ pattern, terms }) => (pattern.test(text) ? terms : [])),
  );
  if (/^what power\b/i.test(text) && session?.activeTopic === "charging") {
    terms.push("wireless charging", "maximum wireless charging power");
  }
  if (/^how long\b/i.test(text) && /hydrogen water/i.test(session?.activeTopic ?? "")) {
    terms.push("process duration", "minutes");
  }
  if (/\b(?:cycle|mode|duration|how long)\b/i.test(text)) {
    const product = inferProduct(text) ?? (session ? productFromSession(session) : null);
    if (product === "everyday") terms.push("5 minutes");
    if (product === "advanced") terms.push("3 minutes", "18 minutes");
  }
  if (/\bwhat does the bottle do\b/i.test(text)) {
    terms.push("hydrogen water preparation", "hydrogen inhalation");
  }
  if (/\b(?:what does|how does).*water ionizer/i.test(text)) {
    terms.push("product purpose", "operating principle");
  }
  if (/\b(?:what is|how does).*?(?:face (?:&|and) body generator|portable hydrogen skin (?:humidifier|sprayer))/i.test(text)) {
    terms.push("product purpose", "operating principle", "fine mist");
  }
  if (/\bhow (?:do i|often|long).*?(?:face (?:&|and) body generator|portable hydrogen skin (?:humidifier|sprayer))/i.test(text)) {
    terms.push("operating procedure", "one spray cycle", "55 seconds");
  }
  if (session?.activeProduct === "face-body-generator") {
    if (/\bhow do i use it\b/i.test(text)) terms.push("operating procedure", "switch", "spray");
    if (/\bhow often can i use it\b/i.test(text)) terms.push("one spray cycle", "frequency", "55 seconds");
    if (/\b(?:reservoir|capacity|volume)\b/i.test(text)) terms.push("reservoir volume", "15 mL");
    if (/\b(?:cycle|mode|duration|how long)\b/i.test(text)) terms.push("one spray cycle", "55 seconds");
  }
  if (/\b(?:what does|how does).*?(?:air purifier|capsula m size)/i.test(text)) {
    terms.push("air path", "glass-filter", "pre-filter", "operating modes");
  }
  if (/\b(?:how (?:do i|large|big)|room|coverage).*?(?:air purifier|capsula m size)/i.test(text)) {
    terms.push("placement", "room coverage", "operating modes");
  }
  if (/\b(?:clean|filter|pre-filter).*?(?:air purifier|capsula m size)/i.test(text)) {
    terms.push("cleaning maintenance", "pre-filter replacement");
  }
  if (session?.activeProduct === "air-purifier") {
    if (/\bhow does it work\b/i.test(text)) terms.push("air path", "glass-filter", "pre-filter");
    if (/\bhow do i clean it\b/i.test(text)) terms.push("cleaning maintenance", "blockages");
    if (/\b(?:room|coverage|cover|large|big)\b/i.test(text)) terms.push("room coverage", "218 sq. ft.", "20.25 m²");
    if (/\b(?:schedule|app|capsula link)\b/i.test(text)) terms.push("Capsula Link", "set schedule", "automatic schedule");
  }
  if (/\b(?:what does|how does).*?air humidifier/i.test(text)) {
    terms.push("ultrasonic humidifier", "mist modes", "water tank");
  }
  if (/\b(?:how do i|how often|how long).*?air humidifier/i.test(text)) {
    terms.push("preparing for use", "cleaning maintenance", "timer");
  }
  if (session?.activeProduct === "air-humidifier") {
    // Product-bound Quick Questions can be localized. Keeping these neutral
    // manual terms on the query preserves the active product without making
    // the visitor's visible question English-only.
    terms.push("ultrasonic humidifier", "water tank");
    if (/\bhow does it work\b/i.test(text)) terms.push("ultrasonic humidifier", "mist modes");
    if (/\bhow do i (?:use|set up) it\b/i.test(text)) terms.push("preparing for use", "filling the tank", "controls");
    if (/\bhow do i clean it\b/i.test(text)) terms.push("maintenance care", "piezoelectric element", "air filter");
    if (/\b(?:tank|capacity|volume)\b/i.test(text)) terms.push("water tank capacity", "2.4 L");
    if (/\b(?:cycle|mode|mist|timer)\b/i.test(text)) terms.push("mist modes", "timer", "automatic shutoff");
  }
  if (/\b(?:what is|what does|how does).*?(?:water mineralizer|severyanka mineral additive)/i.test(text)) {
    terms.push("product identity", "documented purpose", "preparation and use");
  }
  if (/\b(?:how do i use|what minerals|how long|how much water|clean|replac|specification|restriction).*?(?:water mineralizer|severyanka mineral additive)/i.test(text)) {
    terms.push("composition", "preparation and use", "storage", "safety restrictions");
  }
  if (session?.activeProduct === "water-mineralizer") {
    if (/\bhow does it work\b/i.test(text)) terms.push("documented purpose", "composition", "preparation and use");
    if (/\bhow do i use it\b/i.test(text)) terms.push("recommended dilution", "mix thoroughly");
    if (/\b(?:mineral|composition|contain)\b/i.test(text)) terms.push("composition", "calcium", "magnesium", "potassium");
    if (/\b(?:restriction|safety|warning)\b/i.test(text)) terms.push("safety restrictions", "recommended proportion", "undiluted");
  }
  if (/\bhow do i (?:use|operate).*water ionizer/i.test(text)) {
    terms.push("preparing alkaline and acidic water", "controls");
  }
  if (/\b(?:choose|select).*water mode.*water ionizer/i.test(text)) {
    terms.push("controls", "selectable ionization level", "up down");
  }
  if (/\b(?:filter|membrane).*water ionizer/i.test(text)) {
    terms.push("membrane use", "membrane replacement", "pressed cotton");
  }
  if (session?.activeProduct === "water-ionizer") {
    if (/\bhow does it work\b/i.test(text)) terms.push("product purpose", "operating principle");
    if (/\bhow do i use it\b/i.test(text)) terms.push("preparing alkaline and acidic water", "controls");
    if (/\b(?:what (?:types?|kinds?) of water|water types)\b/i.test(text)) {
      terms.push("water types and production volumes", "alkaline water", "acidic water");
    }
    if (/\b(?:ph|ionization level|water level)\b/i.test(text)) {
      terms.push("selectable ionization level", "pH", "Up", "Down");
    }
    if (/\b(?:clean|wash|maintenance)\b/i.test(text)) {
      terms.push("cleaning and maintenance", "unplug before cleaning");
    }
  }
  if (
    /\b(?:compare|comparison|difference)\b/i.test(text) &&
    /\bGO\b/.test(text) &&
    /\bPRO\b/.test(text)
  ) {
    terms.push(
      "technical specifications",
      "hydrogen concentration",
      "water capacity",
      "hydrogen water preparation",
    );
  }
  return terms;
}

export function tokenizeRetrievalText(text: string): string[] {
  return [
    ...new Set(
      text
        .toLocaleLowerCase("en")
        .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
        .split(/\s+/)
        .filter((term) => term.length > 1 && !STOP_WORDS.has(term)),
    ),
  ];
}

function inferProduct(text: string): RetrievalProduct | null {
  const normalized = text.toLocaleLowerCase("en");
  const registryProduct = resolveProductFromText(text);
  if (registryProduct) return registryProduct;
  if (/\b(?:ionized water|ionised water)\b/.test(normalized)) return "water-ionizer";
  if (/\bportable hydrogen skin (?:humidifier|sprayer)\b/.test(normalized)) return "face-body-generator";
  if (/\bseveryanka mineral additive\b/.test(normalized)) return "water-mineralizer";
  const explicitlyNamesGo =
    /\b(everyday|portable|compact)\b/.test(normalized);
  const explicitlyNamesPro =
    /\badvanced\b/.test(normalized);
  if (explicitlyNamesGo && explicitlyNamesPro) return null;
  if (explicitlyNamesGo) return "everyday";
  if (explicitlyNamesPro) return "advanced";
  if (/\b(inhalation|mineralisation|mineralization)\b/.test(normalized)) return "advanced";
  return null;
}

function productFromSession(session: VisitorSession): RetrievalProduct | null {
  if (isProductId(session.activeProduct)) return session.activeProduct;
  const viewed = session.viewedProducts.at(-1);
  if (isProductId(viewed)) return viewed;
  const recentProductText = [...session.conversationHistory]
    .reverse()
    .slice(0, RETRIEVAL_CONFIG.maxRecentMessages)
    .map((entry) => entry.content)
    .join(" ");
  return inferProduct(recentProductText);
}

function sectionTypesFor(text: string): string[] {
  const terms = tokenizeRetrievalText(text);
  const types: string[] = [];
  if (terms.some((term) => term.startsWith("clean"))) types.push("cleaning");
  if (terms.some((term) => term.startsWith("charg") || term === "battery")) {
    types.push("charging");
  }
  if (terms.some((term) => term.startsWith("troubleshoot") || term === "error")) {
    types.push("troubleshooting");
  }
  if (terms.some((term) => term.startsWith("maint"))) types.push("maintenance");
  if (
    terms.some(
      (term) =>
        term.startsWith("spec") ||
        term === "dimensions" ||
        term === "capacity" ||
        term === "volume" ||
        term === "reservoir",
    )
  ) {
    types.push("technical-specifications");
  }
  if (
    terms.some(
      (term) => term === "package" || term === "contents" || term === "box",
    )
  ) {
    types.push("package-contents");
  }
  if (terms.some((term) => term === "warning" || term === "safety")) {
    types.push("safety", "warnings");
  }
  if (terms.some((term) => term === "compare" || term === "difference")) {
    types.push("comparison");
  }
  if (terms.some((term) => term === "inhalation")) types.push("inhalation");
  if (/\b(?:usb(?:-c)?|type-c)\b/i.test(text)) {
    types.push("charging", "technical-specifications");
  }
  return types;
}

export function shouldRunRetrieval(
  message: string,
  language: VisitorSession["language"] = "en",
  session?: Pick<VisitorSession, "activeProduct" | "activeTopic" | "lastDiscussedFeature" | "conversationHistory">,
): boolean {
  const knowledgeText = createKnowledgeQueryText(message, language);
  const terms = tokenizeRetrievalText(knowledgeText);
  if (terms.length === 1 && GREETING_TERMS.has(terms[0])) return false;
  if (CONVERSATIONAL_TRANSITION.test(knowledgeText.trim())) return false;
  if (CONTEXTUAL_FOLLOW_UP.test(knowledgeText.trim())) {
    return Boolean(session?.activeTopic && session.conversationHistory.length > 0);
  }
  if (detectRetrievalTopicGroups(knowledgeText).length > 0) return true;
  // A server-resolved product context makes a non-conversational follow-up
  // product-bound. This is essential for localized Quick Questions whose
  // display text does not repeat the English product name.
  if (session?.activeProduct && knowledgeText.trim().length > 0) return true;
  return false;
}

export function createRetrievalQuery(input: {
  message: string;
  session: VisitorSession;
}): RetrievalQuery {
  const knowledgeText = createKnowledgeQueryText(
    input.message,
    input.session.language,
  );
  // A translated operational term such as Russian “предварительный фильтр”
  // can legitimately expand to generic English retrieval terms that mention
  // another product (for example, mineralisation). Only a curated identity in
  // the query may override the server/session product context; otherwise the
  // active product remains authoritative.
  const explicitProduct = resolveProductFromText(knowledgeText);
  const sessionProduct = productFromSession(input.session);
  const activeProduct =
    explicitProduct ?? sessionProduct ?? inferProduct(knowledgeText);
  const retrievalText = activeProduct
    ? `${knowledgeText} ${exhibitionProducts[activeProduct].exhibitionName}`
    : knowledgeText;
  const nativeAirPurifierTerms =
    input.session.language === "ru" && activeProduct === "air-purifier"
      ? [
          ...tokenizeRetrievalText(input.message),
          ...( /пользова\p{L}*/iu.test(input.message)
            ? ["getting started", "setup", "подготовка"]
            : []),
        ]
      : [];
  const recentEntries: SessionConversationEntry[] = [
    ...input.session.conversationHistory,
  ].slice(-RETRIEVAL_CONFIG.maxRecentMessages);
  const recentContext = recentEntries
    .map((entry) => createKnowledgeQueryText(entry.content, input.session.language))
    .join(" ")
    .slice(-RETRIEVAL_CONFIG.maxRecentContextCharacters);
  return {
    text: knowledgeText,
    normalizedTerms: [
      ...new Set([
        ...tokenizeRetrievalText(retrievalText),
        ...nativeAirPurifierTerms,
        ...expandedTerms(retrievalText, input.session),
      ]),
    ],
    activeProduct,
    visitorIntent: input.session.currentIntent,
    conversationStage: input.session.currentConversationStage,
    recentContext,
    sectionTypes: sectionTypesFor(retrievalText),
  };
}

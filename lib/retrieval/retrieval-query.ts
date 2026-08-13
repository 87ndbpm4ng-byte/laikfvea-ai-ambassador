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
import { isProductId } from "@/lib/data/exhibition-products";

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
  if (/\b(?:water ionizer|ionized water|ionised water)\b/.test(normalized)) {
    return "water-ionizer";
  }
  if (/\b(?:hydrogen water generator for face (?:&|and) body|face (?:&|and) body generator|portable hydrogen skin (?:humidifier|sprayer))\b/.test(normalized)) {
    return "face-body-generator";
  }
  if (/\b(?:air purifier|capsula m size)\b/.test(normalized)) {
    return "air-purifier";
  }
  const explicitlyNamesGo =
    /\bGO\b/.test(text) ||
    /\b(everyday|go bottle|hydrogen water bottle go|portable|compact)\b/.test(normalized);
  const explicitlyNamesPro =
    /\bPRO\b/.test(text) ||
    /\b(advanced|pro bottle|hydrogen water bottle pro)\b/.test(
      normalized,
    );
  if (explicitlyNamesGo && explicitlyNamesPro) return null;
  if (explicitlyNamesGo) return "everyday";
  if (explicitlyNamesPro) return "advanced";
  if (/\b(inhalation|mineralisation|mineralization)\b/.test(normalized)) return "advanced";
  return null;
}

function productFromSession(session: VisitorSession): RetrievalProduct | null {
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
  if (terms.some((term) => term.startsWith("spec") || term === "dimensions")) {
    types.push("technical-specifications");
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
  session?: Pick<VisitorSession, "activeTopic" | "lastDiscussedFeature" | "conversationHistory">,
): boolean {
  const knowledgeText = createKnowledgeQueryText(message, language);
  const terms = tokenizeRetrievalText(knowledgeText);
  if (terms.length === 1 && GREETING_TERMS.has(terms[0])) return false;
  if (CONVERSATIONAL_TRANSITION.test(knowledgeText.trim())) return false;
  if (CONTEXTUAL_FOLLOW_UP.test(knowledgeText.trim())) {
    return Boolean(session?.activeTopic && session.conversationHistory.length > 0);
  }
  if (detectRetrievalTopicGroups(knowledgeText).length > 0) return true;
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
        ...tokenizeRetrievalText(knowledgeText),
        ...expandedTerms(knowledgeText, input.session),
      ]),
    ],
    activeProduct:
      inferProduct(knowledgeText) ?? productFromSession(input.session),
    visitorIntent: input.session.currentIntent,
    conversationStage: input.session.currentConversationStage,
    recentContext,
    sectionTypes: sectionTypesFor(knowledgeText),
  };
}

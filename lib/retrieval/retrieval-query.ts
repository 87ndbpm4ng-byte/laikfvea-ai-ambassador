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
  if (/\bwhat does the bottle do\b/i.test(text)) {
    terms.push("hydrogen water preparation", "hydrogen inhalation");
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
  if (/\b(advanced|inhalation|mineralisation|mineralization)\b/.test(normalized)) {
    return "advanced";
  }
  if (/\b(everyday|portable|compact)\b/.test(normalized)) {
    return "everyday";
  }
  return null;
}

function productFromSession(session: VisitorSession): RetrievalProduct | null {
  const viewed = session.viewedProducts.at(-1);
  if (viewed === "advanced" || viewed === "everyday") return viewed;
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

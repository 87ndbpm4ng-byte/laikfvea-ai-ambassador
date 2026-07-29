import {
  GREETING_TERMS,
  RETRIEVAL_CONFIG,
  RETRIEVAL_TOPIC_TERMS,
} from "@/lib/retrieval/retrieval-config";
import type {
  RetrievalProduct,
  RetrievalQuery,
} from "@/lib/retrieval/retrieval-types";
import type { SessionConversationEntry } from "@/lib/session/conversation-history";
import type { VisitorSession } from "@/lib/session/session-types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
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
  "what",
]);

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
  return types;
}

export function shouldRunRetrieval(message: string): boolean {
  const terms = tokenizeRetrievalText(message);
  if (terms.length === 1 && GREETING_TERMS.has(terms[0])) return false;
  const normalized = message.toLocaleLowerCase("en");
  return RETRIEVAL_TOPIC_TERMS.some((term) => normalized.includes(term));
}

export function createRetrievalQuery(input: {
  message: string;
  session: VisitorSession;
}): RetrievalQuery {
  const recentEntries: SessionConversationEntry[] = [
    ...input.session.conversationHistory,
  ].slice(-RETRIEVAL_CONFIG.maxRecentMessages);
  const recentContext = recentEntries
    .map((entry) => entry.content)
    .join(" ")
    .slice(-RETRIEVAL_CONFIG.maxRecentContextCharacters);
  return {
    text: input.message.trim(),
    normalizedTerms: tokenizeRetrievalText(input.message),
    activeProduct:
      inferProduct(input.message) ?? productFromSession(input.session),
    visitorIntent: input.session.currentIntent,
    conversationStage: input.session.currentConversationStage,
    recentContext,
    sectionTypes: sectionTypesFor(input.message),
  };
}

import type {
  ActiveSessionProduct,
  ConversationTopic,
  SessionReferenceResolution,
  VisitorSession,
} from "@/lib/session/session-types";
import type {
  ConversationStageId,
  VisitorIntentId,
} from "@/types/experience";
import type { ProductId } from "@/types/product";

const REFERENCE_PATTERN =
  /\b(the other one|the first one|the second one|which one|both|its|it|that|this)\b/gi;

type ConversationFocus = {
  activeProduct: ActiveSessionProduct | null;
  activeTopic: ConversationTopic | null;
  lastDiscussedFeature: string | null;
  currentIntent: VisitorIntentId | null;
  currentConversationStage: ConversationStageId;
  comparisonProducts: readonly ProductId[];
  resolvedQuestion: string;
  referenceResolution: SessionReferenceResolution | null;
};

function explicitProduct(
  message: string,
  session: VisitorSession,
): ActiveSessionProduct | null {
  const normalized = message.toLocaleLowerCase("en");

  if (/\b(both|both bottles|both products)\b/.test(normalized)) {
    return "both";
  }

  if (/\beveryday(?:\s+bottle)?\b/.test(normalized)) {
    return "everyday";
  }

  if (/\badvanced(?:\s+bottle)?\b/.test(normalized)) {
    return "advanced";
  }

  if (/\bthe first one\b/.test(normalized)) {
    return session.comparisonProducts?.[0] ?? "everyday";
  }

  if (/\bthe second one\b/.test(normalized)) {
    return session.comparisonProducts?.[1] ?? "advanced";
  }

  if (/\bthe other one\b/.test(normalized)) {
    if (session.activeProduct === "advanced") return "everyday";
    if (session.activeProduct === "everyday") return "advanced";
  }

  return null;
}

function explicitTopic(message: string): ConversationTopic | null {
  const normalized = message.toLocaleLowerCase("en");

  if (/\b(compare|comparison|difference|both bottles|both products)\b/.test(normalized)) {
    return "comparison";
  }
  if (/\b(charge|charging)\b/.test(normalized)) return "charging";
  if (/\bbatter(?:y|ies)\b/.test(normalized)) return "battery";
  if (/\b(clean|cleaning|wash|dishwasher)\b/.test(normalized)) {
    return "cleaning";
  }
  if (/\b(inhalation|inhale|inhaling)\b/.test(normalized)) {
    return "hydrogen-inhalation";
  }
  if (/\b(hydrogen water|electrolysis)\b/.test(normalized)) {
    return "hydrogen-water";
  }
  if (/\b(mineral|filter|cartridge)\b/.test(normalized)) {
    return "mineralisation";
  }
  if (/\b(first[- ]time|initial setup|set ?up)\b/.test(normalized)) {
    return "setup";
  }
  if (/\b(maintain|maintenance|care)\b/.test(normalized)) {
    return "maintenance";
  }
  if (/\b(recommend|right for me|should i choose|buy|purchase)\b/.test(normalized)) {
    return "product-selection";
  }

  return null;
}

function discussedFeature(message: string, topic: ConversationTopic | null) {
  const normalized = message.toLocaleLowerCase("en");

  if (/\bhow long|duration|time does\b/.test(normalized)) return "duration";
  if (/\btravell?ing|travel|portable|portability\b/.test(normalized)) {
    return "portability";
  }
  if (/\bsafe|safety\b/.test(normalized)) return "safety";
  if (/\bevery day|daily|frequency|often\b/.test(normalized)) {
    return "frequency";
  }
  if (/\bbatter(?:y|ies)\b/.test(normalized)) return "battery";
  if (/\bfilter|cartridge|mineral\b/.test(normalized)) return "filter";
  if (/\bcharge|charging\b/.test(normalized)) return "charging";
  if (/\bclean|cleaning|wash\b/.test(normalized)) return "cleaning";
  if (/\binhalation|inhale|inhaling\b/.test(normalized)) {
    return "inhalation";
  }
  if (/\brecommend|right for me|should i choose\b/.test(normalized)) {
    return "recommendation";
  }

  return topic;
}

function inferIntent(
  message: string,
  topic: ConversationTopic | null,
  previousIntent: VisitorIntentId | null,
): VisitorIntentId | null {
  const normalized = message.toLocaleLowerCase("en");

  if (/\b(recommend|right for me|should i choose|buy|purchase)\b/.test(normalized)) {
    return "BUYING_INTEREST";
  }
  if (
    topic === "comparison" ||
    /\b(better|both|difference|other one|first one|second one)\b/.test(normalized)
  ) {
    return "COMPARISON";
  }
  if (
    ["battery", "charging", "cleaning", "maintenance", "setup"].includes(
      topic ?? "",
    ) ||
    /\b(safe|safety|filter)\b/.test(normalized)
  ) {
    return "SUPPORT";
  }
  if (topic === "hydrogen-inhalation" || topic === "hydrogen-water") {
    return "TECHNOLOGY";
  }

  return previousIntent ?? "UNKNOWN";
}

function desiredStage(intent: VisitorIntentId | null): ConversationStageId {
  if (intent === "COMPARISON") return "COMPARISON";
  if (intent === "BUYING_INTEREST") return "DECISION";
  if (intent === "SCIENCE" || intent === "TECHNOLOGY") return "LEARNING";
  return "DISCOVERY";
}

function nextStage(
  current: ConversationStageId,
  desired: ConversationStageId,
): ConversationStageId {
  if (current === desired) return current;
  if (current === "WELCOME") return "DISCOVERY";

  const allowed: Record<ConversationStageId, readonly ConversationStageId[]> = {
    WELCOME: ["DISCOVERY"],
    DISCOVERY: ["LEARNING", "COMPARISON", "DECISION", "CLOSING"],
    LEARNING: ["DISCOVERY", "COMPARISON", "DECISION", "CLOSING"],
    COMPARISON: ["LEARNING", "DECISION", "CLOSING"],
    DECISION: ["LEARNING", "COMPARISON", "CLOSING"],
    CLOSING: ["WELCOME"],
  };

  return allowed[current].includes(desired) ? desired : current;
}

function productLabel(product: ActiveSessionProduct | null) {
  if (product === "advanced") return "Advanced Bottle";
  if (product === "everyday") return "Everyday Bottle";
  if (product === "both") return "both bottles";
  return null;
}

function topicLabel(topic: ConversationTopic | null) {
  return topic?.replaceAll("-", " ") ?? null;
}

function resolveReference(
  message: string,
  product: ActiveSessionProduct | null,
  topic: ConversationTopic | null,
): SessionReferenceResolution | null {
  const references = [...message.matchAll(REFERENCE_PATTERN)].map(
    (match) => match[0].toLocaleLowerCase("en"),
  );

  if (references.length === 0) return null;

  const productContext = productLabel(product);
  const topicContext = topicLabel(topic);
  const ambiguous =
    (!productContext && !topicContext) ||
    (product === "both" &&
      references.some((reference) =>
        ["it", "its", "that", "this", "the other one"].includes(reference),
      ));
  const resolvedTo = ambiguous
    ? null
    : [productContext, topicContext].filter(Boolean).join(" — ");

  return {
    reference: [...new Set(references)].join(", "),
    resolvedTo: resolvedTo || null,
    ambiguous,
  };
}

function resolvedQuestion(
  message: string,
  product: ActiveSessionProduct | null,
  topic: ConversationTopic | null,
  resolution: SessionReferenceResolution | null,
) {
  if (!resolution) return message.trim();
  if (resolution.ambiguous) {
    return `${message.trim()} Context note: the reference is ambiguous and requires a brief clarification.`;
  }

  const context = [
    productLabel(product) ? `active product: ${productLabel(product)}` : null,
    topicLabel(topic) ? `active topic: ${topicLabel(topic)}` : null,
  ].filter(Boolean);

  return `${message.trim()} Resolved conversation context: ${context.join("; ")}.`;
}

export function resolveConversationFocus(
  message: string,
  session: VisitorSession,
): ConversationFocus {
  const detectedProduct = explicitProduct(message, session);
  const detectedTopic = explicitTopic(message);
  const activeProduct = detectedProduct ?? session.activeProduct ?? null;
  const activeTopic = detectedTopic ?? session.activeTopic ?? null;
  const referenceResolution = resolveReference(
    message,
    activeProduct,
    activeTopic,
  );
  const currentIntent = inferIntent(
    message,
    activeTopic,
    session.currentIntent,
  );
  const comparisonProducts =
    activeProduct === "both" || activeTopic === "comparison"
      ? (["everyday", "advanced"] as const)
      : (session.comparisonProducts ?? []);

  return {
    activeProduct,
    activeTopic,
    lastDiscussedFeature: discussedFeature(message, activeTopic),
    currentIntent,
    currentConversationStage: nextStage(
      session.currentConversationStage,
      desiredStage(currentIntent),
    ),
    comparisonProducts,
    resolvedQuestion: resolvedQuestion(
      message,
      activeProduct,
      activeTopic,
      referenceResolution,
    ),
    referenceResolution,
  };
}

export function inferProductFromAssistantAnswer(
  answer: string,
): ActiveSessionProduct | null {
  const normalized = answer.toLocaleLowerCase("en");
  const mentionsEveryday = normalized.includes("everyday bottle");
  const mentionsAdvanced = normalized.includes("advanced bottle");

  if (mentionsEveryday && mentionsAdvanced) return "both";
  if (mentionsEveryday) return "everyday";
  if (mentionsAdvanced) return "advanced";
  return null;
}

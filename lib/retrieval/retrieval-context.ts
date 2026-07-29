import type {
  RetrievalContext,
  RetrievalResult,
} from "@/lib/retrieval/retrieval-types";

function visitorSafeKnowledge(text: string): string {
  return text
    .replace(
      /\bLaikfvea\s+Hydrogen\s+Water\s+Generator\s+Pro\b/gi,
      "Advanced Bottle",
    )
    .replace(/\bLaikfvea\s+PRO\b/gi, "Advanced Bottle")
    .replace(/\bLaikfvea\s+GO\b/gi, "Everyday Bottle")
    .replace(/\bLaikfvea\b/gi, "the manufacturer");
}

export function createRetrievalContext(
  result: RetrievalResult,
): RetrievalContext {
  return {
    passages: result.matchedChunks.map(({ chunk }) => ({
      sourceReference: chunk.sourceReference,
      text: visitorSafeKnowledge(chunk.text),
    })),
    confidence: result.confidence,
    insufficientKnowledge: result.insufficientKnowledge,
  };
}

export function sanitizeVisitorResponse(response: string): string {
  return visitorSafeKnowledge(response);
}

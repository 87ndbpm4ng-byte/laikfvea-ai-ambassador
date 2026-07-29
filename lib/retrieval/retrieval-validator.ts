import type {
  RetrievalChunk,
  RetrievalResult,
  RetrievalValidation,
} from "@/lib/retrieval/retrieval-types";

const INSTRUCTION_INJECTION =
  /\b(ignore|override|disregard|reveal|replace)\b.{0,50}\b(instruction|prompt|system|rule|policy)\b/i;

export function isSafeKnowledgeChunk(chunk: RetrievalChunk): boolean {
  return (
    chunk.approvalStatus === "approved" &&
    Boolean(chunk.sourceId) &&
    Boolean(chunk.sourceReference) &&
    !INSTRUCTION_INJECTION.test(chunk.text)
  );
}

export function validateRetrievalResult(
  result: Omit<RetrievalResult, "validation">,
): RetrievalValidation {
  const reasons: string[] = [];
  if (result.matchedChunks.some(({ chunk }) => !isSafeKnowledgeChunk(chunk))) {
    reasons.push("A matched chunk failed approval, traceability, or injection validation.");
  }
  if (
    result.insufficientKnowledge &&
    !["none", "low"].includes(result.confidence)
  ) {
    reasons.push("Insufficient knowledge cannot have medium or high confidence.");
  }
  return { valid: reasons.length === 0, reasons };
}

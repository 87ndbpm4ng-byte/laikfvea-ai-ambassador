import { RETRIEVAL_CONFIG } from "@/lib/retrieval/retrieval-config";
import { RetrievalIndex } from "@/lib/retrieval/retrieval-index";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { rankChunks } from "@/lib/retrieval/retrieval-ranker";
import type {
  KnowledgeRetriever,
  RetrievalConfidence,
  RetrievalQuery,
  RetrievalResult,
} from "@/lib/retrieval/retrieval-types";
import { validateRetrievalResult } from "@/lib/retrieval/retrieval-validator";

function confidenceFor(score: number): RetrievalConfidence {
  if (score >= RETRIEVAL_CONFIG.thresholds.high) return "high";
  if (score >= RETRIEVAL_CONFIG.thresholds.medium) return "medium";
  if (score >= RETRIEVAL_CONFIG.thresholds.low) return "low";
  return "none";
}

export class RetrievalEngine implements KnowledgeRetriever {
  constructor(private readonly loader: ApprovedKnowledgeLoader) {}

  async search(query: RetrievalQuery): Promise<RetrievalResult> {
    const index = new RetrievalIndex(await this.loader.load());
    const ranked = rankChunks(query, index.chunks);
    const selected = [];
    let totalCharacters = 0;
    for (const match of ranked) {
      if (
        selected.length >= RETRIEVAL_CONFIG.maxChunks ||
        totalCharacters + match.chunk.text.length >
          RETRIEVAL_CONFIG.maxTotalCharacters
      ) {
        continue;
      }
      selected.push(match);
      totalCharacters += match.chunk.text.length;
    }
    const confidence = confidenceFor(selected[0]?.score ?? 0);
    const insufficientKnowledge = confidence === "low" || confidence === "none";
    const base = {
      query,
      matchedChunks: insufficientKnowledge ? [] : selected,
      confidence,
      sourceReferences: insufficientKnowledge
        ? []
        : selected.map(({ chunk }) => chunk.sourceReference),
      reason:
        confidence === "none"
          ? "No approved passage matched the query."
          : confidence === "low"
            ? "Only weak approved-knowledge matches were found."
            : "Approved passages matched the query.",
      insufficientKnowledge,
      skipped: false,
    } satisfies Omit<RetrievalResult, "validation">;
    return { ...base, validation: validateRetrievalResult(base) };
  }
}

export function createSkippedRetrievalResult(
  query: RetrievalQuery,
): RetrievalResult {
  const base = {
    query,
    matchedChunks: [],
    confidence: "none" as const,
    sourceReferences: [],
    reason: "Retrieval was skipped for a conversational transition.",
    insufficientKnowledge: false,
    skipped: true,
  };
  return { ...base, validation: validateRetrievalResult(base) };
}

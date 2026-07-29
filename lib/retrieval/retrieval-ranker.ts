import { RETRIEVAL_CONFIG } from "@/lib/retrieval/retrieval-config";
import { tokenizeRetrievalText } from "@/lib/retrieval/retrieval-query";
import { isSafeKnowledgeChunk } from "@/lib/retrieval/retrieval-validator";
import type {
  RankedRetrievalChunk,
  RetrievalChunk,
  RetrievalQuery,
} from "@/lib/retrieval/retrieval-types";

export function rankChunks(
  query: RetrievalQuery,
  chunks: readonly RetrievalChunk[],
): RankedRetrievalChunk[] {
  const phrase = query.text.toLocaleLowerCase("en");
  const contextTerms = new Set(tokenizeRetrievalText(query.recentContext));
  return chunks
    .filter(isSafeKnowledgeChunk)
    .map((chunk) => {
      let score = 0;
      const signals: string[] = [];
      const heading = chunk.heading.toLocaleLowerCase("en");
      const body = chunk.text.toLocaleLowerCase("en");
      if (phrase.length >= 5 && body.includes(phrase)) {
        score += RETRIEVAL_CONFIG.weights.exactPhrase;
        signals.push("exact-phrase");
      }
      for (const term of query.normalizedTerms) {
        if (heading.includes(term)) {
          score += RETRIEVAL_CONFIG.weights.headingTerm;
          signals.push(`heading:${term}`);
        } else if (body.includes(term)) {
          score += RETRIEVAL_CONFIG.weights.bodyTerm;
          signals.push(`body:${term}`);
        }
      }
      if (query.activeProduct && chunk.product === query.activeProduct) {
        score += RETRIEVAL_CONFIG.weights.productMatch;
        signals.push("product-match");
      } else if (
        query.activeProduct &&
        chunk.product &&
        chunk.product !== query.activeProduct
      ) {
        score += RETRIEVAL_CONFIG.weights.productMismatch;
        signals.push("product-mismatch");
      }
      if (query.sectionTypes.includes(chunk.sectionType)) {
        score += RETRIEVAL_CONFIG.weights.sectionTypeMatch;
        signals.push("section-type");
      }
      if (
        query.visitorIntent === "SUPPORT" &&
        ["cleaning", "charging", "maintenance", "troubleshooting"].includes(
          chunk.sectionType,
        )
      ) {
        score += RETRIEVAL_CONFIG.weights.intentMatch;
        signals.push("intent");
      }
      if (
        ["safety", "warnings"].includes(chunk.sectionType) &&
        query.sectionTypes.some((type) => ["safety", "warnings"].includes(type))
      ) {
        score += RETRIEVAL_CONFIG.weights.safetyMatch;
        signals.push("safety");
      }
      for (const term of contextTerms) {
        if (body.includes(term)) {
          score += RETRIEVAL_CONFIG.weights.recentContextTerm;
          signals.push(`context:${term}`);
        }
      }
      return { chunk, score, matchedSignals: [...new Set(signals)] };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score);
}

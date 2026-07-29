import type { RetrievalResult } from "@/lib/retrieval/retrieval-types";

export type RetrievalDiagnostics = {
  query: RetrievalResult["query"];
  matchedChunks: readonly {
    chunkId: string;
    heading: string;
    score: number;
  }[];
  confidence: RetrievalResult["confidence"];
  sourceReferences: readonly string[];
  skipped: boolean;
};

export function createRetrievalDiagnostics(
  result: RetrievalResult,
): RetrievalDiagnostics | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  return {
    query: result.query,
    matchedChunks: result.matchedChunks.map(({ chunk, score }) => ({
      chunkId: chunk.chunkId,
      heading: chunk.heading,
      score,
    })),
    confidence: result.confidence,
    sourceReferences: result.sourceReferences,
    skipped: result.skipped,
  };
}

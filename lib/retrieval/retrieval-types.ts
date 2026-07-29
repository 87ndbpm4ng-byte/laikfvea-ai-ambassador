import type { ConversationStageId, VisitorIntentId } from "@/types/experience";

export type RetrievalProduct = "everyday" | "advanced";
export type RetrievalConfidence = "high" | "medium" | "low" | "none";
export type KnowledgeApprovalStatus = "approved";
export type KnowledgeDocumentType =
  | "manual"
  | "technical-specifications"
  | "maintenance-guide"
  | "troubleshooting-guide"
  | "product-faq"
  | "exhibition-faq"
  | "company-information"
  | "other";

export type ApprovedKnowledgeDocument = {
  documentId: string;
  title: string;
  sourceId: string;
  sourceType: string;
  documentType: KnowledgeDocumentType;
  sourcePriority: number;
  sourceVersion: string | null;
  language: string;
  product: RetrievalProduct | null;
  approvalStatus: KnowledgeApprovalStatus;
  topics: readonly string[];
  tags: readonly string[];
  content: string;
};

export type RetrievalChunk = {
  chunkId: string;
  sourceId: string;
  sourceType: string;
  documentTitle: string;
  documentType: KnowledgeDocumentType;
  sourcePriority: number;
  sourceVersion: string | null;
  language: string;
  product: RetrievalProduct | null;
  heading: string;
  sectionType: string;
  text: string;
  sourceReference: string;
  tags: readonly string[];
  topics: readonly string[];
  approvalStatus: KnowledgeApprovalStatus;
  retrievalMetadata: {
    documentId: string;
    tokenCount: number;
    order: number;
  };
};

export type RetrievalQuery = {
  text: string;
  normalizedTerms: readonly string[];
  activeProduct: RetrievalProduct | null;
  visitorIntent: VisitorIntentId | null;
  conversationStage: ConversationStageId;
  recentContext: string;
  sectionTypes: readonly string[];
};

export type RankedRetrievalChunk = {
  chunk: RetrievalChunk;
  score: number;
  matchedSignals: readonly string[];
};

export type RetrievalValidation = {
  valid: boolean;
  reasons: readonly string[];
};

export type RetrievalResult = {
  query: RetrievalQuery;
  matchedChunks: readonly RankedRetrievalChunk[];
  confidence: RetrievalConfidence;
  sourceReferences: readonly string[];
  reason: string;
  insufficientKnowledge: boolean;
  validation: RetrievalValidation;
  skipped: boolean;
};

export type RetrievalContext = {
  passages: readonly {
    sourceReference: string;
    sourceId: string;
    documentTitle: string;
    documentType: KnowledgeDocumentType;
    sourcePriority: number;
    sourceVersion: string | null;
    language: string;
    product: RetrievalProduct | null;
    topics: readonly string[];
    text: string;
  }[];
  confidence: RetrievalConfidence;
  insufficientKnowledge: boolean;
};

export interface KnowledgeRetriever {
  search(query: RetrievalQuery): Promise<RetrievalResult>;
}

import type { ReviewIssue } from "./review-issue";

export type ManualInputType =
  | "plain-text"
  | "markdown"
  | "extracted-pdf-text"
  | "multi-page-image";

export interface SourceDocument {
  sourceId: string;
  title?: string;
  product?: string;
  documentType: ManualInputType;
  version?: string;
  publicationDate?: string;
  language?: string;
  approvalStatus: "unreviewed" | "source-approved";
  originalFilename: string;
  importedAt: string;
  checksum: string;
  rawText: string;
  pageInformationAvailable: boolean;
  extractionReviewIssues?: ReviewIssue[];
}

export interface SourceDocumentInput {
  rawText: string;
  originalFilename: string;
  documentType: ManualInputType;
  sourceId?: string;
  title?: string;
  product?: string;
  version?: string;
  publicationDate?: string;
  language?: string;
  pageInformationAvailable?: boolean;
  extractionReviewIssues?: ReviewIssue[];
  sourceChecksum?: string;
}

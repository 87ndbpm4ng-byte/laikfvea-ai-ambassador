import type { ExtractedSection } from "./extracted-section";
import type { ReviewIssue } from "./review-issue";
import type { SourceDocument } from "./source-document";

export interface ImportOptions {
  projectRoot?: string;
  draftRoot?: string;
  reportRoot?: string;
  dryRun?: boolean;
  importedAt?: string;
}

export interface DraftDocument {
  relativePath: string;
  content: string;
  sourceReferences: string[];
  status: "draft";
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
}

export interface ImportValidationResult {
  valid: boolean;
  checks: ValidationCheck[];
  issues: ReviewIssue[];
}

export interface ImportReportLocations {
  json: string;
  markdown: string;
}

export interface ImportResult {
  success: boolean;
  generatedFiles: string[];
  detectedSections: ExtractedSection[];
  reviewIssues: ReviewIssue[];
  validationResult: ImportValidationResult;
  reportLocation: ImportReportLocations;
}

export interface ImportReport {
  importId: string;
  timestamp: string;
  sourceDocument: Omit<SourceDocument, "rawText">;
  detectedMetadata: Record<string, string | boolean | null>;
  detectedSections: Array<{
    sectionId: string;
    kind: string;
    heading: string;
    sourceReference: string;
  }>;
  generatedDraftFiles: string[];
  warnings: ReviewIssue[];
  unresolvedIssues: ReviewIssue[];
  skippedContent: string[];
  validationResult: ImportValidationResult;
}

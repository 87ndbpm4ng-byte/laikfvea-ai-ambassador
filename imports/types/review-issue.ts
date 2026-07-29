import type { SourceReference } from "./extracted-section";

export type ReviewIssueType =
  | "MISSING_METADATA"
  | "AMBIGUOUS_TEXT"
  | "CONFLICTING_INFORMATION"
  | "POSSIBLE_MARKETING_CLAIM"
  | "POSSIBLE_MEDICAL_CLAIM"
  | "UNRECOGNISED_UNIT"
  | "MISSING_PAGE_REFERENCE"
  | "DUPLICATE_INFORMATION"
  | "UNSUPPORTED_SECTION"
  | "MANUAL_REVIEW_REQUIRED";

export interface ReviewIssue {
  id: string;
  type: ReviewIssueType;
  severity: "info" | "warning" | "error";
  message: string;
  sourceReference?: SourceReference;
  suggestedAction: string;
}

export type SectionKind =
  | "product-overview"
  | "components"
  | "setup"
  | "charging"
  | "operation"
  | "cleaning"
  | "maintenance"
  | "safety"
  | "warnings"
  | "troubleshooting"
  | "error-codes"
  | "technical-specifications"
  | "storage"
  | "warranty"
  | "contact-information"
  | "unknown";

export interface SourceReference {
  referenceId: string;
  sourceId: string;
  stableSectionId: string;
  originalHeading: string;
  pageNumber?: number;
  startLine: number;
  endLine: number;
}

export interface ExtractedSection {
  sectionId: string;
  kind: SectionKind;
  originalHeading: string;
  content: string;
  order: number;
  pageNumber?: number;
  startLine: number;
  endLine: number;
  sourceReference: SourceReference;
}

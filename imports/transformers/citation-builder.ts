import type { ExtractedSection } from "../types/extracted-section";

export function buildCitation(section: ExtractedSection): string {
  const location = section.pageNumber
    ? `page ${section.pageNumber}`
    : `lines ${section.startLine}–${section.endLine}`;
  return `[${section.sourceReference.referenceId}] ${section.sourceReference.sourceId}; ${location}; original heading: "${section.originalHeading}"`;
}

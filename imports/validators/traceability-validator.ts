import type { ExtractedSection } from "../types/extracted-section";
import type { DraftDocument, ValidationCheck } from "../types/import-types";

export function validateTraceability(
  sections: ExtractedSection[],
  draft: DraftDocument,
): ValidationCheck[] {
  const allSectionsReferenced = sections.every(
    (section) =>
      Boolean(section.sourceReference.sourceId) &&
      Boolean(section.sourceReference.referenceId) &&
      draft.content.includes(section.sourceReference.referenceId),
  );
  const lineOrPagePresent = sections.every(
    (section) =>
      section.pageNumber !== undefined ||
      (section.startLine > 0 && section.endLine >= section.startLine),
  );
  return [
    {
      name: "all-factual-sections-referenced",
      passed: allSectionsReferenced,
      message: allSectionsReferenced
        ? "Every extracted section has a source ID and a reference present in the draft."
        : "At least one extracted section is missing a source reference.",
    },
    {
      name: "stable-source-location",
      passed: lineOrPagePresent,
      message: lineOrPagePresent
        ? "Every reference includes a page number or stable source line range."
        : "At least one reference has neither a page number nor a valid line range.",
    },
  ];
}

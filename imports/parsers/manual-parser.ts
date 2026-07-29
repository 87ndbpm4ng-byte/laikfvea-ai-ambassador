import type { ExtractedSection } from "../types/extracted-section";
import type { ReviewIssue } from "../types/review-issue";
import type { SourceDocument } from "../types/source-document";
import { detectSections } from "./section-detector";
import { normaliseManualText } from "./text-normaliser";

export interface ParsedManual {
  sourceDocument: SourceDocument;
  sections: ExtractedSection[];
  reviewIssues: ReviewIssue[];
  skippedContent: string[];
}

export interface ManualParser {
  parse(sourceDocument: SourceDocument): ParsedManual;
}

export class DeterministicManualParser implements ManualParser {
  parse(sourceDocument: SourceDocument): ParsedManual {
    const normalisedText = normaliseManualText(sourceDocument.rawText);
    const detection = detectSections(normalisedText, sourceDocument.sourceId);
    const issues = [
      ...(sourceDocument.extractionReviewIssues ?? []),
      ...detection.issues,
    ];
    const sectionsByHeading = new Map<string, ExtractedSection[]>();

    for (const section of detection.sections) {
      const key = section.originalHeading.toLocaleLowerCase("en");
      sectionsByHeading.set(key, [...(sectionsByHeading.get(key) ?? []), section]);
      if (/[�]|\?\?\?|\[(?:illegible|unreadable)]/i.test(section.content)) {
        issues.push({
          id: `${section.sectionId}-AMBIGUOUS`,
          type: "AMBIGUOUS_TEXT",
          severity: "error",
          message: "The extracted text contains an unreadable or explicitly ambiguous marker.",
          sourceReference: section.sourceReference,
          suggestedAction: "Inspect the same passage in the official manual and correct it manually.",
        });
      }
    }

    for (const matchingSections of sectionsByHeading.values()) {
      if (matchingSections.length < 2) continue;
      const uniqueContent = new Set(matchingSections.map((section) => section.content));
      const first = matchingSections[0];
      issues.push({
        id: `${first.sectionId}-${uniqueContent.size === 1 ? "DUPLICATE" : "CONFLICT"}`,
        type:
          uniqueContent.size === 1
            ? "DUPLICATE_INFORMATION"
            : "CONFLICTING_INFORMATION",
        severity: "warning",
        message:
          uniqueContent.size === 1
            ? "The same heading and content appear more than once."
            : "The same heading appears with different content; the importer did not reconcile the statements.",
        sourceReference: first.sourceReference,
        suggestedAction: "Compare every occurrence against the source and decide manually whether each must remain.",
      });
    }

    return {
      sourceDocument: { ...sourceDocument, rawText: normalisedText },
      sections: detection.sections,
      reviewIssues: issues,
      skippedContent: [],
    };
  }
}

import {
  KNOWN_UNITS,
  MARKETING_TERMS,
  MEDICAL_TERMS,
  NON_UNIT_NUMERIC_FOLLOWERS,
} from "../config/import-config";
import type { ExtractedSection } from "../types/extracted-section";
import type { ReviewIssue } from "../types/review-issue";

const UNIT_PATTERN = /\b\d+(?:[.,]\d+)?\s*([a-zA-Z°%]+)\b/g;

export function findUnsupportedContentIssues(
  sections: ExtractedSection[],
): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  for (const section of sections) {
    if (MEDICAL_TERMS.test(section.content)) {
      issues.push({
        id: `${section.sectionId}-MEDICAL`,
        type: "POSSIBLE_MEDICAL_CLAIM",
        severity: "error",
        message: "Treatment- or health-related wording was preserved from the source and requires human review.",
        sourceReference: section.sourceReference,
        suggestedAction: "Verify the exact wording and its approved usage against the official source and policy.",
      });
    }
    if (MARKETING_TERMS.test(section.content)) {
      issues.push({
        id: `${section.sectionId}-MARKETING`,
        type: "POSSIBLE_MARKETING_CLAIM",
        severity: "warning",
        message: "Potential marketing language was preserved and must not be treated as a factual claim automatically.",
        sourceReference: section.sourceReference,
        suggestedAction: "Classify or remove the wording manually after checking the official source.",
      });
    }
    const seenUnits = new Set<string>();
    for (const match of section.content.matchAll(UNIT_PATTERN)) {
      const unit = match[1].toLocaleLowerCase("en");
      if (
        !KNOWN_UNITS.has(unit) &&
        !NON_UNIT_NUMERIC_FOLLOWERS.has(unit) &&
        !seenUnits.has(unit)
      ) {
        seenUnits.add(unit);
        issues.push({
          id: `${section.sectionId}-UNIT-${unit.toUpperCase()}`,
          type: "UNRECOGNISED_UNIT",
          severity: "warning",
          message: `The unit token "${match[1]}" is not in the importer allow-list and was preserved exactly.`,
          sourceReference: section.sourceReference,
          suggestedAction: "Verify the unit against the official manual without converting or normalising it.",
        });
      }
    }
  }
  return issues;
}

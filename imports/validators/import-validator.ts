import path from "node:path";
import type { ParsedManual } from "../parsers/manual-parser";
import type {
  DraftDocument,
  ImportValidationResult,
  ValidationCheck,
} from "../types/import-types";
import type { ReviewIssue } from "../types/review-issue";
import { validateTraceability } from "./traceability-validator";
import { findUnsupportedContentIssues } from "./unsupported-content-validator";

const REQUIRED_METADATA = ["title", "product", "version", "language"] as const;

function missingMetadataIssues(parsed: ParsedManual): ReviewIssue[] {
  return REQUIRED_METADATA.flatMap((field) => {
    if (parsed.sourceDocument[field]) return [];
    return [
      {
        id: `${parsed.sourceDocument.sourceId}-MISSING-${field.toUpperCase()}`,
        type: "MISSING_METADATA" as const,
        severity: "warning" as const,
        message: `Source metadata field "${field}" was not provided and remains null in the draft.`,
        suggestedAction: `Check the official manual and add "${field}" manually if it is explicitly available.`,
      },
    ];
  });
}

function contentPreservationChecks(
  parsed: ParsedManual,
  draft: DraftDocument,
): ValidationCheck[] {
  const warnings = parsed.sections.filter((section) =>
    ["safety", "warnings"].includes(section.kind),
  );
  const warningsPreserved = warnings.every((section) =>
    draft.content.includes(section.content),
  );
  const sourceContentPreserved = parsed.sections.every((section) =>
    draft.content.includes(section.content),
  );
  return [
    {
      name: "source-content-preserved-verbatim",
      passed: sourceContentPreserved,
      message: sourceContentPreserved
        ? "Every extracted section appears unchanged in the generated draft."
        : "At least one extracted section was changed or omitted.",
    },
    {
      name: "warnings-preserved",
      passed: warningsPreserved,
      message: warningsPreserved
        ? "All detected warnings and limitations are preserved."
        : "A detected warning or limitation is missing from the draft.",
    },
  ];
}

export function validateImport(
  parsed: ParsedManual,
  draft: DraftDocument,
  draftRoot: string,
): ImportValidationResult {
  const discoveredIssues = [
    ...missingMetadataIssues(parsed),
    ...findUnsupportedContentIssues(parsed.sections),
  ];
  const resolvedRoot = path.resolve(draftRoot);
  const resolvedOutput = path.resolve(draftRoot, draft.relativePath);
  const safePath =
    path.basename(resolvedRoot).toLocaleLowerCase("en") === "drafts" &&
    resolvedOutput.startsWith(`${resolvedRoot}${path.sep}`) &&
    !path.isAbsolute(draft.relativePath);
  const checks: ValidationCheck[] = [
    {
      name: "source-id-present",
      passed: Boolean(parsed.sourceDocument.sourceId),
      message: parsed.sourceDocument.sourceId
        ? "A source ID is present."
        : "The source ID is missing.",
    },
    {
      name: "draft-status-enforced",
      passed:
        draft.status === "draft" &&
        /^status: draft$/m.test(draft.content) &&
        !/^status: approved$/m.test(draft.content),
      message:
        draft.status === "draft"
          ? "The generated document is explicitly marked as draft."
          : "The generated document does not have draft status.",
    },
    {
      name: "safe-draft-output-path",
      passed: safePath,
      message: safePath
        ? 'The output path resolves inside a configured directory named "drafts".'
        : 'The output path is unsafe or its configured root is not named "drafts".',
    },
    ...validateTraceability(parsed.sections, draft),
    ...contentPreservationChecks(parsed, draft),
  ];
  const blockingReviewIssue = [
    ...parsed.reviewIssues,
    ...discoveredIssues,
  ].some((issue) => issue.severity === "error");
  const valid = checks.every((check) => check.passed) && !blockingReviewIssue;
  return {
    valid,
    checks,
    issues: discoveredIssues,
  };
}

import path from "node:path";
import type { ParsedManual } from "../parsers/manual-parser";
import type { ExtractedSection, SectionKind } from "../types/extracted-section";
import type { DraftDocument } from "../types/import-types";
import type { ReviewIssue } from "../types/review-issue";
import { buildCitation } from "./citation-builder";
import { buildDraftFrontmatter } from "./metadata-builder";

const GROUPS: ReadonlyArray<{
  heading: string;
  kinds: readonly SectionKind[];
}> = [
  {
    heading: "Extracted official information",
    kinds: [
      "product-overview",
      "components",
      "technical-specifications",
      "storage",
      "warranty",
      "contact-information",
      "unknown",
    ],
  },
  {
    heading: "Operating instructions",
    kinds: ["setup", "charging", "operation", "cleaning", "maintenance"],
  },
  {
    heading: "Warnings and limitations",
    kinds: ["safety", "warnings"],
  },
  {
    heading: "Troubleshooting information",
    kinds: ["troubleshooting", "error-codes"],
  },
];

function safeSegment(value: string): string {
  const segment = value.toLocaleLowerCase("en").replace(/[^a-z0-9-]+/g, "-");
  return segment.replace(/^-+|-+$/g, "") || "source";
}

function renderSection(section: ExtractedSection): string {
  return [
    `### ${section.originalHeading}`,
    "",
    section.content,
    "",
    `Source: ${buildCitation(section)}`,
  ].join("\n");
}

function renderIssues(issues: ReviewIssue[]): string {
  if (issues.length === 0) return "";
  return [
    "## Review issues",
    "",
    ...issues.map(
      (issue) =>
        `- **${issue.severity.toUpperCase()} — ${issue.type}:** ${issue.message} Action: ${issue.suggestedAction}`,
    ),
  ].join("\n");
}

export function transformManualToDraft(parsed: ParsedManual): DraftDocument {
  const source = parsed.sourceDocument;
  const metadataRows = [
    `- Source ID: \`${source.sourceId}\``,
    `- Original filename: \`${source.originalFilename}\``,
    `- Checksum (SHA-256): \`${source.checksum}\``,
    `- Source approval status: \`${source.approvalStatus}\``,
    `- Page information available: \`${source.pageInformationAvailable}\``,
  ];
  const bodyGroups = GROUPS.map(({ heading, kinds }) => {
    const matching = parsed.sections.filter((section) =>
      kinds.includes(section.kind),
    );
    if (matching.length === 0) return "";
    return [`## ${heading}`, "", ...matching.map(renderSection)].join("\n\n");
  }).filter(Boolean);
  const unresolved =
    parsed.reviewIssues.length > 0
      ? [
          "## Unresolved questions",
          "",
          "The issues below require comparison with the official source. The importer has not resolved or inferred any missing or contradictory information.",
        ].join("\n")
      : "";
  const references = [
    "## Source references",
    "",
    ...parsed.sections.map((section) => `- ${buildCitation(section)}`),
  ].join("\n");
  const content = [
    buildDraftFrontmatter(source),
    "",
    "# Manual import draft",
    "",
    "> DRAFT — Human review is required. This document is not available to the live assistant.",
    "",
    "## Source metadata",
    "",
    ...metadataRows,
    "",
    ...bodyGroups,
    unresolved,
    renderIssues(parsed.reviewIssues),
    references,
    "",
  ]
    .filter((part) => part !== "")
    .join("\n\n");

  return {
    relativePath: path.join(
      "products",
      `${safeSegment(source.sourceId)}-manual-draft.md`,
    ),
    content,
    sourceReferences: parsed.sections.map(
      (section) => section.sourceReference.referenceId,
    ),
    status: "draft",
  };
}

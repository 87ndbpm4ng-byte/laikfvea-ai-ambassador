import { PAGE_MARKER, SECTION_HEADINGS } from "../config/import-config";
import type {
  ExtractedSection,
  SectionKind,
} from "../types/extracted-section";
import type { ReviewIssue } from "../types/review-issue";
import { normaliseHeading, slugifyReference } from "./text-normaliser";

interface DetectionResult {
  sections: ExtractedSection[];
  issues: ReviewIssue[];
}

interface WorkingSection {
  heading: string;
  kind: SectionKind;
  pageNumber?: number;
  startLine: number;
  lines: string[];
}

function headingFromLine(line: string): { heading: string; kind: SectionKind } | null {
  const markdownHeading = /^#{1,6}\s+(.+)$/.exec(line);
  const candidate = markdownHeading?.[1] ?? line;
  const normalised = normaliseHeading(candidate);
  const knownKind = SECTION_HEADINGS[normalised];
  if (knownKind) {
    return { heading: candidate.trim(), kind: knownKind };
  }
  if (markdownHeading) {
    return { heading: candidate.trim(), kind: "unknown" };
  }
  return null;
}

export function detectSections(
  text: string,
  sourceId: string,
): DetectionResult {
  const lines = text.split("\n");
  const sections: ExtractedSection[] = [];
  const issues: ReviewIssue[] = [];
  let currentPage: number | undefined;
  let working: WorkingSection | null = null;

  const finishSection = (endLine: number) => {
    if (!working) return;
    const content = working.lines.join("\n").trim();
    if (!content) {
      working = null;
      return;
    }
    const order = sections.length + 1;
    const pageToken = working.pageNumber ? `P${working.pageNumber}` : "NP";
    const headingToken = slugifyReference(working.heading);
    const stableSectionId = `${sourceId}-${pageToken}-${headingToken}-${String(order).padStart(2, "0")}`;
    const sourceReference = {
      referenceId: stableSectionId,
      sourceId,
      stableSectionId,
      originalHeading: working.heading,
      pageNumber: working.pageNumber,
      startLine: working.startLine,
      endLine,
    };
    sections.push({
      sectionId: stableSectionId,
      kind: working.kind,
      originalHeading: working.heading,
      content,
      order,
      pageNumber: working.pageNumber,
      startLine: working.startLine,
      endLine,
      sourceReference,
    });
    if (working.kind === "unknown") {
      issues.push({
        id: `${stableSectionId}-UNSUPPORTED`,
        type: "UNSUPPORTED_SECTION",
        severity: "warning",
        message: `The section "${working.heading}" is not in the recognised manual-section catalogue and was preserved unchanged.`,
        sourceReference,
        suggestedAction: "Compare the section with the source and classify it manually.",
      });
    }
    if (!working.pageNumber) {
      issues.push({
        id: `${stableSectionId}-NO-PAGE`,
        type: "MISSING_PAGE_REFERENCE",
        severity: "info",
        message: "No page number was available; the stable section ID and source line range are used instead.",
        sourceReference,
        suggestedAction: "Verify the line range or add page markers from the official source during review.",
      });
    }
    working = null;
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const pageMatch = PAGE_MARKER.exec(line.trim());
    if (pageMatch) {
      finishSection(lineNumber - 1);
      currentPage = Number(pageMatch[1]);
      return;
    }
    const heading = headingFromLine(line);
    if (heading) {
      finishSection(lineNumber - 1);
      working = {
        heading: heading.heading,
        kind: heading.kind,
        pageNumber: currentPage,
        startLine: lineNumber,
        lines: [],
      };
      return;
    }
    if (!working && line.trim()) {
      working = {
        heading: "Unscoped source text",
        kind: "unknown",
        pageNumber: currentPage,
        startLine: lineNumber,
        lines: [],
      };
    }
    working?.lines.push(line);
  });
  finishSection(lines.length);

  return { sections, issues };
}

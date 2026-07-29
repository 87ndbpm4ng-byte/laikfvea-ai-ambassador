import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ImportReport,
  ImportReportLocations,
} from "../types/import-types";

function markdownReport(report: ImportReport): string {
  const sectionRows = report.detectedSections.map(
    (section) =>
      `| ${section.kind} | ${section.heading} | ${section.sourceReference} |`,
  );
  const issues = report.unresolvedIssues.length
    ? report.unresolvedIssues.map(
        (issue) =>
          `- **${issue.severity.toUpperCase()} — ${issue.type}:** ${issue.message} Action: ${issue.suggestedAction}`,
      )
    : ["- None detected."];
  const checks = report.validationResult.checks.map(
    (check) =>
      `- ${check.passed ? "PASS" : "FAIL"} — **${check.name}:** ${check.message}`,
  );
  return [
    `# Import report: ${report.sourceDocument.sourceId}`,
    "",
    `- Import ID: \`${report.importId}\``,
    `- Timestamp: \`${report.timestamp}\``,
    `- Original filename: \`${report.sourceDocument.originalFilename}\``,
    `- Checksum: \`${report.sourceDocument.checksum}\``,
    `- Validation: **${report.validationResult.valid ? "PASSED" : "FAILED CLOSED"}**`,
    "",
    "## Detected metadata",
    "",
    "```json",
    JSON.stringify(report.detectedMetadata, null, 2),
    "```",
    "",
    "## Detected sections",
    "",
    "| Kind | Original heading | Source reference |",
    "| --- | --- | --- |",
    ...sectionRows,
    "",
    "## Generated draft files",
    "",
    ...(report.generatedDraftFiles.length
      ? report.generatedDraftFiles.map((file) => `- \`${file}\``)
      : ["- None. Validation prevented draft writing."]),
    "",
    "## Unresolved issues",
    "",
    ...issues,
    "",
    "## Skipped content",
    "",
    ...(report.skippedContent.length
      ? report.skippedContent.map((item) => `- ${item}`)
      : ["- None."]),
    "",
    "## Validation results",
    "",
    ...checks,
    "",
    "> This report does not approve or promote imported content.",
    "",
  ].join("\n");
}

export async function writeImportReport(
  reportRoot: string,
  report: ImportReport,
): Promise<ImportReportLocations> {
  const reportDirectory = path.join(reportRoot, report.importId);
  await mkdir(reportDirectory, { recursive: true });
  const json = path.join(reportDirectory, "import-report.json");
  const markdown = path.join(reportDirectory, "import-report.md");
  await Promise.all([
    writeFile(json, `${JSON.stringify(report, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    }),
    writeFile(markdown, markdownReport(report), {
      encoding: "utf8",
      flag: "wx",
    }),
  ]);
  return { json, markdown };
}

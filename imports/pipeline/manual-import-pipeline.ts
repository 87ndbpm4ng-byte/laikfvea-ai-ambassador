import { createHash } from "node:crypto";
import path from "node:path";
import { defaultImportPaths } from "../config/import-config";
import {
  DeterministicManualParser,
  type ManualParser,
} from "../parsers/manual-parser";
import { writeDraft } from "../output/draft-writer";
import { writeImportReport } from "../output/import-report-writer";
import { transformManualToDraft } from "../transformers/knowledge-transformer";
import type {
  ImportOptions,
  ImportReport,
  ImportResult,
} from "../types/import-types";
import type {
  SourceDocument,
  SourceDocumentInput,
} from "../types/source-document";
import { validateImport } from "../validators/import-validator";

function checksum(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function safeSourceId(value: string): string {
  const clean = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!clean) throw new Error("sourceId must contain letters or numbers.");
  return clean;
}

export function createSourceDocument(
  input: SourceDocumentInput,
  importedAt = new Date().toISOString(),
): SourceDocument {
  const sourceChecksum = input.sourceChecksum ?? checksum(input.rawText);
  return {
    sourceId: safeSourceId(
      input.sourceId ?? `SRC-${sourceChecksum.slice(0, 12)}`,
    ),
    title: input.title,
    product: input.product,
    documentType: input.documentType,
    version: input.version,
    publicationDate: input.publicationDate,
    language: input.language,
    approvalStatus: "unreviewed",
    originalFilename: input.originalFilename,
    importedAt,
    checksum: sourceChecksum,
    rawText: input.rawText,
    pageInformationAvailable:
      input.pageInformationAvailable ?? /\[\[PAGE:\d+]]/i.test(input.rawText),
    extractionReviewIssues: input.extractionReviewIssues,
  };
}

export class ManualImportPipeline {
  constructor(private readonly parser: ManualParser = new DeterministicManualParser()) {}

  async importManual(
    sourceDocument: SourceDocument,
    options: ImportOptions = {},
  ): Promise<ImportResult> {
    const projectRoot = options.projectRoot ?? process.cwd();
    const defaults = defaultImportPaths(projectRoot);
    const draftRoot = options.draftRoot ?? defaults.draftRoot;
    const reportRoot = options.reportRoot ?? defaults.reportRoot;
    const parsed = this.parser.parse(sourceDocument);
    const draft = transformManualToDraft(parsed);
    const validationResult = validateImport(parsed, draft, draftRoot);
    const reviewIssues = [
      ...parsed.reviewIssues,
      ...validationResult.issues,
    ];
    const importId = `${sourceDocument.sourceId}-${sourceDocument.checksum.slice(0, 12)}-${sourceDocument.importedAt.replace(/[^0-9]/g, "").slice(0, 14)}`;
    const generatedFiles: string[] = [];

    if (validationResult.valid && !options.dryRun) {
      generatedFiles.push(await writeDraft(draftRoot, draft));
    }

    const report: ImportReport = {
      importId,
      timestamp: sourceDocument.importedAt,
      sourceDocument: {
        ...sourceDocument,
        rawText: undefined,
      } as Omit<SourceDocument, "rawText">,
      detectedMetadata: {
        title: sourceDocument.title ?? null,
        product: sourceDocument.product ?? null,
        version: sourceDocument.version ?? null,
        publicationDate: sourceDocument.publicationDate ?? null,
        language: sourceDocument.language ?? null,
        pageInformationAvailable: sourceDocument.pageInformationAvailable,
      },
      detectedSections: parsed.sections.map((section) => ({
        sectionId: section.sectionId,
        kind: section.kind,
        heading: section.originalHeading,
        sourceReference: section.sourceReference.referenceId,
      })),
      generatedDraftFiles: generatedFiles,
      warnings: reviewIssues.filter((issue) => issue.severity !== "error"),
      unresolvedIssues: reviewIssues,
      skippedContent: parsed.skippedContent,
      validationResult,
    };
    const reportLocation = options.dryRun
      ? {
          json: path.join(reportRoot, importId, "import-report.json"),
          markdown: path.join(reportRoot, importId, "import-report.md"),
        }
      : await writeImportReport(reportRoot, report);

    return {
      success: validationResult.valid,
      generatedFiles,
      detectedSections: parsed.sections,
      reviewIssues,
      validationResult,
      reportLocation,
    };
  }
}

export async function importManual(
  sourceDocument: SourceDocument,
  options?: ImportOptions,
): Promise<ImportResult> {
  return new ManualImportPipeline().importManual(sourceDocument, options);
}

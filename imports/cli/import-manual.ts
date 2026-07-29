import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  createSourceDocument,
  importManual,
  type SourceDocumentInput,
} from "../index";
import { extractMultiPageImageText } from "../adapters/multi-page-image-adapter";

interface CliOptions {
  inputPaths: string[];
  sourceId?: string;
  title?: string;
  product?: string;
  version?: string;
  publicationDate?: string;
  language?: string;
  documentType: SourceDocumentInput["documentType"];
  draftRoot?: string;
  reportRoot?: string;
}

function usage(): string {
  return [
    "Usage: npm run import:manual -- <input-path> [options]",
    "       npm run import:manual -- <page-1.jpg> <page-2.jpg> --source-type multi-page-image [options]",
    "",
    "Options:",
    "  --source-id <id>",
    "  --title <title>",
    "  --product <product>",
    "  --version <version>",
    "  --publication-date <YYYY-MM-DD>",
    "  --language <language>",
    "  --source-type <plain-text|markdown|extracted-pdf-text|multi-page-image>",
    "  --draft-root <path>",
    "  --report-root <path>",
  ].join("\n");
}

function parseArguments(args: string[]): CliOptions {
  const inputPaths: string[] = [];
  let optionStart = 0;
  while (optionStart < args.length && !args[optionStart].startsWith("--")) {
    inputPaths.push(args[optionStart]);
    optionStart += 1;
  }
  if (inputPaths.length === 0) throw new Error(usage());
  const values = new Map<string, string>();
  for (let index = optionStart; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith("--") || !value) {
      throw new Error(`Invalid option near "${key ?? ""}".\n\n${usage()}`);
    }
    values.set(key, value);
  }
  const sourceType = values.get("--source-type") ?? "markdown";
  if (
    ![
      "plain-text",
      "markdown",
      "extracted-pdf-text",
      "multi-page-image",
    ].includes(sourceType)
  ) {
    throw new Error(`Unsupported source type "${sourceType}".`);
  }
  return {
    inputPaths,
    sourceId: values.get("--source-id"),
    title: values.get("--title"),
    product: values.get("--product"),
    version: values.get("--version"),
    publicationDate: values.get("--publication-date"),
    language: values.get("--language"),
    documentType: sourceType as SourceDocumentInput["documentType"],
    draftRoot: values.get("--draft-root"),
    reportRoot: values.get("--report-root"),
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const absoluteInputs = options.inputPaths.map((item) => path.resolve(item));
  if (
    options.documentType !== "multi-page-image" &&
    absoluteInputs.length !== 1
  ) {
    throw new Error(
      "Text and Markdown imports accept exactly one input file.",
    );
  }
  const extraction =
    options.documentType === "multi-page-image"
      ? await extractMultiPageImageText(absoluteInputs)
      : {
          rawText: await readFile(absoluteInputs[0], "utf8"),
          reviewIssues: [],
          pageCount: 0,
        };
  const sourceChecksum =
    options.documentType === "multi-page-image"
      ? (
          await absoluteInputs.reduce(
            async (hashPromise, imagePath, index) => {
              const hash = await hashPromise;
              hash.update(`PAGE:${index + 1}\n`, "utf8");
              hash.update(await readFile(imagePath));
              return hash;
            },
            Promise.resolve(createHash("sha256")),
          )
        ).digest("hex")
      : undefined;
  const importedAt = process.env.MANUAL_IMPORT_TIMESTAMP;
  const source = createSourceDocument(
    {
      rawText: extraction.rawText,
      originalFilename: absoluteInputs
        .map((item) => path.basename(item))
        .join(", "),
      documentType: options.documentType,
      sourceId: options.sourceId,
      title: options.title,
      product: options.product,
      version: options.version,
      publicationDate: options.publicationDate,
      language: options.language,
      pageInformationAvailable:
        options.documentType === "multi-page-image"
          ? extraction.pageCount > 0
          : undefined,
      extractionReviewIssues: extraction.reviewIssues,
      sourceChecksum,
    },
    importedAt,
  );
  const result = await importManual(source, {
    draftRoot: options.draftRoot
      ? path.resolve(options.draftRoot)
      : undefined,
    reportRoot: options.reportRoot
      ? path.resolve(options.reportRoot)
      : undefined,
  });

  console.log(`Import ${result.success ? "passed" : "failed closed"}.`);
  console.log(`Detected sections: ${result.detectedSections.length}`);
  console.log(`Review issues: ${result.reviewIssues.length}`);
  console.log(`Generated drafts: ${result.generatedFiles.length}`);
  console.log(`JSON report: ${result.reportLocation.json}`);
  console.log(`Markdown report: ${result.reportLocation.markdown}`);
  if (!result.success) process.exitCode = 2;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown import error";
  console.error(`Manual import failed: ${message}`);
  process.exitCode = 1;
});

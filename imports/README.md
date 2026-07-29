# Manual Import Pipeline

This subsystem converts official manual text into traceable Markdown drafts for human review. It is deliberately independent from the UI, AI Orchestrator, OpenAI integration, Session Manager, Experience Engine, Response Engine, and retrieval. Generated drafts are not available to the live assistant.

## Safety boundary

The importer is deterministic. It preserves extracted wording and does not paraphrase, infer missing instructions, reconcile conflicts, expand claims, approve content, or promote documents. Unknown sections are retained. Ambiguous, contradictory, medical, marketing, page-less, and unrecognised-unit content is surfaced through review issues.

Draft output uses `status: draft`. The writer only accepts paths inside the configured `knowledge/drafts` root and uses exclusive file creation, so an existing file is never overwritten. It cannot write into approved knowledge folders.

## Accepted input

- UTF-8 plain text
- UTF-8 Markdown
- UTF-8 text previously extracted from an official PDF
- Consecutive JPG or PNG manual pages on macOS, processed locally with Apple Vision

Binary PDF parsing and OCR are intentionally not included. For a PDF, extract its text with a trusted local tool, preserve page boundaries using lines such as `[[PAGE:12]]`, and import the resulting UTF-8 file with `--source-type extracted-pdf-text`. A page marker applies to the sections following it until the next marker.

For image manuals, pass every page in reading order:

```bash
npm run import:manual -- page-1.jpg page-2.jpg \
  --source-type multi-page-image \
  --source-id MANUAL-IMAGE-001
```

The image adapter uses the local macOS Vision framework through `xcrun swift`. It makes no network request and uses no external OCR service. Pages are processed in the supplied order. Each supplied wide page is divided into four equal reading panels, processed from left to right and then top to bottom. OCR confidence is retained as review issues, and all image-derived drafts require complete human comparison with the source.

Before recognition, the adapter applies embedded image orientation, grayscale conversion, restrained contrast enhancement, denoising, and luminance sharpening. Vision returns its leading and alternate candidates without language correction. Low-confidence text and close competing candidates are reported rather than silently replaced. Spatially overlapping identical fragments are deduplicated, while distinct repeated text is retained.

Do not clean up, paraphrase, translate, convert units, or repair unclear text before import. Any repair must be made during review while comparing against the official source.

## Importing a manual

Run:

```bash
npm run import:manual -- /absolute/path/manual.md \
  --source-id MANUAL-EVERYDAY-001 \
  --title "Official title exactly as printed" \
  --product "Product name exactly as printed" \
  --version "Version exactly as printed" \
  --publication-date 2026-01-31 \
  --language en \
  --source-type markdown
```

Every metadata flag is optional because the importer must not fabricate unavailable information. Missing fields remain `null` and produce visible `MISSING_METADATA` issues. When `--source-id` is omitted, the pipeline creates a stable non-factual identifier from the first 12 characters of the source SHA-256 checksum.

The command writes:

- draft Markdown under `knowledge/drafts/products/`
- JSON and Markdown reports under `imports/reports/<import-id>/`

Use `--draft-root` and `--report-root` to send a test run to isolated directories.

## Source references

References combine the source ID, page marker when available, original heading, and section order. Without page data, they use `NP` and preserve the exact source line range. Example forms:

- `MANUAL-EVERYDAY-001-P12-SAFETY-02`
- `MANUAL-EVERYDAY-001-NP-SETUP-03`

The checksum, original filename, original heading, and stable reference appear in the draft and report. Text imports checksum the exact source text. Multi-page image imports checksum the ordered original image binaries with explicit page separators, so changing a page or reversing the page order produces a different source checksum.

## Review issues

Each issue includes a type, severity, message, source reference where available, and a suggested manual action. Suggested actions never resolve a factual ambiguity automatically. Error-severity issues fail closed: a report is written, but no draft is written.

## Human review workflow

1. Obtain an official manual and preserve the original file.
2. Provide its text to the local import command.
3. Review the generated draft and both import reports.
4. Resolve every flagged issue manually.
5. Compare every extracted statement, warning, unit, and reference against the original source.
6. Record human approval through the project’s future approval process.
7. Manually move approved information into the main knowledge folders without overwriting existing approved content.
8. Only after a separate retrieval integration is reviewed may retrieval use approved documents.

There is no automatic approval or promotion command.

## Public API

```ts
import {
  createSourceDocument,
  importManual,
} from "@/imports";

const source = createSourceDocument({
  rawText,
  originalFilename: "manual.md",
  documentType: "markdown",
  sourceId: "MANUAL-001",
});

const result = await importManual(source, options);
```

`ImportResult` contains `success`, `generatedFiles`, `detectedSections`, `reviewIssues`, `validationResult`, and JSON/Markdown `reportLocation` values. For safety, every configured draft root must end in a directory named `drafts`.

## Fictional verification fixture

`imports/fixtures/fictional-manual.md` is explicitly fictional test content. Tests and validation runs direct its output to temporary directories, never to the real knowledge folders.

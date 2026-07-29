import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { test } from "node:test";
import os from "node:os";
import path from "node:path";
import {
  createSourceDocument,
  importManual,
} from "../pipeline/manual-import-pipeline";

const FIXTURE_PATH = path.join(
  process.cwd(),
  "imports",
  "fixtures",
  "fictional-manual.md",
);
const FIXED_TIME = "2026-01-01T00:00:00.000Z";

test("imports a fictional manual as a traceable draft and report", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "manual-import-"));
  const rawText = await readFile(FIXTURE_PATH, "utf8");
  const source = createSourceDocument(
    {
      rawText,
      originalFilename: "fictional-manual.md",
      documentType: "markdown",
      sourceId: "TEST-MANUAL-001",
      title: "Fictional importer test fixture",
      product: "TEST-UNIT-ALPHA",
      version: "TEST-1",
      language: "en",
    },
    FIXED_TIME,
  );
  const result = await importManual(source, {
    draftRoot: path.join(outputRoot, "knowledge", "drafts"),
    reportRoot: path.join(outputRoot, "reports"),
  });

  assert.equal(result.success, true);
  assert.equal(result.generatedFiles.length, 1);
  assert.equal(result.detectedSections.length, 6);
  assert.ok(
    result.reviewIssues.some(
      (issue) => issue.type === "UNSUPPORTED_SECTION",
    ),
  );
  const draft = await readFile(result.generatedFiles[0], "utf8");
  assert.match(draft, /^status: draft$/m);
  assert.match(draft, /TEST-MANUAL-001-P2-WARNINGS-04/);
  assert.match(draft, /WARNING — TEST CONTENT ONLY/);
  assert.doesNotMatch(draft, /^status: approved$/m);
  const report = JSON.parse(
    await readFile(result.reportLocation.json, "utf8"),
  ) as { validationResult: { valid: boolean } };
  assert.equal(report.validationResult.valid, true);
});

test("fails closed when source text is unreadable", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "manual-import-"));
  const source = createSourceDocument(
    {
      rawText: "# Safety\n[ILLEGIBLE]",
      originalFilename: "unreadable.txt",
      documentType: "plain-text",
      sourceId: "TEST-UNREADABLE-001",
    },
    FIXED_TIME,
  );
  const result = await importManual(source, {
    draftRoot: path.join(outputRoot, "knowledge", "drafts"),
    reportRoot: path.join(outputRoot, "reports"),
  });

  assert.equal(result.success, false);
  assert.deepEqual(result.generatedFiles, []);
  assert.ok(
    result.reviewIssues.some((issue) => issue.type === "AMBIGUOUS_TEXT"),
  );
  assert.ok(await readFile(result.reportLocation.markdown, "utf8"));
});

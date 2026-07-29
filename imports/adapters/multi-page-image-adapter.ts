import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { ReviewIssue } from "../types/review-issue";

const execFileAsync = promisify(execFile);

interface VisionLine {
  text: string;
  confidence: number;
  alternativeText?: string;
  alternativeConfidence?: number;
  panel: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VisionPage {
  page: number;
  filename: string;
  lines: VisionLine[];
}

export interface ImageExtractionResult {
  rawText: string;
  reviewIssues: ReviewIssue[];
  pageCount: number;
}

const LOW_CONFIDENCE = 0.78;
const CLOSE_CANDIDATE_MARGIN = 0.08;

function overlapRatio(left: VisionLine, right: VisionLine): number {
  const intersectionWidth = Math.max(
    0,
    Math.min(left.x + left.width, right.x + right.width) -
      Math.max(left.x, right.x),
  );
  const intersectionHeight = Math.max(
    0,
    Math.min(left.y + left.height, right.y + right.height) -
      Math.max(left.y, right.y),
  );
  const intersection = intersectionWidth * intersectionHeight;
  const smallerArea = Math.min(
    left.width * left.height,
    right.width * right.height,
  );
  return smallerArea > 0 ? intersection / smallerArea : 0;
}

function deduplicateFragments(lines: VisionLine[]): VisionLine[] {
  const retained: VisionLine[] = [];
  for (const line of lines) {
    const duplicateIndex = retained.findIndex(
      (candidate) =>
        candidate.panel === line.panel &&
        candidate.text.trim().toLocaleLowerCase("en") ===
          line.text.trim().toLocaleLowerCase("en") &&
        overlapRatio(candidate, line) >= 0.8,
    );
    if (duplicateIndex === -1) {
      retained.push(line);
    } else if (line.confidence > retained[duplicateIndex].confidence) {
      retained[duplicateIndex] = line;
    }
  }
  return retained;
}

function readingOrder(lines: VisionLine[]): VisionLine[] {
  return [...lines].sort((left, right) => {
    if (left.panel !== right.panel) return left.panel - right.panel;
    if (Math.abs(left.y - right.y) > 0.006) return right.y - left.y;
    return left.x - right.x;
  });
}

function combineHeadingLines(lines: VisionLine[]): VisionLine[] {
  const combined: VisionLine[] = [];
  for (const line of lines) {
    const previous = combined.at(-1);
    const isUppercase =
      line.text.replace(/[^\p{Letter}]/gu, "").length >= 4 &&
      line.text.replace(/[^\p{Letter}]/gu, "") ===
        line.text.replace(/[^\p{Letter}]/gu, "").toLocaleUpperCase("en");
    const previousUppercase =
      previous &&
      previous.text.replace(/[^\p{Letter}]/gu, "").length >= 4 &&
      previous.text.replace(/[^\p{Letter}]/gu, "") ===
        previous.text
          .replace(/[^\p{Letter}]/gu, "")
          .toLocaleUpperCase("en");
    const sameColumn = previous && previous.panel === line.panel;
    const verticallyClose =
      previous && previous.y - (line.y + line.height) < 0.035;
    if (isUppercase && previousUppercase && sameColumn && verticallyClose) {
      combined[combined.length - 1] = {
        ...previous,
        text: `${previous.text} ${line.text}`,
        confidence: Math.min(previous.confidence, line.confidence),
        y: line.y,
        height: previous.y + previous.height - line.y,
        width: Math.max(previous.width, line.width),
      };
    } else {
      combined.push(line);
    }
  }
  return combined;
}

function renderRecognisedLine(line: VisionLine): string {
  const letters = line.text.replace(/[^\p{Letter}]/gu, "");
  const isUppercase =
    letters.length >= 4 &&
    letters === letters.toLocaleUpperCase("en") &&
    line.text.length <= 100;
  return isUppercase && line.height >= 0.018
    ? `# ${line.text}`
    : line.text;
}

export async function extractMultiPageImageText(
  imagePaths: string[],
): Promise<ImageExtractionResult> {
  if (process.platform !== "darwin") {
    throw new Error(
      "The local image adapter currently requires macOS Vision. No external OCR service was used.",
    );
  }
  if (imagePaths.length === 0) {
    throw new Error("At least one manual image is required.");
  }
  const scriptPath = path.join(
    process.cwd(),
    "imports",
    "adapters",
    "macos-vision-ocr.swift",
  );
  const { stdout } = await execFileAsync(
    "xcrun",
    ["swift", scriptPath, ...imagePaths.map((item) => path.resolve(item))],
    { maxBuffer: 20 * 1024 * 1024 },
  );
  const pages = JSON.parse(stdout) as VisionPage[];
  const reviewIssues: ReviewIssue[] = [
    {
      id: "IMAGE-OCR-MANUAL-REVIEW",
      type: "MANUAL_REVIEW_REQUIRED",
      severity: "warning",
      message:
        "This draft was extracted locally from images. Every line must be compared with the original pages before approval.",
      suggestedAction:
        "Review the complete OCR output side by side with every source image.",
    },
  ];
  const pageText = pages.map((page) => {
    const ordered = combineHeadingLines(
      readingOrder(deduplicateFragments(page.lines)),
    );
    for (const [index, line] of ordered.entries()) {
      if (line.confidence < LOW_CONFIDENCE) {
        reviewIssues.push({
          id: `OCR-P${page.page}-L${String(index + 1).padStart(3, "0")}`,
          type: "AMBIGUOUS_TEXT",
          severity: "warning",
          message: `Low-confidence OCR text on page ${page.page}: "${line.text}" (confidence ${line.confidence.toFixed(3)}).`,
          suggestedAction:
            "Compare this line with the source image and correct it manually without inferring missing text.",
        });
      }
      const alternativeIsClose =
        line.alternativeText &&
        line.alternativeText !== line.text &&
        line.alternativeConfidence !== undefined &&
        line.confidence - line.alternativeConfidence <=
          CLOSE_CANDIDATE_MARGIN;
      if (alternativeIsClose) {
        reviewIssues.push({
          id: `OCR-P${page.page}-L${String(index + 1).padStart(3, "0")}-ALTERNATIVE`,
          type: "AMBIGUOUS_TEXT",
          severity: "warning",
          message: `OCR produced close alternatives on page ${page.page}: "${line.text}" or "${line.alternativeText}".`,
          suggestedAction:
            "Choose the exact text only after comparing both alternatives with the source image.",
        });
      }
    }
    return [
      `[[PAGE:${page.page}]]`,
      ...ordered.map(renderRecognisedLine),
    ].join("\n");
  });
  return {
    rawText: pageText.join("\n\n"),
    reviewIssues,
    pageCount: pages.length,
  };
}

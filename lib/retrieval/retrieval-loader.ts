import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { KnowledgeLoadError } from "@/lib/retrieval/retrieval-errors";
import {
  normalizeDocumentType,
  resolveSourcePriority,
} from "@/lib/retrieval/knowledge-metadata";
import type {
  ApprovedKnowledgeDocument,
  RetrievalProduct,
} from "@/lib/retrieval/retrieval-types";

type Frontmatter = Record<string, string | string[] | null>;

function parseScalar(value: string): string | string[] | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null") return null;
  if (trimmed === "[]") return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return trimmed.replace(/^["']|["']$/g, "");
}

function parseMarkdown(content: string): {
  frontmatter: Frontmatter;
  body: string;
} {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/m.exec(
    content.replace(/\r\n?/g, "\n"),
  );
  if (!match) return { frontmatter: {}, body: content };
  const frontmatter: Frontmatter = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    frontmatter[line.slice(0, separator).trim()] = parseScalar(
      line.slice(separator + 1),
    );
  }
  return { frontmatter, body: match[2].trim() };
}

function normalizeProduct(value: unknown): RetrievalProduct | null {
  if (typeof value !== "string") return null;
  const normalized = value.toLocaleLowerCase("en");
  if (normalized.includes("advanced")) return "advanced";
  if (normalized.includes("everyday")) return "everyday";
  return null;
}

function normalizeValues(...values: unknown[]) {
  return [
    ...new Set(
      values.flatMap((value) => {
        if (Array.isArray(value)) {
          return value.filter(
            (item): item is string => typeof item === "string",
          );
        }
        return typeof value === "string" ? [value] : [];
      }),
    ),
  ]
    .map((value) => value.trim().toLocaleLowerCase("en"))
    .filter(Boolean);
}

function isExcludedPath(filePath: string, knowledgeRoot: string): boolean {
  const relative = path.relative(knowledgeRoot, filePath);
  const segments = relative.split(path.sep).map((item) => item.toLowerCase());
  return (
    relative.startsWith("..") ||
    segments.includes("drafts") ||
    segments.includes("fixtures") ||
    segments.includes("reports") ||
    filePath.includes(".test.") ||
    filePath.includes(".fixture.")
  );
}

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const location = path.join(directory, entry.name);
      if (entry.isDirectory()) return markdownFiles(location);
      return entry.isFile() && entry.name.endsWith(".md") ? [location] : [];
    }),
  );
  return files.flat();
}

export class ApprovedKnowledgeLoader {
  constructor(private readonly knowledgeRoot: string) {}

  async load(): Promise<ApprovedKnowledgeDocument[]> {
    try {
      const files = await markdownFiles(this.knowledgeRoot);
      const documents: ApprovedKnowledgeDocument[] = [];
      for (const filePath of files) {
        if (isExcludedPath(filePath, this.knowledgeRoot)) continue;
        const parsed = parseMarkdown(await readFile(filePath, "utf8"));
        const status = parsed.frontmatter.status;
        const sourceId = parsed.frontmatter.sourceId;
        if (
          status !== "approved" ||
          typeof sourceId !== "string" ||
          !/^[A-Z0-9][A-Z0-9-]{2,}$/i.test(sourceId) ||
          !parsed.body.trim() ||
          /\bTODO:/i.test(parsed.body)
        ) {
          continue;
        }
        const title = parsed.frontmatter.title;
        const tags = parsed.frontmatter.tags;
        const sourceType =
          typeof parsed.frontmatter.sourceType === "string"
            ? parsed.frontmatter.sourceType
            : "approved-markdown";
        const documentType = normalizeDocumentType(
          parsed.frontmatter.documentType ?? sourceType,
        );
        documents.push({
          documentId: path
            .relative(this.knowledgeRoot, filePath)
            .split(path.sep)
            .join("/"),
          title: typeof title === "string" ? title : path.basename(filePath, ".md"),
          sourceId,
          sourceType,
          documentType,
          sourcePriority: resolveSourcePriority(
            documentType,
            parsed.frontmatter.sourcePriority,
          ),
          sourceVersion:
            typeof parsed.frontmatter.sourceVersion === "string"
              ? parsed.frontmatter.sourceVersion
              : null,
          language:
            typeof parsed.frontmatter.sourceLanguage === "string"
              ? parsed.frontmatter.sourceLanguage
              : "en",
          product: normalizeProduct(parsed.frontmatter.product),
          approvalStatus: "approved",
          topics: normalizeValues(
            parsed.frontmatter.topic,
            parsed.frontmatter.topics,
            tags,
          ),
          tags: normalizeValues(tags),
          content: parsed.body,
        });
      }
      return documents;
    } catch (error) {
      throw new KnowledgeLoadError({ cause: error });
    }
  }
}

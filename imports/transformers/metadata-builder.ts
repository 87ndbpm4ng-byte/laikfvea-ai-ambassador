import type { SourceDocument } from "../types/source-document";

function yamlValue(value: string | undefined): string {
  return value === undefined ? "null" : JSON.stringify(value);
}

export function buildDraftFrontmatter(source: SourceDocument): string {
  return [
    "---",
    `title: ${yamlValue(source.title)}`,
    `sourceId: ${JSON.stringify(source.sourceId)}`,
    "sourceType: official-user-manual",
    `sourceVersion: ${yamlValue(source.version)}`,
    `sourceLanguage: ${yamlValue(source.language)}`,
    `product: ${yamlValue(source.product)}`,
    "status: draft",
    `importedAt: ${JSON.stringify(source.importedAt)}`,
    "lastReviewed: null",
    "reviewOwner: null",
    "tags: []",
    "---",
  ].join("\n");
}

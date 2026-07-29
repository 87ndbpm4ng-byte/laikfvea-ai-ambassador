import { RETRIEVAL_CONFIG } from "@/lib/retrieval/retrieval-config";
import { tokenizeRetrievalText } from "@/lib/retrieval/retrieval-query";
import type {
  ApprovedKnowledgeDocument,
  RetrievalChunk,
} from "@/lib/retrieval/retrieval-types";

function slug(value: string): string {
  return (
    value
      .toLocaleLowerCase("en")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

function sectionType(heading: string): string {
  const normalized = heading.toLocaleLowerCase("en");
  const types = [
    "cleaning",
    "charging",
    "troubleshooting",
    "maintenance",
    "safety",
    "warnings",
    "inhalation",
    "comparison",
    "technical specifications",
    "operation",
    "setup",
  ];
  return (
    types.find((type) => normalized.includes(type))?.replace(" ", "-") ??
    "general"
  );
}

function splitOversizedSection(text: string): string[] {
  if (text.length <= RETRIEVAL_CONFIG.maximumChunkCharacters) return [text];
  const blocks = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";
  for (const block of blocks) {
    const candidate = current ? `${current}\n\n${block}` : block;
    if (
      candidate.length > RETRIEVAL_CONFIG.maximumChunkCharacters &&
      current
    ) {
      chunks.push(current);
      current = block;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function chunkDocument(document: ApprovedKnowledgeDocument): RetrievalChunk[] {
  const headingPattern = /^(#{1,4})\s+(.+)$/gm;
  const headings = [...document.content.matchAll(headingPattern)];
  const chunks: RetrievalChunk[] = [];
  const sections =
    headings.length > 0
      ? headings.map((match, index) => ({
          heading: match[2].trim(),
          text: document.content
            .slice(match.index! + match[0].length, headings[index + 1]?.index)
            .trim(),
        }))
      : [{ heading: document.title, text: document.content.trim() }];

  for (const section of sections) {
    if (section.text.length < RETRIEVAL_CONFIG.minimumChunkCharacters) continue;
    for (const [partIndex, text] of splitOversizedSection(section.text).entries()) {
      const order = chunks.length + 1;
      const explicitReference =
        /(?:^|\n)Source:\s*\[([^\]]+)]/im.exec(text)?.[1];
      const reference =
        explicitReference ??
        `${document.sourceId}#${slug(section.heading)}${
          partIndex ? `-${partIndex + 1}` : ""
        }`;
      const retrievalText = text
        .replace(/(?:^|\n)Source:\s*\[[^\]]+][^\n]*/gim, "")
        .trim();
      if (retrievalText.length < RETRIEVAL_CONFIG.minimumChunkCharacters) {
        continue;
      }
      chunks.push({
        chunkId: `${document.documentId}:${reference}`,
        sourceId: document.sourceId,
        sourceType: document.sourceType,
        documentTitle: document.title,
        documentType: document.documentType,
        sourcePriority: document.sourcePriority,
        sourceVersion: document.sourceVersion,
        language: document.language,
        product: document.product,
        heading: section.heading,
        sectionType: sectionType(section.heading),
        text: retrievalText,
        sourceReference: reference,
        tags: document.tags,
        topics: document.topics,
        approvalStatus: "approved",
        retrievalMetadata: {
          documentId: document.documentId,
          tokenCount: tokenizeRetrievalText(retrievalText).length,
          order,
        },
      });
    }
  }
  return chunks;
}

export class RetrievalIndex {
  readonly chunks: readonly RetrievalChunk[];

  constructor(documents: readonly ApprovedKnowledgeDocument[]) {
    this.chunks = documents.flatMap(chunkDocument);
  }
}

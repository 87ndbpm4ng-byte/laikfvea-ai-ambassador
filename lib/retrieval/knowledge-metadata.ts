import type { KnowledgeDocumentType } from "@/lib/retrieval/retrieval-types";

export const KNOWLEDGE_SOURCE_PRIORITY: Record<
  KnowledgeDocumentType,
  number
> = {
  manual: 500,
  "technical-specifications": 400,
  "maintenance-guide": 300,
  "troubleshooting-guide": 280,
  "product-faq": 220,
  "exhibition-faq": 200,
  "company-information": 100,
  other: 50,
};

export function normalizeDocumentType(
  value: unknown,
): KnowledgeDocumentType {
  if (typeof value !== "string") return "other";

  const normalized = value
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[\s_]+/g, "-");

  if (
    normalized === "manual" ||
    normalized === "official-user-manual" ||
    normalized === "user-manual"
  ) {
    return "manual";
  }
  if (
    normalized === "technical-specification" ||
    normalized === "technical-specifications"
  ) {
    return "technical-specifications";
  }
  if (normalized === "maintenance" || normalized === "maintenance-guide") {
    return "maintenance-guide";
  }
  if (
    normalized === "troubleshooting" ||
    normalized === "troubleshooting-guide"
  ) {
    return "troubleshooting-guide";
  }
  if (normalized === "faq" || normalized === "product-faq") {
    return "product-faq";
  }
  if (normalized === "exhibition-faq") return "exhibition-faq";
  if (
    normalized === "company" ||
    normalized === "company-information"
  ) {
    return "company-information";
  }

  return "other";
}

export function resolveSourcePriority(
  documentType: KnowledgeDocumentType,
  configuredPriority: unknown,
) {
  if (typeof configuredPriority === "string") {
    const parsed = Number(configuredPriority);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 1_000) {
      return parsed;
    }
  }

  return KNOWLEDGE_SOURCE_PRIORITY[documentType];
}

import path from "node:path";
import type { SectionKind } from "../types/extracted-section";

export const PAGE_MARKER = /^\[\[PAGE:(\d+)]]$/i;

export const SECTION_HEADINGS: Readonly<Record<string, SectionKind>> = {
  "product overview": "product-overview",
  components: "components",
  setup: "setup",
  charging: "charging",
  "charging the device": "charging",
  operation: "operation",
  cleaning: "cleaning",
  maintenance: "maintenance",
  safety: "safety",
  warning: "warnings",
  warnings: "warnings",
  troubleshooting: "troubleshooting",
  "error codes": "error-codes",
  "technical specifications": "technical-specifications",
  storage: "storage",
  warranty: "warranty",
  "contact information": "contact-information",
  "description of the hydrogen water generator": "product-overview",
  "package contents": "components",
  "how to use": "operation",
  "hydrogen water preparation process": "operation",
  "operating recommendations": "operation",
  "how to open and close the lid": "operation",
  "preparing the generator for hydrogen inhalation": "setup",
  "safety instructions": "safety",
  "app control": "operation",
  "uv sterilization and schumann resonance": "operation",
  "uv sterilization and": "operation",
  "schumann resonance": "operation",
  "hydrogen water preparation process:": "operation",
  "benefits of hydrogen water:": "product-overview",
  "alkaline ionized water preparation (with mineralization balls)": "setup",
};

export const MEDICAL_TERMS =
  /\b(cure|cures|cured|treat|treats|treatment|prevent|prevents|diagnose|diagnosis|therapeutic|heal|heals|disease|symptom)\b/i;

export const MARKETING_TERMS =
  /\b(best|revolutionary|breakthrough|guaranteed|world[- ]class|market[- ]leading|miracle|unmatched)\b/i;

export const KNOWN_UNITS = new Set([
  "a",
  "ah",
  "bar",
  "cm",
  "fl",
  "g",
  "hz",
  "in",
  "kg",
  "l",
  "lb",
  "ma",
  "mah",
  "mg",
  "min",
  "minutes",
  "ml",
  "mm",
  "months",
  "mv",
  "nm",
  "pa",
  "pcs",
  "ppb",
  "ppm",
  "s",
  "times",
  "v",
  "w",
  "wh",
  "hours",
  "x",
  "°c",
  "°f",
  "%",
]);

export const NON_UNIT_NUMERIC_FOLLOWERS = new Set([
  "and",
  "of",
  "or",
  "the",
  "to",
]);

export const defaultImportPaths = (projectRoot: string) => ({
  draftRoot: path.join(projectRoot, "knowledge", "drafts"),
  reportRoot: path.join(projectRoot, "imports", "reports"),
});

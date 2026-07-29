export function normaliseManualText(rawText: string): string {
  return rawText
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normaliseHeading(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\d+(?:\.\d+)*[.)]?\s+/, "")
    .trim()
    .toLocaleLowerCase("en");
}

export function slugifyReference(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  return slug || "SECTION";
}

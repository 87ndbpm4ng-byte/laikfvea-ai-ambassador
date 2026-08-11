/**
 * Removes visual-only formatting before TTS without rewriting factual content.
 * The displayed conversation message remains unchanged.
 */
export function normalizeSpeechText(text: string) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const normalizedLines = lines.map((line) => {
    const withoutHeading = line.replace(/^\s{0,3}#{1,6}\s+/, "");
    const bullet = withoutHeading.match(/^\s*[-*•]\s+(.*)$/);
    if (!bullet) return withoutHeading;

    const content = bullet[1].trim();
    return content && !/[.!?:;]$/.test(content) ? `${content}.` : content;
  });

  return normalizedLines
    .join(" ")
    .replace(/\[([^\]]+)]\([^\s)]+\)/g, "$1")
    .replace(/(\*\*|__|`)(.*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

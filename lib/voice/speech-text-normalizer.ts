import type { SupportedLanguage } from "@/types/language";

function russianTechnicalPronunciation(text: string) {
  const withUnits = text
    .replace(/\b(\d+(?:[.,]\d+)?)\s*m[lL]\b/g, (_match, value: string) => {
      const number = Number(value.replace(",", "."));
      const noun = number === 1
        ? "миллилитр"
        : number >= 2 && number <= 4
          ? "миллилитра"
          : "миллилитров";
      return `${value} ${noun}`;
    })
    .replace(/\b(\d+(?:[.,]\d+)?)\s*[lL]\b/g, (_match, value: string) => {
      const number = Number(value.replace(",", "."));
      if (number === 1) return `${value} литр`;
      if (number >= 2 && number <= 4) return `${value} литра`;
      return `${value} литров`;
    })
    .replace(/\bpH\b/gi, "пэ-аш")
    .replace(/\bUV(?:-C)?\b/gi, "ультрафиолет")
    .replace(/H₂|\bH2\b/gi, "водород")
    .replace(/\bppb\b/gi, "частей на миллиард")
    .replace(/\bnm\b/gi, "нанометров")
    .replace(/\bW\b/gi, "ватт")
    .replace(/\bV\b/gi, "вольт")
    .replace(/\bHz\b/gi, "герц")
    .replace(/m²/gi, "квадратных метров")
    .replace(/°C/gi, "градусов Цельсия");

  return withUnits;
}

/**
 * Removes visual-only formatting before TTS without rewriting factual content.
 * The displayed conversation message remains unchanged.
 */
export function normalizeSpeechText(text: string, language?: SupportedLanguage) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const normalizedLines = lines.map((line) => {
    const withoutHeading = line.replace(/^\s{0,3}#{1,6}\s+/, "");
    const bullet = withoutHeading.match(/^\s*[-*•]\s+(.*)$/);
    if (!bullet) return withoutHeading;

    const content = bullet[1].trim();
    return content && !/[.!?:;]$/.test(content) ? `${content}.` : content;
  });

  const normalized = normalizedLines
    .join(" ")
    .replace(/\[([^\]]+)]\([^\s)]+\)/g, "$1")
    .replace(/(\*\*|__|`)(.*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();

  return language === "ru" ? russianTechnicalPronunciation(normalized) : normalized;
}

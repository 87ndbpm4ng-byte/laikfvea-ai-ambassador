import type { RetrievalContext } from "@/lib/retrieval/retrieval-types";

const MEDICAL_CLAIM =
  /\b(cure|cures|cured|treat|treats|treatment|prevent|prevents|diagnose|therapeutic|heal|heals)\b/i;
const NUMBER_TOKEN = /-?\d+(?:[.,]\d+)?(?:\s?(?:%|[a-zA-Z°]+))?/g;
const NUMBER_WITH_UNIT =
  /^(-?\d+(?:[.,]\d+)?)(?:\s?)(%|ml|mv|ppb|ppm|w|v|°c|°f|fl\s?oz)$/i;

function approvedNumberVariants(token: string) {
  const normalized = token.toLocaleLowerCase("en");
  const match = normalized.match(NUMBER_WITH_UNIT);
  if (match) return [normalized, match[1]];

  const numericValue = normalized.match(/^-?\d+(?:[.,]\d+)?/)?.[0];
  return numericValue ? [numericValue] : [normalized];
}

export type GroundedResponseValidation = {
  valid: boolean;
  reasons: readonly string[];
};

export function validateGroundedResponse(
  response: string,
  context: RetrievalContext | null,
): GroundedResponseValidation {
  const reasons: string[] = [];
  if (MEDICAL_CLAIM.test(response)) {
    reasons.push("The response contains prohibited medical-claim wording.");
  }
  if (context && !context.insufficientKnowledge) {
    const approvedText = context.passages
      .map((passage) => passage.text)
      .join(" ")
      .toLocaleLowerCase("en");
    const responseNumbers = response.match(NUMBER_TOKEN) ?? [];
    for (const number of responseNumbers) {
      if (
        !approvedNumberVariants(number).some((candidate) =>
          approvedText.includes(candidate)
        )
      ) {
        reasons.push(
          `The response contains an unsupported numeric value: ${number}.`,
        );
      }
    }
  }
  return { valid: reasons.length === 0, reasons };
}

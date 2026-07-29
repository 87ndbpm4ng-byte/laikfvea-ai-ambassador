import type { RetrievalContext } from "@/lib/retrieval/retrieval-types";

const MEDICAL_CLAIM =
  /\b(cure|cures|cured|treat|treats|treatment|prevent|prevents|diagnose|therapeutic|heal|heals)\b/i;
const NUMBER_TOKEN = /-?\d+(?:[.,]\d+)?(?:\s?(?:%|[a-zA-Z°]+))?/g;

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
      if (!approvedText.includes(number.toLocaleLowerCase("en"))) {
        reasons.push(
          `The response contains an unsupported numeric value: ${number}.`,
        );
      }
    }
  }
  return { valid: reasons.length === 0, reasons };
}

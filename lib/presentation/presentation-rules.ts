import type {
  Presentation,
  PresentationAssetId,
} from "@/lib/presentation/presentation-types";

export type PresentationRule = Presentation & {
  matches: readonly RegExp[];
};

function rule(
  asset: PresentationAssetId,
  type: Presentation["type"],
  matches: readonly RegExp[],
): PresentationRule {
  return { asset, type, matches };
}

/** Ordered from the most specific subject to the broadest product match. */
export const presentationRules: readonly PresentationRule[] = [
  rule("go-vs-pro", "comparison", [
    /\bcompar(?:e|ed|ing|ison)\b/i,
    /\bboth (?:bottles|products)\b/i,
    /\bdifference(?:s)? between\b/i,
  ]),
  rule("charging", "feature", [
    /\bcharg(?:e|ed|er|ing)\b/i,
    /\bbattery\b/i,
    /\bUSB[- ]?C\b/i,
    /\bwireless charging\b/i,
    /\blow power\b/i,
  ]),
  rule("maintenance", "feature", [
    /\bclean(?:ing|ed)?\b/i,
    /\bmaintenance\b/i,
    /\bcare (?:for|instructions?)\b/i,
    /\bstor(?:e|age|ing)\b/i,
    /\btroubleshoot(?:ing)?\b/i,
  ]),
  rule("mineralisation", "feature", [
    /\bmineralisation\b/i,
    /\bmineralization\b/i,
    /\bmineral cartridge\b/i,
  ]),
  rule("hydrogen-inhalation", "feature", [
    /\binhal(?:e|ation|ing)\b/i,
    /\bnasal cannula\b/i,
    /\bbreath(?:e|ing) hydrogen\b/i,
  ]),
  rule("premium-materials", "feature", [
    /\bmaterial(?:s)?\b/i,
    /\bpremium glass\b/i,
    /\bglass bottle\b/i,
    /\btritan\b/i,
    /\btitanium\b/i,
    /\bplatinum\b/i,
    /\baluminium alloy\b/i,
  ]),
  rule("oxidative-stress", "infographic", [/\boxidative stress\b/i]),
  rule("hydrogen-process", "infographic", [
    /\belectrolysis\b/i,
    /\bhydrogen process\b/i,
    /\bproton[- ]?exchange membrane\b/i,
    /\bPEM\b/,
    /\belectrode(?:s)?\b/i,
    /\bmembrane module\b/i,
  ]),
  rule("hydrogen-water", "infographic", [
    /\bhydrogen water\b/i,
    /\bdissolved hydrogen\b/i,
    /\bmolecular hydrogen\b/i,
    /\bhow (?:does|is) hydrogen\b/i,
  ]),
  rule("go-bottle", "product", [
    /\beveryday bottle\b/i,
    /\bGO bottle\b/i,
    /\bGO\b/,
  ]),
  rule("pro-bottle", "product", [
    /\badvanced bottle\b/i,
    /\bPRO bottle\b/i,
    /\bPRO\b/,
  ]),
];

import type { PlaceholderResponseKey } from "@/types/conversation";

export const placeholderResponses: Record<PlaceholderResponseKey, string> = {
  "hydrogen-water-overview":
    "This prototype does not yet include approved technical explanations. Verified information about hydrogen water can be added when the product content is supplied.",
  "product-comparison":
    "The Everyday Bottle is compact and designed for portable use. The Advanced Bottle is intended for advanced use and also includes inhalation capability and mineralisation support.",
  "product-guidance":
    "The Everyday Bottle is presented for everyday and portable use. The Advanced Bottle is presented for advanced use and for visitors interested in its additional capabilities.",
  "hydrogen-inhalation":
    "The Advanced Bottle includes an inhalation capability. This prototype does not provide operating details or health claims; approved guidance can be added later.",
};

export const placeholderFallbackResponse =
  "This is currently a prototype with prepared local responses. Please choose one of the suggested topics so I can share the approved information available in this demonstration.";

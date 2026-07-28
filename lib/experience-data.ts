export type GuideId = "emily" | "daniel";
export type ProductId = "everyday" | "advanced";

export type JourneyScreen =
  | "idle"
  | "language"
  | "guide"
  | "introduction"
  | "conversation"
  | "products"
  | "product-detail"
  | "comparison"
  | "end";

export type ConversationEntry = {
  id: number;
  question: string;
  response: string;
};

export const guides = {
  emily: {
    id: "emily",
    initial: "E",
    name: "Emily",
    role: "Wellness Specialist",
    focusAreas: ["Daily use", "Recovery", "Lifestyle"],
    introduction:
      "I’ll help you explore hydrogen technology, everyday use and recovery.",
  },
  daniel: {
    id: "daniel",
    initial: "D",
    name: "Daniel",
    role: "Technology Specialist",
    focusAreas: [
      "Hydrogen technology",
      "Engineering",
      "Product comparisons",
    ],
    introduction:
      "I’ll help you understand the technology, product differences and engineering behind hydrogen water.",
  },
} as const;

export const products = {
  everyday: {
    id: "everyday",
    shortName: "Everyday",
    name: "Everyday Bottle",
    overview:
      "A compact everyday bottle designed for portable hydrogen water generation.",
    features: [
      "Compact everyday bottle",
      "Hydrogen water generation",
      "Portable design",
    ],
    useCases: ["Everyday use", "Portable use"],
  },
  advanced: {
    id: "advanced",
    shortName: "Advanced",
    name: "Advanced Bottle",
    overview:
      "An advanced hydrogen bottle with hydrogen water generation and additional capabilities.",
    features: [
      "Advanced hydrogen bottle",
      "Hydrogen water generation",
      "Inhalation capability",
      "Mineralisation support",
    ],
    useCases: ["Advanced use", "Hydrogen inhalation"],
  },
} as const;

export const suggestedQuestions = [
  "How does hydrogen water work?",
  "Compare the two bottles",
  "Who is each bottle designed for?",
  "Explain hydrogen inhalation",
] as const;

const preparedResponses: Record<string, string> = {
  "How does hydrogen water work?":
    "This MVP does not yet include approved technical explanations. Verified information about hydrogen water can be added when the product content is supplied.",
  "Compare the two bottles":
    "The Everyday Bottle is compact and designed for portable use. The Advanced Bottle is intended for advanced use and also includes inhalation capability and mineralisation support.",
  "Who is each bottle designed for?":
    "The Everyday Bottle is presented for everyday and portable use. The Advanced Bottle is presented for advanced use and for visitors interested in its additional capabilities.",
  "Explain hydrogen inhalation":
    "The Advanced Bottle includes an inhalation capability. This MVP does not provide operating details or health claims; approved guidance can be added later.",
};

export function getPreparedResponse(question: string) {
  return (
    preparedResponses[question] ??
    "Thank you for your question. This MVP uses prepared local responses only. A verified answer can be added when approved product information is available."
  );
}

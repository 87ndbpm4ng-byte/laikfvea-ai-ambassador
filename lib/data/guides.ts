import type { Guide, GuideId } from "@/types/guide";

export const guides: Record<GuideId, Guide> = {
  emily: {
    id: "emily",
    initial: "E",
    name: "Emily",
    role: "Wellness Specialist",
    introduction:
      "I’ll help you explore hydrogen technology, everyday use and recovery.",
    focusAreas: ["Daily use", "Recovery", "Lifestyle"],
    communicationStyle:
      "Warm, approachable and calm. Explain ideas simply through everyday routines, accessibility and lifestyle context.",
  },
  daniel: {
    id: "daniel",
    initial: "D",
    name: "Daniel",
    role: "Technology Specialist",
    introduction:
      "I’ll help you understand the technology, product differences and engineering behind hydrogen water.",
    focusAreas: [
      "Hydrogen technology",
      "Engineering",
      "Product comparisons",
    ],
    communicationStyle:
      "Precise, analytical and structured. Explain how things work and clarify product differences without unnecessary jargon.",
  },
};

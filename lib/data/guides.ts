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
    communicationStyle: "Warm, practical and focused on everyday context.",
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
    communicationStyle: "Clear, precise and focused on technical context.",
  },
};

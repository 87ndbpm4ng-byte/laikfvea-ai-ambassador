import type {
  ResponseProfile,
  ResponseProfileId,
} from "@/lib/response/response-types";

export const responseProfiles: Record<ResponseProfileId, ResponseProfile> = {
  educational: {
    id: "educational",
    description:
      "Clear, approachable guidance for visitors learning a topic.",
    defaults: {
      responseLength: "concise",
      tone: "educational",
      educationalLevel: "accessible",
      commercialLevel: "none",
      questionStrategy: "none",
      recommendedSections: [
        "direct-answer",
        "brief-explanation",
        "approved-information",
        "limitations",
        "next-step",
      ],
    },
  },
  technical: {
    id: "technical",
    description:
      "Structured technical explanation without unnecessary jargon.",
    defaults: {
      responseLength: "standard",
      tone: "precise",
      educationalLevel: "detailed",
      commercialLevel: "none",
      questionStrategy: "none",
      recommendedSections: [
        "direct-answer",
        "brief-explanation",
        "approved-information",
        "limitations",
        "next-step",
      ],
    },
  },
  lifestyle: {
    id: "lifestyle",
    description:
      "Accessible guidance framed around the visitor's stated routine or goals.",
    defaults: {
      responseLength: "concise",
      tone: "supportive",
      educationalLevel: "introductory",
      commercialLevel: "contextual",
      questionStrategy: "discovery",
      recommendedSections: [
        "direct-answer",
        "brief-explanation",
        "limitations",
        "next-step",
        "follow-up-question",
      ],
    },
  },
  comparison: {
    id: "comparison",
    description:
      "Balanced comparison using equivalent, approved categories.",
    defaults: {
      responseLength: "standard",
      tone: "neutral",
      educationalLevel: "accessible",
      commercialLevel: "contextual",
      questionStrategy: "comparison",
      recommendedSections: [
        "direct-answer",
        "comparison",
        "limitations",
        "next-step",
        "follow-up-question",
      ],
    },
  },
  support: {
    id: "support",
    description:
      "Calm guidance that clarifies available support information and limits.",
    defaults: {
      responseLength: "concise",
      tone: "reassuring",
      educationalLevel: "accessible",
      commercialLevel: "none",
      questionStrategy: "clarifying",
      recommendedSections: [
        "direct-answer",
        "approved-information",
        "limitations",
        "next-step",
        "follow-up-question",
      ],
    },
  },
  closing: {
    id: "closing",
    description:
      "Brief session closure with one clear, non-pressuring next action.",
    defaults: {
      responseLength: "brief",
      tone: "welcoming",
      educationalLevel: "introductory",
      commercialLevel: "none",
      questionStrategy: "closing",
      recommendedSections: ["summary", "next-step", "follow-up-question"],
    },
  },
};

export function getResponseProfile(id: ResponseProfileId) {
  return responseProfiles[id];
}

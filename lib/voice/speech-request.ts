import { guides } from "@/lib/data/guides";
import { MAX_SPEECH_TEXT_LENGTH } from "@/lib/voice/openai-voice-config";
import type { GuideId } from "@/types/guide";
import { isLatencyTurnId } from "@/lib/observability/turn-latency";

export type SpeechApiRequest = {
  text: string;
  guideId: GuideId;
  language?: string;
  latencyTurnId?: string;
};

const LANGUAGE_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;

export function validateSpeechRequest(value: unknown): SpeechApiRequest | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const request = value as Record<string, unknown>;
  const text = typeof request.text === "string" ? request.text.trim() : "";

  if (
    !text ||
    text.length > MAX_SPEECH_TEXT_LENGTH ||
    typeof request.guideId !== "string" ||
    !(request.guideId in guides) ||
    (request.language !== undefined &&
      (typeof request.language !== "string" ||
        !LANGUAGE_PATTERN.test(request.language))) ||
    (request.latencyTurnId !== undefined &&
      !isLatencyTurnId(request.latencyTurnId))
  ) {
    return null;
  }

  return {
    text,
    guideId: request.guideId as GuideId,
    language:
      typeof request.language === "string" ? request.language : undefined,
    latencyTurnId:
      typeof request.latencyTurnId === "string"
        ? request.latencyTurnId
        : undefined,
  };
}

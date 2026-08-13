import { resolveSupportedLanguage } from "@/lib/i18n/languages";
import type { SpeechApiRequest } from "@/lib/voice/speech-request";

export type SpeechProviderName = "openai" | "elevenlabs";

export function isDanielCantoneseSpeechEnabled(
  environment: Record<string, string | undefined> = process.env,
) {
  return environment.DANIEL_CANTONESE_SPEECH?.trim() === "true";
}

export function selectSpeechProvider(
  request: SpeechApiRequest,
  environment: Record<string, string | undefined> = process.env,
): SpeechProviderName {
  if (
    request.guideId === "daniel" &&
    (resolveSupportedLanguage(request.language) !== "yue" ||
      !isDanielCantoneseSpeechEnabled(environment))
  ) {
    return "elevenlabs";
  }

  return "openai";
}

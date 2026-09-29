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
  const language = resolveSupportedLanguage(request.language);

  // ElevenLabs does not have a safe Cantonese language-code mapping in this
  // project; keep the established OpenAI route rather than risk Mandarin.
  if (request.guideId === "emily") {
    return language === "yue" ? "openai" : "elevenlabs";
  }

  if (
    request.guideId === "daniel" &&
    (language !== "yue" ||
      !isDanielCantoneseSpeechEnabled(environment))
  ) {
    return "elevenlabs";
  }

  return "openai";
}

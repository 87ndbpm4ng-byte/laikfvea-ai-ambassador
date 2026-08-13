import OpenAI from "openai";
import {
  OPENAI_TTS_MODEL,
  OPENAI_TTS_RESPONSE_FORMAT,
  OPENAI_VOICE_PROFILES,
  SPEECH_REQUEST_TIMEOUT_MS,
} from "@/lib/voice/openai-voice-config";
import type { SpeechApiRequest } from "@/lib/voice/speech-request";
import { resolveSupportedLanguage } from "@/lib/i18n/languages";

export class MissingSpeechApiKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured.");
    this.name = "MissingSpeechApiKeyError";
  }
}

export type SpeechClient = {
  audio: {
    speech: {
      create(options: {
        model: string;
        voice: string;
        input: string;
        instructions: string;
        response_format: "mp3" | "pcm";
        speed: number;
      }): Promise<{ arrayBuffer(): Promise<ArrayBuffer> }>;
    };
  };
};

type SpeechServiceOptions = {
  apiKey?: string;
  client?: SpeechClient;
  output?: "browser" | "liveavatar";
};

export async function generateOpenAISpeech(
  request: SpeechApiRequest,
  options: SpeechServiceOptions = {},
) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;

  if (!apiKey && !options.client) {
    throw new MissingSpeechApiKeyError();
  }

  const client =
    options.client ??
    (new OpenAI({
      apiKey,
      timeout: SPEECH_REQUEST_TIMEOUT_MS,
      maxRetries: 1,
    }) as SpeechClient);
  const profile = OPENAI_VOICE_PROFILES[request.guideId];
  const isDanielCantonese =
    request.guideId === "daniel" &&
    resolveSupportedLanguage(request.language) === "yue";
  const response = await client.audio.speech.create({
    model: OPENAI_TTS_MODEL,
    voice: profile.voice,
    input: request.text,
    instructions: isDanielCantonese
      ? `${profile.instructions} Speak in natural Hong Kong Cantonese, not Mandarin. Preserve the Cantonese wording in Traditional Chinese exactly; do not translate or transliterate it.`
      : profile.instructions,
    response_format:
      options.output === "liveavatar" ? "pcm" : OPENAI_TTS_RESPONSE_FORMAT,
    speed: profile.speed,
  });

  return response.arrayBuffer();
}

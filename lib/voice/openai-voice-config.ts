import type { GuideId } from "@/types/guide";

export const OPENAI_TTS_MODEL = "gpt-4o-mini-tts";
export const OPENAI_TTS_RESPONSE_FORMAT = "mp3";
export const MAX_SPEECH_TEXT_LENGTH = 4_000;
export const SPEECH_REQUEST_TIMEOUT_MS = 20_000;

export type OpenAIVoiceProfile = {
  voice: "marin" | "cedar";
  speed: number;
  instructions: string;
};

export const OPENAI_VOICE_PROFILES: Record<GuideId, OpenAIVoiceProfile> = {
  emily: {
    voice: "marin",
    speed: 1.02,
    instructions:
      "Speak warmly, calmly, and conversationally. Sound friendly and approachable, with natural pauses and restrained enthusiasm. Pronounce product terminology clearly.",
  },
  daniel: {
    voice: "cedar",
    speed: 1,
    instructions:
      "Speak with calm confidence and clarity. Sound composed, knowledgeable, and conversational, with natural pauses and no unnecessary drama. Pronounce technical and product terminology clearly.",
  },
};

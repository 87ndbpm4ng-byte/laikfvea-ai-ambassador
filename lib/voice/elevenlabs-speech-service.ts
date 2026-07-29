import {
  ELEVENLABS_DANIEL_SETTINGS,
  ELEVENLABS_OUTPUT_FORMAT,
  ELEVENLABS_REQUEST_TIMEOUT_MS,
  ELEVENLABS_TTS_MODEL,
} from "@/lib/voice/elevenlabs-voice-config";
import type { SpeechApiRequest } from "@/lib/voice/speech-request";

export class MissingElevenLabsConfigError extends Error {
  constructor() {
    super("ElevenLabs speech configuration is unavailable.");
    this.name = "MissingElevenLabsConfigError";
  }
}

export class ElevenLabsSpeechError extends Error {
  constructor(status: number) {
    super(`ElevenLabs speech generation failed with status ${status}.`);
    this.name = "ElevenLabsSpeechError";
  }
}

type ElevenLabsSpeechOptions = {
  apiKey?: string;
  voiceId?: string;
  fetcher?: typeof fetch;
};

export async function generateElevenLabsSpeech(
  request: SpeechApiRequest,
  options: ElevenLabsSpeechOptions = {},
) {
  const apiKey = options.apiKey ?? process.env.ELEVENLABS_API_KEY;
  const voiceId =
    options.voiceId ?? process.env.ELEVENLABS_DANIEL_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new MissingElevenLabsConfigError();
  }

  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      voiceId,
    )}/stream?output_format=${ELEVENLABS_OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: ELEVENLABS_TTS_MODEL,
        voice_settings: ELEVENLABS_DANIEL_SETTINGS,
      }),
      signal: AbortSignal.timeout(ELEVENLABS_REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new ElevenLabsSpeechError(response.status);
  }

  return response.arrayBuffer();
}

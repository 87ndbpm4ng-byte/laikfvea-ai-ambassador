import {
  ELEVENLABS_DANIEL_SETTINGS,
  ELEVENLABS_LIVEAVATAR_OUTPUT_FORMAT,
  ELEVENLABS_OUTPUT_FORMAT,
  ELEVENLABS_REQUEST_TIMEOUT_MS,
  ELEVENLABS_TTS_MODEL,
} from "@/lib/voice/elevenlabs-voice-config";
import type { SpeechApiRequest } from "@/lib/voice/speech-request";
import { resolveSupportedLanguage } from "@/lib/i18n/languages";

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

export type ElevenLabsSpeechOutput = "playback" | "liveavatar";

type ElevenLabsSpeechOptions = {
  apiKey?: string;
  voiceId?: string;
  fetcher?: typeof fetch;
  output?: ElevenLabsSpeechOutput;
  onTiming?: (timing: ElevenLabsSpeechTiming) => void;
  signal?: AbortSignal;
};

export type ElevenLabsProgressiveSpeech = {
  body: ReadableStream<Uint8Array>;
  firstByteMs: number;
  contentType: string | null;
};

export type ElevenLabsSpeechTiming = {
  firstByteMs: number;
  completeMs: number;
};

export async function generateElevenLabsSpeech(
  request: SpeechApiRequest,
  options: ElevenLabsSpeechOptions = {},
): Promise<ArrayBuffer> {
  const { response, requestStartedAt, firstByteAt, voiceId } =
    await requestElevenLabsSpeech(request, options);
  const audio = await response.arrayBuffer();
  const completedAt = performance.now();
  options.onTiming?.({
    firstByteMs: firstByteAt - requestStartedAt,
    completeMs: completedAt - requestStartedAt,
  });

  console.info("[speech-api] Daniel ElevenLabs audio buffered.", {
    provider: "elevenlabs",
    voiceIdSuffix: voiceId.slice(-4),
    status: response.status,
    contentType: response.headers.get("content-type"),
    audioByteLength: audio.byteLength,
  });

  return audio;
}

export async function streamElevenLabsSpeech(
  request: SpeechApiRequest,
  options: ElevenLabsSpeechOptions = {},
): Promise<ElevenLabsProgressiveSpeech> {
  const { response, requestStartedAt, firstByteAt } =
    await requestElevenLabsSpeech(request, options);
  if (!response.body) throw new ElevenLabsSpeechError(response.status);
  return {
    body: response.body,
    firstByteMs: firstByteAt - requestStartedAt,
    contentType: response.headers.get("content-type"),
  };
}

async function requestElevenLabsSpeech(
  request: SpeechApiRequest,
  options: ElevenLabsSpeechOptions,
) {
  const apiKey = options.apiKey ?? process.env.ELEVENLABS_API_KEY;
  const voiceId =
    options.voiceId ?? process.env.ELEVENLABS_DANIEL_VOICE_ID;
  const outputFormat =
    options.output === "liveavatar"
      ? ELEVENLABS_LIVEAVATAR_OUTPUT_FORMAT
      : ELEVENLABS_OUTPUT_FORMAT;
  const accept =
    options.output === "liveavatar" ? "application/octet-stream" : "audio/mpeg";

  console.info("[speech-api] Daniel speech provider selected.", {
    provider: "elevenlabs",
    voiceIdSuffix: voiceId ? voiceId.slice(-4) : "missing",
  });

  if (!apiKey || !voiceId) {
    console.error("[speech-api] Daniel ElevenLabs configuration missing.", {
      provider: "elevenlabs",
      voiceIdSuffix: voiceId ? voiceId.slice(-4) : "missing",
      apiKeyConfigured: Boolean(apiKey),
    });
    throw new MissingElevenLabsConfigError();
  }

  const fetcher = options.fetcher ?? fetch;
  const requestStartedAt = performance.now();
  const response = await fetcher(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      voiceId,
    )}/stream?output_format=${outputFormat}`,
    {
      method: "POST",
      headers: {
        Accept: accept,
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: ELEVENLABS_TTS_MODEL,
        language_code: resolveSupportedLanguage(request.language),
        voice_settings: ELEVENLABS_DANIEL_SETTINGS,
      }),
      signal: options.signal
        ? AbortSignal.any([
            options.signal,
            AbortSignal.timeout(ELEVENLABS_REQUEST_TIMEOUT_MS),
          ])
        : AbortSignal.timeout(ELEVENLABS_REQUEST_TIMEOUT_MS),
    },
  );
  const firstByteAt = performance.now();

  console.info("[speech-api] Daniel ElevenLabs response received.", {
    provider: "elevenlabs",
    voiceIdSuffix: voiceId.slice(-4),
    status: response.status,
    contentType: response.headers.get("content-type"),
  });

  if (!response.ok) {
    throw new ElevenLabsSpeechError(response.status);
  }

  return { response, requestStartedAt, firstByteAt, voiceId };
}

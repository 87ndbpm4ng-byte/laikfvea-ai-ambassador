import {
  generateElevenLabsSpeechWithTimestamps,
  streamElevenLabsSpeech,
} from "@/lib/voice/elevenlabs-speech-service";
import { isLiveAvatarStreamingSpeechEnabled } from "@/lib/liveavatar/liveavatar-streaming-config";
import { SpeechRateLimiter } from "@/lib/voice/speech-rate-limit";
import { validateSpeechRequest } from "@/lib/voice/speech-request";
import type { ElevenLabsSpeechTiming } from "@/lib/voice/elevenlabs-speech-service";
import { generateOpenAISpeech } from "@/lib/voice/openai-speech-service";
import { selectSpeechProvider } from "@/lib/voice/speech-provider-routing";

export const runtime = "nodejs";

const rateLimiter = new SpeechRateLimiter();

function jsonError(code: string, message: string, status: number) {
  return Response.json(
    { success: false, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function requestKey(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local-kiosk"
  );
}

export async function POST(request: Request) {
  if (!rateLimiter.allow(requestKey(request))) {
    return jsonError("RATE_LIMITED", "Voice generation is busy.", 429);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_REQUEST", "The voice request is invalid.", 400);
  }

  const speechRequest = validateSpeechRequest(body);

  if (!speechRequest) {
    return jsonError("INVALID_REQUEST", "The voice request is invalid.", 400);
  }

  try {
    const provider = selectSpeechProvider(speechRequest);
    if (
      provider === "elevenlabs" &&
      isLiveAvatarStreamingSpeechEnabled()
    ) {
      const speech = await streamElevenLabsSpeech(speechRequest, {
        output: "liveavatar",
        signal: request.signal,
      });
      return new Response(speech.body, {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "audio/pcm",
          "X-Audio-Format": "pcm_s16le_24000_mono",
          "X-LiveAvatar-Speech-Mode": "streaming",
          "X-TTS-First-Byte-Ms": String(speech.firstByteMs),
          "X-Content-Type-Options": "nosniff",
          "X-Speech-Provider": "elevenlabs",
        },
      });
    }

    let timing: ElevenLabsSpeechTiming = { firstByteMs: 0, completeMs: 0 };
    const startedAt = performance.now();
    if (provider === "elevenlabs") {
      const aligned = await generateElevenLabsSpeechWithTimestamps(speechRequest, {
        output: "liveavatar",
      });
      return Response.json(
        {
          audioBase64: Buffer.from(aligned.audio).toString("base64"),
          alignment: aligned.alignment,
        },
        {
          headers: {
            "Cache-Control": "no-store",
            "X-Audio-Format": "pcm_s16le_24000_mono",
            "X-LiveAvatar-Speech-Mode": "buffered-aligned-json",
            "X-Speech-Provider": provider,
          },
        },
      );
    }
    const audio = await generateOpenAISpeech(speechRequest, {
            output: "liveavatar",
          });
    if (provider === "openai") {
      const elapsed = Math.round(performance.now() - startedAt);
      timing = { firstByteMs: elapsed, completeMs: elapsed };
    }

    return new Response(audio, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Length": String(audio.byteLength),
        "Content-Type": "audio/pcm",
        "X-Audio-Format": "pcm_s16le_24000_mono",
        "X-LiveAvatar-Speech-Mode": "buffered",
        "X-TTS-First-Byte-Ms": String(timing.firstByteMs),
        "X-TTS-Complete-Ms": String(timing.completeMs),
        "X-Content-Type-Options": "nosniff",
        "X-Speech-Provider": provider,
      },
    });
  } catch (error) {
    console.error("[liveavatar] Guide PCM generation failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      guideId: speechRequest?.guideId,
    });
    return jsonError(
      "SERVICE_UNAVAILABLE",
      "Avatar speech is temporarily unavailable.",
      503,
    );
  }
}

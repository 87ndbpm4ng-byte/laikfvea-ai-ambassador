import {
  generateElevenLabsSpeech,
  streamElevenLabsSpeech,
} from "@/lib/voice/elevenlabs-speech-service";
import { isLiveAvatarStreamingSpeechEnabled } from "@/lib/liveavatar/liveavatar-streaming-config";
import { SpeechRateLimiter } from "@/lib/voice/speech-rate-limit";
import { validateSpeechRequest } from "@/lib/voice/speech-request";
import type { ElevenLabsSpeechTiming } from "@/lib/voice/elevenlabs-speech-service";

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

  if (!speechRequest || speechRequest.guideId !== "daniel") {
    return jsonError("INVALID_REQUEST", "The voice request is invalid.", 400);
  }

  try {
    if (isLiveAvatarStreamingSpeechEnabled()) {
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
    const audio = await generateElevenLabsSpeech(speechRequest, {
      output: "liveavatar",
      onTiming: (value) => {
        timing = value;
      },
    });

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
        "X-Speech-Provider": "elevenlabs",
      },
    });
  } catch (error) {
    console.error("[liveavatar] Daniel PCM generation failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError(
      "SERVICE_UNAVAILABLE",
      "Avatar speech is temporarily unavailable.",
      503,
    );
  }
}

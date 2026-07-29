import { generateGuideSpeech } from "@/lib/voice/guide-speech-service";
import { SpeechRateLimiter } from "@/lib/voice/speech-rate-limit";
import { validateSpeechRequest } from "@/lib/voice/speech-request";

export const runtime = "nodejs";

const rateLimiter = new SpeechRateLimiter();

function jsonError(code: string, message: string, status: number) {
  return Response.json(
    {
      success: false,
      error: { code, message },
    },
    { status },
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
    return jsonError(
      "RATE_LIMITED",
      "Voice generation is temporarily busy.",
      429,
    );
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
    const { audio, provider } = await generateGuideSpeech(speechRequest);

    return new Response(audio, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Length": String(audio.byteLength),
        "Content-Type": "audio/mpeg",
        "X-Content-Type-Options": "nosniff",
        "X-Speech-Provider": provider,
      },
    });
  } catch (error) {
    console.error("[speech-api] Speech generation failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      guideId: speechRequest.guideId,
    });
    return jsonError(
      "SERVICE_UNAVAILABLE",
      "Voice generation is temporarily unavailable.",
      503,
    );
  }
}

import { generateElevenLabsSpeech } from "@/lib/voice/elevenlabs-speech-service";
import { generateOpenAISpeech } from "@/lib/voice/openai-speech-service";
import type { SpeechApiRequest } from "@/lib/voice/speech-request";

export type SpeechProviderName = "openai" | "elevenlabs";

type GuideSpeechDependencies = {
  openai?: typeof generateOpenAISpeech;
  elevenlabs?: typeof generateElevenLabsSpeech;
};

export async function generateGuideSpeech(
  request: SpeechApiRequest,
  dependencies: GuideSpeechDependencies = {},
): Promise<{ audio: ArrayBuffer; provider: SpeechProviderName }> {
  if (request.guideId === "daniel") {
    const generate = dependencies.elevenlabs ?? generateElevenLabsSpeech;
    return {
      audio: await generate(request),
      provider: "elevenlabs",
    };
  }

  const generate = dependencies.openai ?? generateOpenAISpeech;
  return {
    audio: await generate(request),
    provider: "openai",
  };
}

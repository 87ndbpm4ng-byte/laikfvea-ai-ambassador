import { generateElevenLabsSpeech } from "@/lib/voice/elevenlabs-speech-service";
import { generateOpenAISpeech } from "@/lib/voice/openai-speech-service";
import {
  selectSpeechProvider,
  type SpeechProviderName,
} from "@/lib/voice/speech-provider-routing";
import type { SpeechApiRequest } from "@/lib/voice/speech-request";

type GuideSpeechDependencies = {
  openai?: typeof generateOpenAISpeech;
  elevenlabs?: typeof generateElevenLabsSpeech;
  environment?: Record<string, string | undefined>;
};

export async function generateGuideSpeech(
  request: SpeechApiRequest,
  dependencies: GuideSpeechDependencies = {},
): Promise<{ audio: ArrayBuffer; provider: SpeechProviderName }> {
  if (selectSpeechProvider(request, dependencies.environment) === "elevenlabs") {
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

import type { SpeechSynthesisProvider } from "@/lib/voice/voice-types";

export function unlockVoiceOutput(provider: SpeechSynthesisProvider) {
  return provider.unlock?.() ?? Promise.resolve(false);
}

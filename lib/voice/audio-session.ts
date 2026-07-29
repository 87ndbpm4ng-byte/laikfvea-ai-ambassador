import type { SpeechSynthesisProvider } from "@/lib/voice/voice-types";

export function activateVoiceSession(provider: SpeechSynthesisProvider) {
  return provider.activate?.() ?? Promise.resolve(false);
}

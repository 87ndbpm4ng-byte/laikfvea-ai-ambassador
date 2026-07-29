import type { GuideId } from "@/types/guide";
import type {
  SpeechSynthesisProvider,
  VoiceError,
} from "@/lib/voice/voice-types";

const VOICE_HINTS: Record<GuideId, string[]> = {
  emily: ["samantha", "victoria", "karen", "moira", "female", "zira"],
  daniel: ["daniel", "alex", "aaron", "male", "david", "mark"],
};

export function selectGuideVoice(
  voices: SpeechSynthesisVoice[],
  guideId: GuideId,
) {
  const englishVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en"),
  );
  const candidates = englishVoices.length > 0 ? englishVoices : voices;
  const hints = VOICE_HINTS[guideId];

  return (
    candidates.find((voice) =>
      hints.some((hint) => voice.name.toLowerCase().includes(hint)),
    ) ??
    candidates.find((voice) => voice.default) ??
    candidates[0] ??
    null
  );
}

export class BrowserSpeechSynthesisProvider
  implements SpeechSynthesisProvider
{
  get isSupported() {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window
    );
  }

  speak(
    text: string,
    guideId: GuideId,
    callbacks: {
      onStart: () => void;
      onEnd: () => void;
      onError: (error: VoiceError) => void;
    },
  ) {
    if (!this.isSupported) {
      callbacks.onError({
        code: "synthesis-unavailable",
        message:
          "Spoken responses aren’t available in this browser. The answer remains visible on screen.",
      });
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = guideId === "daniel" ? 0.94 : 0.97;
    utterance.pitch = guideId === "daniel" ? 0.92 : 1.04;
    utterance.voice = selectGuideVoice(
      window.speechSynthesis.getVoices(),
      guideId,
    );
    utterance.onstart = callbacks.onStart;
    utterance.onend = callbacks.onEnd;
    utterance.onerror = () =>
      callbacks.onError({
        code: "synthesis-unavailable",
        message:
          "I couldn’t play the spoken response. The answer remains visible on screen.",
      });
    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
  }
}

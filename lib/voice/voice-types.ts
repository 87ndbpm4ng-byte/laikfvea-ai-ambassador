import type { GuideId } from "@/types/guide";

export type VoiceInputState =
  | "idle"
  | "listening"
  | "processing"
  | "unavailable";

export type VoiceOutputState = "idle" | "speaking" | "unavailable";

export type VoiceErrorCode =
  | "permission-denied"
  | "recognition-unavailable"
  | "recognition-timeout"
  | "recognition-failed"
  | "synthesis-unavailable";

export type VoiceError = {
  code: VoiceErrorCode;
  message: string;
};

export type RecognitionCallbacks = {
  onInterimTranscript: (transcript: string) => void;
  onFinalTranscript: (transcript: string) => void;
  onEnd: () => void;
  onError: (error: VoiceError) => void;
};

export interface SpeechRecognitionProvider {
  readonly isSupported: boolean;
  start(callbacks: RecognitionCallbacks): void;
  stop(): void;
  abort(): void;
}

export interface SpeechSynthesisProvider {
  readonly isSupported: boolean;
  speak(
    text: string,
    guideId: GuideId,
    callbacks: {
      onStart: () => void;
      onEnd: () => void;
      onError: (error: VoiceError) => void;
    },
  ): void;
  stop(): void;
}

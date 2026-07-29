import type { GuideId } from "@/types/guide";

export type VoiceInputState =
  | "idle"
  | "listening"
  | "processing"
  | "unavailable";

export type VoiceOutputState = "idle" | "speaking" | "unavailable";
export type SpeechPlaybackProvider = "elevenlabs" | "openai" | "browser";

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

export type SpeechSynthesisCallbacks = {
  onProvider?: (provider: SpeechPlaybackProvider) => void;
  onActivationRequired?: () => void;
  onPlaybackBlocked?: () => void;
  onStart: () => void;
  onEnd: () => void;
  onError: (error: VoiceError) => void;
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
  readonly isActivated?: boolean;
  speak(
    text: string,
    guideId: GuideId,
    callbacks: SpeechSynthesisCallbacks,
  ): void;
  activate?(): Promise<boolean>;
  retry?(): Promise<boolean>;
  reset?(): void;
  stop(): void;
}

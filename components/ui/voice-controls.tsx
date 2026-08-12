"use client";

import type {
  VoiceError,
  VoiceInputState,
  VoiceOutputState,
} from "@/lib/voice/voice-types";
import type { SupportedLanguage } from "@/types/language";
import { getUiCopy } from "@/lib/i18n/ui-copy";

type VoiceControlsProps = {
  inputState: VoiceInputState;
  outputState: VoiceOutputState;
  playbackBlocked: boolean;
  audioSessionActivated: boolean;
  preparingVoice: boolean;
  activationFailed: boolean;
  guideName: string;
  language: SupportedLanguage;
  transcript: string;
  error: VoiceError | null;
  recognitionSupported: boolean;
  synthesisSupported: boolean;
  disabled: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onRetryPlayback: () => void;
};

export function VoiceControls({
  inputState,
  outputState,
  playbackBlocked,
  audioSessionActivated,
  preparingVoice,
  activationFailed,
  guideName,
  language,
  transcript,
  error,
  recognitionSupported,
  synthesisSupported,
  disabled,
  onStartListening,
  onStopListening,
  onRetryPlayback,
}: VoiceControlsProps) {
  const copy = getUiCopy(language);
  const isListening = inputState === "listening";
  const isProcessing = inputState === "processing";
  const isSpeaking = outputState === "speaking";
  const status = isListening
    ? copy.listening
    : isProcessing
      ? copy.thinking
      : isSpeaking
        ? copy.speakingFor(guideName)
        : preparingVoice
          ? copy.gettingReady(guideName)
          : copy.voiceReadyFor(guideName);
  const controlLabel = isListening ? copy.stop : copy.talk;
  const statusDescription = transcript
    ? transcript
    : isListening
      ? copy.wordsAppear
      : isProcessing
        ? copy.preparingAnswer(guideName)
        : isSpeaking
          ? copy.answeringNow(guideName)
          : preparingVoice
            ? copy.voiceGettingReady
            : copy.talkHint;

  return (
    <div
      className="voice-panel"
      data-voice-state={
        isListening
          ? "listening"
          : isProcessing
            ? "thinking"
            : isSpeaking
              ? "speaking"
              : "ready"
      }
    >
      <div className="voice-panel-header">
        <div>
          <p className="voice-panel-title">{copy.talkTo(guideName)}</p>
          <p className="voice-panel-support">{copy.tapAndAsk}</p>
        </div>
      </div>

      <div className="voice-interaction">
        <button
          className="voice-microphone"
          type="button"
          disabled={disabled || isProcessing || !recognitionSupported}
          aria-pressed={isListening}
          aria-label={
            isListening
              ? copy.stopListeningAria(guideName)
              : isSpeaking
                ? copy.interruptAria(guideName)
                : copy.speakAria(guideName)
          }
          onClick={isListening ? onStopListening : onStartListening}
        >
          <span className="voice-microphone-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v6a3.5 3.5 0 0 0 3.5 3.5Z" />
              <path d="M5.75 11.5V12a6.25 6.25 0 0 0 12.5 0v-.5M12 18.25V22M8.5 22h7" />
            </svg>
          </span>
          <span className="voice-microphone-mark">{controlLabel}</span>
        </button>

        <div className="voice-status" aria-live="polite">
          <div className="voice-status-line">
            <span
              className={`voice-state-indicator ${
                isListening || isSpeaking || isProcessing ? "is-active" : ""
              }`}
              data-state={
                isListening
                  ? "listening"
                  : isProcessing
                    ? "thinking"
                    : isSpeaking
                      ? "speaking"
                      : "ready"
              }
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
            </span>
            <strong>{status}</strong>
          </div>
          <p>{statusDescription}</p>
        </div>
      </div>

      {playbackBlocked && guideName === "Daniel" ? (
        <button className="voice-retry" type="button" onClick={onRetryPlayback}>
          {copy.playResponse}
        </button>
      ) : !recognitionSupported ? (
        <p className="voice-message" role="status">
          {copy.recognitionUnavailable}
        </p>
      ) : !synthesisSupported ? (
        <p className="voice-message" role="status">
          {copy.synthesisUnavailable}
        </p>
      ) : error ? (
        <p className="voice-message" role="alert">
          {error.code === "permission-denied"
            ? copy.microphoneDenied
            : error.code === "recognition-timeout"
              ? copy.recognitionTimeout
              : error.code === "recognition-failed"
                ? copy.recognitionFailed
                : error.message}
        </p>
      ) : activationFailed && !audioSessionActivated ? (
        <p className="voice-message" role="status">
          {copy.activationFailed}
        </p>
      ) : (
        <p className="voice-hint">{copy.escapeHint}</p>
      )}
    </div>
  );
}

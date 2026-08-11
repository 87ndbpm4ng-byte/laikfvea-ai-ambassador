"use client";

import type {
  VoiceError,
  VoiceInputState,
  VoiceOutputState,
} from "@/lib/voice/voice-types";

type VoiceControlsProps = {
  inputState: VoiceInputState;
  outputState: VoiceOutputState;
  playbackBlocked: boolean;
  audioSessionActivated: boolean;
  preparingVoice: boolean;
  activationFailed: boolean;
  guideName: string;
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
  transcript,
  error,
  recognitionSupported,
  synthesisSupported,
  disabled,
  onStartListening,
  onStopListening,
  onRetryPlayback,
}: VoiceControlsProps) {
  const isListening = inputState === "listening";
  const isProcessing = inputState === "processing";
  const isSpeaking = outputState === "speaking";
  const status = isListening
    ? "Listening…"
    : isProcessing
      ? "Preparing an answer…"
      : isSpeaking
        ? "Speaking…"
        : preparingVoice
          ? `${guideName} is getting ready…`
          : "Ready";
  const controlLabel = isListening ? "Stop" : "Talk";
  const statusDescription = transcript
    ? transcript
    : isListening
      ? "Your words will appear here."
      : isProcessing
        ? `${guideName} is preparing a response.`
        : isSpeaking
          ? `${guideName} is answering now.`
          : preparingVoice
            ? "Voice is getting ready."
            : "Tap Talk, then ask your question.";

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
          <p className="voice-panel-title">Talk to {guideName}</p>
          <p className="voice-panel-support">Tap and ask your question.</p>
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
              ? `Stop listening and send your question to ${guideName}`
              : isSpeaking
                ? `Interrupt ${guideName} and talk`
                : `Speak with ${guideName}`
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
          Play response
        </button>
      ) : !recognitionSupported ? (
        <p className="voice-message" role="status">
          Voice input isn’t available in this browser. You can still type your
          question.
        </p>
      ) : !synthesisSupported ? (
        <p className="voice-message" role="status">
          Spoken responses aren’t available here. Answers will remain visible
          on screen.
        </p>
      ) : error ? (
        <p className="voice-message" role="alert">
          {error.message}
        </p>
      ) : activationFailed && !audioSessionActivated ? (
        <p className="voice-message" role="status">
          Voice is available through Talk. You can still type below.
        </p>
      ) : (
        <p className="voice-hint">
          Press Escape at any time to stop audio.
        </p>
      )}
    </div>
  );
}

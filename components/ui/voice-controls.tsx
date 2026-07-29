"use client";

import type {
  VoiceError,
  VoiceInputState,
  VoiceOutputState,
} from "@/lib/voice/voice-types";

type VoiceControlsProps = {
  enabled: boolean;
  inputState: VoiceInputState;
  outputState: VoiceOutputState;
  transcript: string;
  error: VoiceError | null;
  recognitionSupported: boolean;
  synthesisSupported: boolean;
  disabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
};

export function VoiceControls({
  enabled,
  inputState,
  outputState,
  transcript,
  error,
  recognitionSupported,
  synthesisSupported,
  disabled,
  onEnabledChange,
  onStartListening,
  onStopListening,
  onStopSpeaking,
}: VoiceControlsProps) {
  const isListening = inputState === "listening";
  const isProcessing = inputState === "processing";
  const isSpeaking = outputState === "speaking";
  const status = isListening
    ? "Listening"
    : isProcessing
      ? "Preparing your answer"
      : isSpeaking
        ? "Speaking"
        : "Voice ready";

  return (
    <div className="voice-panel">
      <div className="voice-panel-header">
        <div>
          <p className="voice-panel-title">Voice Mode</p>
          <p className="voice-panel-support">
            Speak and hear your guide respond.
          </p>
        </div>
        <button
          className="voice-toggle"
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? "Disable" : "Enable"} Voice Mode`}
          onClick={() => onEnabledChange(!enabled)}
        >
          <span aria-hidden="true" />
          <span>{enabled ? "On" : "Off"}</span>
        </button>
      </div>

      {enabled ? (
        <>
          <div className="voice-interaction">
            <button
              className="voice-microphone"
              type="button"
              disabled={disabled || isProcessing || !recognitionSupported}
              aria-pressed={isListening}
              aria-label={
                isListening
                  ? "Stop listening"
                  : isSpeaking
                    ? "Interrupt guide and start listening"
                    : "Start listening"
              }
              onClick={isListening ? onStopListening : onStartListening}
            >
              <span className="voice-microphone-mark" aria-hidden="true">
                {isListening ? "Stop" : "Talk"}
              </span>
            </button>

            <div className="voice-status" aria-live="polite">
              <div className="voice-status-line">
                <span
                  className={`voice-state-indicator ${
                    isListening || isSpeaking ? "is-active" : ""
                  }`}
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                </span>
                <strong>{status}</strong>
              </div>
              <p>
                {transcript ||
                  (isListening
                    ? "Your words will appear here."
                    : "Tap Talk, then ask your question.")}
              </p>
            </div>

            {isSpeaking ? (
              <button
                className="voice-stop"
                type="button"
                onClick={onStopSpeaking}
              >
                Stop voice
              </button>
            ) : null}
          </div>

          {!recognitionSupported ? (
            <p className="voice-message" role="status">
              Voice input isn’t available in this browser. You can still type
              your question.
            </p>
          ) : !synthesisSupported ? (
            <p className="voice-message" role="status">
              Spoken responses aren’t available here. Answers will remain
              visible on screen.
            </p>
          ) : error ? (
            <p className="voice-message" role="alert">
              {error.message}
            </p>
          ) : (
            <p className="voice-hint">Press Escape at any time to stop audio.</p>
          )}
        </>
      ) : null}
    </div>
  );
}

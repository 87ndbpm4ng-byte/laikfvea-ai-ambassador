"use client";

import type {
  SpeechPlaybackProvider,
  VoiceError,
  VoiceInputState,
  VoiceOutputState,
} from "@/lib/voice/voice-types";

type VoiceControlsProps = {
  enabled: boolean;
  inputState: VoiceInputState;
  outputState: VoiceOutputState;
  playbackProvider: SpeechPlaybackProvider | null;
  playbackBlocked: boolean;
  audioSessionActivated: boolean;
  activationFailed: boolean;
  guideName: string;
  transcript: string;
  error: VoiceError | null;
  recognitionSupported: boolean;
  synthesisSupported: boolean;
  disabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onActivateAudioSession: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onRetryPlayback: () => void;
};

export function VoiceControls({
  enabled,
  inputState,
  outputState,
  playbackProvider,
  playbackBlocked,
  audioSessionActivated,
  activationFailed,
  guideName,
  transcript,
  error,
  recognitionSupported,
  synthesisSupported,
  disabled,
  onEnabledChange,
  onActivateAudioSession,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onRetryPlayback,
}: VoiceControlsProps) {
  const isListening = inputState === "listening";
  const isProcessing = inputState === "processing";
  const isSpeaking = outputState === "speaking";
  const status = !audioSessionActivated
    ? "Ready to begin"
    : isListening
      ? "Listening…"
      : isProcessing
        ? "Preparing an answer…"
        : isSpeaking
          ? "Speaking…"
          : "Ready";

  return (
    <div
      className="voice-panel"
      data-voice-state={
        !enabled
          ? "off"
          : !audioSessionActivated
            ? "setup"
            : isListening
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
          <p className="voice-panel-title">Speak with {guideName}</p>
          <p className="voice-panel-support">
            A natural, hands-free conversation.
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
          {!audioSessionActivated ? (
            <div className="voice-session-activation">
              <button
                className="voice-session-start"
                type="button"
                onClick={onActivateAudioSession}
              >
                Begin voice
              </button>
              <p role={activationFailed ? "alert" : "status"}>
                Tap once to begin speaking with {guideName}.
              </p>
            </div>
          ) : null}

          <div className="voice-interaction">
            <button
              className="voice-microphone"
              type="button"
              disabled={
                disabled ||
                isProcessing ||
                !recognitionSupported ||
                !audioSessionActivated
              }
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
                    isListening || isSpeaking || isProcessing
                      ? "is-active"
                      : ""
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

          {outputState === "speaking" && playbackProvider ? (
            <p className="voice-provider-badge" role="status">
              {guideName} voice:{" "}
              {playbackProvider === "liveavatar"
                ? "LiveAvatar"
                : playbackProvider === "elevenlabs"
                  ? "ElevenLabs"
                  : "OpenAI"}
            </p>
          ) : null}

          {playbackBlocked && guideName === "Daniel" ? (
            <button
              className="voice-retry"
              type="button"
              onClick={onRetryPlayback}
            >
              Play response
            </button>
          ) : !recognitionSupported ? (
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

"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DanielAvatarOutput,
  LiveAvatarSnapshot,
} from "@/lib/liveavatar/liveavatar-types";

const INITIAL_SNAPSHOT: LiveAvatarSnapshot = {
  state: "disconnected",
  sessionId: null,
  error: null,
  reconnectAttemptCount: 0,
  outputPath: "elevenlabs-fallback",
  environment: null,
  idleTimeoutSeconds: 120,
};

type DevelopmentStatus = {
  enabled: boolean;
  environment: "sandbox" | "production" | "invalid";
  avatarSource:
    | "sandbox-default"
    | "environment-variable"
    | "unavailable";
};

const STATE_LABELS: Record<LiveAvatarSnapshot["state"], string> = {
  disconnected: "Ready",
  connecting: "Getting ready…",
  connected: "Ready",
  listening: "Listening…",
  thinking: "Preparing an answer…",
  speaking: "Speaking…",
};

const STATE_DESCRIPTIONS: Record<LiveAvatarSnapshot["state"], string> = {
  disconnected: "Voice-only mode remains available.",
  connecting: "Preparing the visual connection.",
  connected: "Ask a question when you’re ready.",
  listening: "Daniel is paying attention.",
  thinking: "Considering your question.",
  speaking: "Daniel is answering now.",
};

export function LiveAvatarRenderer({
  service,
  idleSecondsRemaining,
}: {
  service: DanielAvatarOutput;
  idleSecondsRemaining?: number | null;
}) {
  const [snapshot, setSnapshot] =
    useState<LiveAvatarSnapshot>(INITIAL_SNAPSHOT);
  const [developmentStatus, setDevelopmentStatus] =
    useState<DevelopmentStatus | null>(null);
  const videoRef = useCallback(
    (video: HTMLVideoElement | null) => service.attach(video),
    [service],
  );

  useEffect(() => service.subscribe(setSnapshot), [service]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    let active = true;

    void fetch("/api/liveavatar/session", {
      method: "GET",
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((status: DevelopmentStatus) => {
        if (active) setDevelopmentStatus(status);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const isUnavailable =
    snapshot.state === "disconnected" && Boolean(snapshot.error);
  const visibleStateLabel =
    snapshot.state === "disconnected"
      ? isUnavailable
        ? "Voice-only mode"
        : "Ready"
      : STATE_LABELS[snapshot.state];
  const visibleStateDescription =
    snapshot.state === "disconnected"
      ? isUnavailable
        ? "Daniel is available by voice while the visual session is unavailable."
        : "Enable Voice Mode when you’re ready to begin."
      : STATE_DESCRIPTIONS[snapshot.state];

  return (
    <div
      className="liveavatar-ambassador"
      data-state={snapshot.state}
      aria-label="Daniel visual guide"
    >
      <div
        className="liveavatar-ambassador-stage"
        aria-busy={
          snapshot.state === "connecting" || snapshot.state === "thinking"
        }
      >
        <video
          ref={videoRef}
          className="liveavatar-ambassador-video"
          autoPlay
          playsInline
          aria-label="Daniel’s LiveAvatar stream"
        />
        {snapshot.state === "disconnected" ? (
          <div className="liveavatar-ambassador-placeholder">
            <span aria-hidden="true">D</span>
            <p>Daniel will appear here when the visual session is ready.</p>
          </div>
        ) : null}
      </div>
      <div
        className="liveavatar-ambassador-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="liveavatar-state-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="liveavatar-state-copy">
          <strong>{visibleStateLabel}</strong>
          <span>{visibleStateDescription}</span>
        </span>
        {snapshot.state === "disconnected" && snapshot.error ? (
          <button type="button" onClick={() => void service.reconnect()}>
            Reconnect
          </button>
        ) : null}
      </div>
      {process.env.NODE_ENV === "development" && developmentStatus ? (
        <dl className="liveavatar-development-status">
          <div>
            <dt>LiveAvatar enabled</dt>
            <dd>{developmentStatus.enabled ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Environment</dt>
            <dd>{developmentStatus.environment}</dd>
          </div>
          <div>
            <dt>Avatar source</dt>
            <dd>
              {developmentStatus.avatarSource === "sandbox-default"
                ? "Sandbox default"
                : developmentStatus.avatarSource === "environment-variable"
                  ? "Environment variable"
                  : "Unavailable"}
            </dd>
          </div>
          <div>
            <dt>Connection state</dt>
            <dd>
              {snapshot.state === "disconnected"
                ? "Disconnected"
                : snapshot.state === "connecting"
                  ? "Connecting"
                  : "Connected"}
            </dd>
          </div>
          <div>
            <dt>Session state</dt>
            <dd>{STATE_LABELS[snapshot.state]}</dd>
          </div>
          <div>
            <dt>Reconnect attempts</dt>
            <dd>{snapshot.reconnectAttemptCount} / 2</dd>
          </div>
          <div>
            <dt>Output path</dt>
            <dd>
              {snapshot.outputPath === "liveavatar"
                ? "LiveAvatar"
                : "ElevenLabs fallback"}
            </dd>
          </div>
          <div>
            <dt>Idle time remaining</dt>
            <dd>
              {idleSecondsRemaining === null ||
              idleSecondsRemaining === undefined
                ? "Inactive"
                : `${idleSecondsRemaining}s`}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

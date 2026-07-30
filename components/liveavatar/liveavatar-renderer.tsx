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
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Connected",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
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

  return (
    <div className="liveavatar-ambassador" aria-label="Daniel visual guide">
      <div className="liveavatar-ambassador-stage">
        <video
          ref={videoRef}
          className="liveavatar-ambassador-video"
          autoPlay
          playsInline
          aria-label="Daniel’s LiveAvatar stream"
        />
        {snapshot.state === "disconnected" ? (
          <div className="liveavatar-ambassador-placeholder" aria-hidden="true">
            D
          </div>
        ) : null}
      </div>
      <div className="liveavatar-ambassador-status" aria-live="polite">
        <span
          className={`liveavatar-state-dot liveavatar-state-${snapshot.state}`}
          aria-hidden="true"
        />
        <span>{STATE_LABELS[snapshot.state]}</span>
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

"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  LiveAvatarOutput,
  LiveAvatarSnapshot,
} from "@/lib/liveavatar/liveavatar-types";
import { guides } from "@/lib/data/guides";
import type { GuideId } from "@/types/guide";
import type { SupportedLanguage } from "@/types/language";
import { getUiCopy } from "@/lib/i18n/ui-copy";
import {
  subscribeLipSyncDiagnostics,
  type LipSyncMeasurement,
} from "@/lib/voice/lip-sync-diagnostics";

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

export function LiveAvatarRenderer({
  service,
  guideId,
  idleSecondsRemaining,
  language,
}: {
  service: LiveAvatarOutput;
  guideId: GuideId;
  idleSecondsRemaining?: number | null;
  language: SupportedLanguage;
}) {
  const guide = guides[guideId];
  const copy = getUiCopy(language);
  const guideDisplayName = copy.guideDisplayName[guideId];
  const [snapshot, setSnapshot] =
    useState<LiveAvatarSnapshot>(INITIAL_SNAPSHOT);
  const [developmentStatus, setDevelopmentStatus] =
    useState<DevelopmentStatus | null>(null);
  const [lipSync, setLipSync] = useState<LipSyncMeasurement | null>(null);
  const videoRef = useCallback(
    (video: HTMLVideoElement | null) => service.attach(video),
    [service],
  );

  useEffect(() => service.subscribe(setSnapshot), [service]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    return subscribeLipSyncDiagnostics(setLipSync);
  }, []);

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
  const stateLabels = {
    disconnected: copy.readyFor(guide.name),
    connecting: copy.gettingReady(guide.name),
    connected: copy.readyFor(guide.name),
    listening: copy.listening,
    thinking: copy.preparingResponse,
    speaking: copy.speakingFor(guide.name),
  } satisfies Record<LiveAvatarSnapshot["state"], string>;
  const stateDescriptions = {
    disconnected: copy.voiceRemainsAvailable,
    connecting: copy.visualPreparing,
    connected: copy.visualReady,
    listening: copy.visualListening(guide.name),
    thinking: copy.visualThinking,
    speaking: copy.visualSpeaking(guide.name),
  } satisfies Record<LiveAvatarSnapshot["state"], string>;
  const visibleStateLabel =
    snapshot.state === "disconnected"
      ? isUnavailable
        ? copy.voiceOnlyMode
        : copy.readyFor(guide.name)
      : stateLabels[snapshot.state];
  const visibleStateDescription =
    snapshot.state === "disconnected"
      ? isUnavailable
        ? `${guideDisplayName}: ${copy.voiceRemainsAvailable}`
        : copy.visualReady
      : stateDescriptions[snapshot.state];

  return (
    <div
      className="liveavatar-ambassador"
      data-state={snapshot.state}
      aria-label={`${guideDisplayName}: ${copy.visualPreview}`}
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
          aria-label={`${guideDisplayName}: ${copy.visualPreview}`}
        />
        {snapshot.state === "disconnected" ? (
          <div className="liveavatar-ambassador-placeholder">
            <span className="specialist-silhouette" aria-hidden="true">
              <i />
              <i />
            </span>
            <p>
              {copy.visualUnavailable}
            </p>
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
            {copy.reconnect}
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
            <dd>{stateLabels[snapshot.state]}</dd>
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
                : guideId === "daniel"
                  ? "ElevenLabs fallback"
                  : "OpenAI voice fallback"}
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
          {lipSync ? (
            <>
              <div>
                <dt>Speech provider</dt>
                <dd>
                  {lipSync.provider === "liveavatar"
                    ? "LiveAvatar"
                    : "ElevenLabs fallback"}
                  {` / ${lipSync.mode}`}
                </dd>
              </div>
              {lipSync.mode === "streaming" ? (
                <div>
                  <dt>PCM chunks</dt>
                  <dd>
                    {lipSync.chunkCount} / {lipSync.averageChunkBytes ?? "—"} bytes average
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>PCM format</dt>
                <dd>{lipSync.pcmFormat}</dd>
              </div>
              <div>
                <dt>PCM audio</dt>
                <dd>
                  {lipSync.audioDurationMs === null
                    ? "Measuring…"
                    : `${(lipSync.audioDurationMs / 1_000).toFixed(2)}s / ${lipSync.pcmByteLength} bytes`}
                </dd>
              </div>
              <div>
                <dt>Near-silence</dt>
                <dd>
                  {lipSync.leadingNearSilenceMs === null
                    ? "Measuring…"
                    : `${lipSync.leadingNearSilenceMs.toFixed(0)}ms leading / ${lipSync.trailingNearSilenceMs?.toFixed(0)}ms trailing`}
                </dd>
              </div>
              <div>
                <dt>TTS latency</dt>
                <dd>
                  {lipSync.ttsLatencyMs === null
                    ? "Measuring…"
                    : `${lipSync.ttsLatencyMs.toFixed(0)}ms total / ${lipSync.ttsFirstByteMs?.toFixed(0) ?? "—"}ms first byte / ${lipSync.ttsCompleteMs?.toFixed(0) ?? "—"}ms complete`}
                </dd>
              </div>
              <div>
                <dt>Avatar timing</dt>
                <dd>
                  {lipSync.avatarSpeakingDurationMs === null
                    ? "Measuring…"
                    : `${(lipSync.avatarSpeakingDurationMs / 1_000).toFixed(2)}s / start ${lipSync.startOffsetMs?.toFixed(0)}ms / end ${lipSync.endOffsetMs?.toFixed(0)}ms`}
                </dd>
              </div>
            </>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

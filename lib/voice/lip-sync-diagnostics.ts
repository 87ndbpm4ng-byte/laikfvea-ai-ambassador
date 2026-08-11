"use client";

import type { PcmAudioAnalysis } from "@/lib/voice/pcm-audio";

export type LipSyncMeasurement = {
  id: string;
  provider: "liveavatar" | "elevenlabs-fallback";
  mode: "buffered" | "streaming";
  pcmFormat: "24000 Hz / 16-bit signed LE / mono";
  pcmByteLength: number | null;
  audioDurationMs: number | null;
  leadingNearSilenceMs: number | null;
  trailingNearSilenceMs: number | null;
  ttsLatencyMs: number | null;
  ttsFirstByteMs: number | null;
  ttsCompleteMs: number | null;
  repeatAudioInvokedAt: number | null;
  repeatAudioAcceptedAt: number | null;
  firstPcmChunkAt: number | null;
  firstAgentSpeakAt: number | null;
  streamCompletedAt: number | null;
  chunkCount: number;
  averageChunkBytes: number | null;
  avatarSpeakingStartedAt: number | null;
  avatarSpeakingEndedAt: number | null;
  avatarSpeakingDurationMs: number | null;
  startOffsetMs: number | null;
  endOffsetMs: number | null;
};

type Listener = (measurement: LipSyncMeasurement | null) => void;

const listeners = new Set<Listener>();
let latest: LipSyncMeasurement | null = null;

function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function publish(next: LipSyncMeasurement) {
  if (process.env.NODE_ENV !== "development") return;
  latest = next;
  listeners.forEach((listener) => listener(next));
}

function update(id: string, changes: Partial<LipSyncMeasurement>) {
  if (process.env.NODE_ENV !== "development" || latest?.id !== id) return;
  const next = { ...latest, ...changes };

  if (
    next.avatarSpeakingStartedAt !== null &&
    (next.firstAgentSpeakAt ?? next.repeatAudioAcceptedAt) !== null
  ) {
    next.startOffsetMs =
      next.avatarSpeakingStartedAt -
      (next.firstAgentSpeakAt ?? next.repeatAudioAcceptedAt)!;
  }
  if (
    next.avatarSpeakingStartedAt !== null &&
    next.avatarSpeakingEndedAt !== null
  ) {
    next.avatarSpeakingDurationMs =
      next.avatarSpeakingEndedAt - next.avatarSpeakingStartedAt;
  }
  if (
    next.avatarSpeakingDurationMs !== null &&
    next.audioDurationMs !== null
  ) {
    next.endOffsetMs =
      next.avatarSpeakingDurationMs - next.audioDurationMs;
  }

  publish(next);
}

export function beginLipSyncMeasurement(id: string) {
  if (process.env.NODE_ENV !== "development") return;
  publish({
    id,
    provider: "liveavatar",
    mode: "buffered",
    pcmFormat: "24000 Hz / 16-bit signed LE / mono",
    pcmByteLength: null,
    audioDurationMs: null,
    leadingNearSilenceMs: null,
    trailingNearSilenceMs: null,
    ttsLatencyMs: null,
    ttsFirstByteMs: null,
    ttsCompleteMs: null,
    repeatAudioInvokedAt: null,
    repeatAudioAcceptedAt: null,
    firstPcmChunkAt: null,
    firstAgentSpeakAt: null,
    streamCompletedAt: null,
    chunkCount: 0,
    averageChunkBytes: null,
    avatarSpeakingStartedAt: null,
    avatarSpeakingEndedAt: null,
    avatarSpeakingDurationMs: null,
    startOffsetMs: null,
    endOffsetMs: null,
  });
}

export function markLipSyncPcm(
  id: string,
  analysis: PcmAudioAnalysis,
  timing: {
    ttsLatencyMs: number;
    ttsFirstByteMs: number | null;
    ttsCompleteMs: number | null;
  },
) {
  update(id, {
    pcmByteLength: analysis.byteLength,
    audioDurationMs: analysis.durationMs,
    leadingNearSilenceMs: analysis.leadingNearSilenceMs,
    trailingNearSilenceMs: analysis.trailingNearSilenceMs,
    ...timing,
  });
}

export function markRepeatAudioInvoked(id: string) {
  update(id, { repeatAudioInvokedAt: now() });
}

export function markRepeatAudioAccepted(id: string) {
  update(id, { repeatAudioAcceptedAt: now() });
}

export function markStreamingFirstPcmChunk(id: string) {
  update(id, { mode: "streaming", firstPcmChunkAt: now() });
}

export function markStreamingProgress(
  id: string,
  chunkCount: number,
  pcmByteLength: number,
) {
  update(id, {
    mode: "streaming",
    firstAgentSpeakAt: latest?.firstAgentSpeakAt ?? now(),
    chunkCount,
    pcmByteLength,
    averageChunkBytes:
      chunkCount > 0 ? Math.round(pcmByteLength / chunkCount) : null,
    audioDurationMs: (pcmByteLength / (24_000 * 2)) * 1_000,
  });
}

export function markStreamingCompleted(id: string) {
  update(id, { mode: "streaming", streamCompletedAt: now() });
}

export function markAvatarSpeakingStarted(id: string) {
  update(id, { avatarSpeakingStartedAt: now() });
}

export function markAvatarSpeakingEnded(id: string) {
  update(id, { avatarSpeakingEndedAt: now() });
}

export function markLipSyncFallback(id: string) {
  update(id, { provider: "elevenlabs-fallback" });
}

export function subscribeLipSyncDiagnostics(listener: Listener) {
  listeners.add(listener);
  listener(latest);
  return () => {
    listeners.delete(listener);
  };
}

export function getLatestLipSyncMeasurement() {
  return latest;
}

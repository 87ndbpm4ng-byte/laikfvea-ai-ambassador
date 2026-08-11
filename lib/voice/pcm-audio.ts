export const LIVEAVATAR_PCM_FORMAT = {
  sampleRate: 24_000,
  bitDepth: 16,
  channels: 1,
  bytesPerSample: 2,
  encoding: "signed little-endian PCM",
} as const;

export type PcmAudioAnalysis = {
  byteLength: number;
  durationMs: number;
  leadingNearSilenceMs: number;
  trailingNearSilenceMs: number;
};

const CONSERVATIVE_NEAR_SILENCE_AMPLITUDE = 64;

/**
 * Inspects raw pcm_s16le_24000_mono without rewriting it. The deliberately
 * conservative threshold is diagnostic only and avoids treating quiet speech
 * or natural breaths as removable silence.
 */
export function analyseLiveAvatarPcm(buffer: ArrayBuffer): PcmAudioAnalysis {
  const usableByteLength = buffer.byteLength - (buffer.byteLength % 2);
  const sampleCount = usableByteLength / LIVEAVATAR_PCM_FORMAT.bytesPerSample;
  const view = new DataView(buffer, 0, usableByteLength);

  let leadingSamples = 0;
  while (
    leadingSamples < sampleCount &&
    Math.abs(view.getInt16(leadingSamples * 2, true)) <=
      CONSERVATIVE_NEAR_SILENCE_AMPLITUDE
  ) {
    leadingSamples += 1;
  }

  let trailingSamples = 0;
  while (
    trailingSamples < sampleCount - leadingSamples &&
    Math.abs(view.getInt16((sampleCount - trailingSamples - 1) * 2, true)) <=
      CONSERVATIVE_NEAR_SILENCE_AMPLITUDE
  ) {
    trailingSamples += 1;
  }

  const samplesToMs = (samples: number) =>
    (samples / LIVEAVATAR_PCM_FORMAT.sampleRate) * 1_000;

  return {
    byteLength: buffer.byteLength,
    durationMs: samplesToMs(sampleCount),
    leadingNearSilenceMs: samplesToMs(leadingSamples),
    trailingNearSilenceMs: samplesToMs(trailingSamples),
  };
}

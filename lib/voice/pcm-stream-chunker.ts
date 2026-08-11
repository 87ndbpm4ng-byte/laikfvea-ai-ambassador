import { LIVEAVATAR_PCM_FORMAT } from "@/lib/voice/pcm-audio";

export const LIVEAVATAR_FIRST_CHUNK_BYTES = 28_800;
export const LIVEAVATAR_NEXT_CHUNK_BYTES = 48_000;

export type PcmChunk = {
  sequence: number;
  pcm: Uint8Array;
};

/** Converts arbitrary upstream PCM frames into LiveAvatar's recommended sizes. */
export class PcmStreamChunker {
  private pending = new Uint8Array(0);
  private nextTarget = LIVEAVATAR_FIRST_CHUNK_BYTES;
  private sequence = 0;

  push(input: Uint8Array): PcmChunk[] {
    if (!input.byteLength) return [];
    const combined = new Uint8Array(this.pending.byteLength + input.byteLength);
    combined.set(this.pending);
    combined.set(input, this.pending.byteLength);
    this.pending = combined;

    const chunks: PcmChunk[] = [];
    while (this.pending.byteLength >= this.nextTarget) {
      chunks.push(this.take(this.nextTarget));
      this.nextTarget = LIVEAVATAR_NEXT_CHUNK_BYTES;
    }
    return chunks;
  }

  flush(): PcmChunk[] {
    return this.pending.byteLength ? [this.take(this.pending.byteLength)] : [];
  }

  private take(byteLength: number): PcmChunk {
    const pcm = this.pending.slice(0, byteLength);
    this.pending = this.pending.slice(byteLength);
    return { sequence: this.sequence++, pcm };
  }
}

export function pcmBytesToDurationMs(byteLength: number) {
  return (
    (byteLength /
      (LIVEAVATAR_PCM_FORMAT.sampleRate *
        LIVEAVATAR_PCM_FORMAT.bytesPerSample *
        LIVEAVATAR_PCM_FORMAT.channels)) *
    1_000
  );
}

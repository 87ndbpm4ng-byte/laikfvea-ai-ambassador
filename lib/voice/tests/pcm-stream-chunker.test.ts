import assert from "node:assert/strict";
import test from "node:test";
import {
  LIVEAVATAR_FIRST_CHUNK_BYTES,
  LIVEAVATAR_NEXT_CHUNK_BYTES,
  PcmStreamChunker,
  pcmBytesToDurationMs,
} from "@/lib/voice/pcm-stream-chunker";

test("PCM chunker emits a 600ms first chunk and one-second subsequent chunks", () => {
  const chunker = new PcmStreamChunker();
  const chunks = chunker.push(new Uint8Array(LIVEAVATAR_FIRST_CHUNK_BYTES + LIVEAVATAR_NEXT_CHUNK_BYTES + 7));
  const tail = chunker.flush();
  assert.deepEqual([...chunks, ...tail].map(({ pcm }) => pcm.byteLength), [28_800, 48_000, 7]);
  assert.deepEqual([...chunks, ...tail].map(({ sequence }) => sequence), [0, 1, 2]);
  assert.equal(pcmBytesToDurationMs(28_800), 600);
  assert.equal(pcmBytesToDurationMs(48_000), 1_000);
});

test("PCM chunker preserves order across arbitrary upstream frames", () => {
  const chunker = new PcmStreamChunker();
  const source = Uint8Array.from({ length: 80_000 }, (_, index) => index % 251);
  const chunks = [
    ...chunker.push(source.slice(0, 4_000)),
    ...chunker.push(source.slice(4_000, 50_000)),
    ...chunker.push(source.slice(50_000)),
    ...chunker.flush(),
  ];
  const restored = new Uint8Array(source.byteLength);
  let offset = 0;
  for (const { pcm } of chunks) {
    restored.set(pcm, offset);
    offset += pcm.byteLength;
  }
  assert.deepEqual(restored, source);
});

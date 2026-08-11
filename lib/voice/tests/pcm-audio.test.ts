import assert from "node:assert/strict";
import test from "node:test";
import { analyseLiveAvatarPcm } from "@/lib/voice/pcm-audio";

test("calculates pcm_24000 duration and conservative edge silence", () => {
  const samples = new Int16Array(24_000);
  samples.fill(1_000, 2_400, 21_600);

  const analysis = analyseLiveAvatarPcm(samples.buffer);

  assert.equal(analysis.byteLength, 48_000);
  assert.equal(analysis.durationMs, 1_000);
  assert.equal(analysis.leadingNearSilenceMs, 100);
  assert.equal(analysis.trailingNearSilenceMs, 100);
});

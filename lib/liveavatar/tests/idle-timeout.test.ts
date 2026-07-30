import assert from "node:assert/strict";
import test from "node:test";
import { LiveAvatarIdleTimer } from "@/lib/liveavatar/idle-timeout";

test("idle timeout warns fifteen seconds before reset", () => {
  let now = 0;
  let tick = () => undefined;
  let warnings = 0;
  const remaining: number[] = [];
  const timer = new LiveAvatarIdleTimer({
    timeoutSeconds: 120,
    warningSeconds: 15,
    now: () => now,
    setTimer: (callback) => {
      tick = callback;
      return 1 as never;
    },
    clearTimer() {},
    onTick: (seconds) => remaining.push(seconds),
    onWarning: () => {
      warnings += 1;
    },
    onTimeout: assert.fail,
  });

  timer.start();
  now = 105_000;
  tick();

  assert.equal(remaining.at(-1), 15);
  assert.equal(warnings, 1);
});

test("idle timeout invokes cleanup at zero", () => {
  let now = 0;
  let tick = () => undefined;
  let timeoutCount = 0;
  const timer = new LiveAvatarIdleTimer({
    timeoutSeconds: 120,
    now: () => now,
    setTimer: (callback) => {
      tick = callback;
      return 1 as never;
    },
    clearTimer() {},
    onTick() {},
    onWarning() {},
    onTimeout: () => {
      timeoutCount += 1;
    },
  });

  timer.start();
  now = 120_000;
  tick();

  assert.equal(timeoutCount, 1);
});

test("visitor activity resets the inactivity deadline", () => {
  let now = 0;
  let tick = () => undefined;
  let timeoutCount = 0;
  const timer = new LiveAvatarIdleTimer({
    timeoutSeconds: 120,
    now: () => now,
    setTimer: (callback) => {
      tick = callback;
      return 1 as never;
    },
    clearTimer() {},
    onTick() {},
    onWarning() {},
    onTimeout: () => {
      timeoutCount += 1;
    },
  });

  timer.start();
  now = 110_000;
  timer.reset();
  now = 120_000;
  tick();

  assert.equal(timeoutCount, 0);
});

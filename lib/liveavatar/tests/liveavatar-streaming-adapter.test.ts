import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  LIVEAVATAR_STREAMING_SDK_VERSION,
  LiveAvatarStreamingAdapter,
} from "@/lib/liveavatar/liveavatar-streaming-adapter";
import { isLiveAvatarStreamingSpeechEnabled } from "@/lib/liveavatar/liveavatar-streaming-config";

function createSession() {
  const messages: string[] = [];
  const session = {
    _sessionEventSocket: {
      readyState: 1,
      bufferedAmount: 0,
      send(message: string) {
        messages.push(message);
      },
    },
  };
  return { session, messages };
}

test("adapter sends ordered chunks and speak_end with one event ID", () => {
  const { session, messages } = createSession();
  const adapter = new LiveAvatarStreamingAdapter(session);
  adapter.beginAudioStream("answer-1");
  adapter.sendAudioChunk("answer-1", Uint8Array.from([1, 2]));
  adapter.sendAudioChunk("answer-1", Uint8Array.from([3, 4]));
  adapter.endAudioStream("answer-1");

  const packets = messages.map((message) => JSON.parse(message));
  assert.deepEqual(packets.map(({ type }) => type), [
    "agent.speak",
    "agent.speak",
    "agent.speak_end",
  ]);
  assert.deepEqual(new Set(packets.map(({ event_id }) => event_id)), new Set(["answer-1"]));
});

test("adapter rejects stale chunks and interrupts the active event", () => {
  const { session, messages } = createSession();
  const adapter = new LiveAvatarStreamingAdapter(session);
  adapter.beginAudioStream("answer-2");
  assert.throws(() => adapter.sendAudioChunk("stale", Uint8Array.of(1)), /stale/);
  adapter.interruptAudioStream();
  assert.deepEqual(JSON.parse(messages.at(-1)!), {
    type: "agent.interrupt",
    event_id: "answer-2",
  });
  assert.throws(() => adapter.sendAudioChunk("answer-2", Uint8Array.of(1)), /stale/);
});

test("adapter fails closed instead of building an unbounded WebSocket queue", () => {
  const { session } = createSession();
  session._sessionEventSocket.bufferedAmount = 1_000_001;
  const adapter = new LiveAvatarStreamingAdapter(session);
  adapter.beginAudioStream("answer-backpressure");
  assert.throws(
    () => adapter.sendAudioChunk("answer-backpressure", Uint8Array.of(1)),
    /backpressure/,
  );
});

test("adapter guard and dependency pin fail clearly on SDK drift", () => {
  assert.throws(() => new LiveAvatarStreamingAdapter({}), /incompatible/);
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const installed = JSON.parse(
    readFileSync("node_modules/@heygen/liveavatar-web-sdk/package.json", "utf8"),
  );
  assert.equal(packageJson.dependencies["@heygen/liveavatar-web-sdk"], LIVEAVATAR_STREAMING_SDK_VERSION);
  assert.equal(installed.version, LIVEAVATAR_STREAMING_SDK_VERSION);
});

test("server-side feature flag switches progressive speech explicitly", () => {
  assert.equal(
    isLiveAvatarStreamingSpeechEnabled({ LIVEAVATAR_STREAMING_SPEECH: " true " }),
    true,
  );
  assert.equal(
    isLiveAvatarStreamingSpeechEnabled({ LIVEAVATAR_STREAMING_SPEECH: "false" }),
    false,
  );
  assert.equal(isLiveAvatarStreamingSpeechEnabled({}), false);
  assert.equal(
    isLiveAvatarStreamingSpeechEnabled({ LIVEAVATAR_STREAMING_SPEECH: "TRUE" }),
    false,
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import type {
  DanielAvatarOutput,
  LiveAvatarStateListener,
} from "@/lib/liveavatar/liveavatar-types";
import { LiveAvatarSpeechSynthesisProvider } from "@/lib/voice/liveavatar-speech-synthesis";
import type {
  SpeechSynthesisCallbacks,
  SpeechSynthesisProvider,
} from "@/lib/voice/voice-types";
import type { GuideId } from "@/types/guide";

function flushPromises() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

class FakeAvatar implements DanielAvatarOutput {
  isConnected = true;
  audio: string[] = [];
  failSpeech = false;
  failInterrupt = false;
  connectCount = 0;
  disconnectCount = 0;
  interruptCount = 0;
  listeningCount = 0;
  thinkingCount = 0;
  fallbackCount = 0;

  async connect() {
    this.connectCount += 1;
    return this.isConnected;
  }
  async reconnect() {
    return this.connect();
  }
  async disconnect() {
    this.disconnectCount += 1;
    this.isConnected = false;
  }
  async dispose() {
    await this.disconnect();
  }
  attach() {}
  startListening() {
    this.listeningCount += 1;
  }
  stopListening() {
    this.thinkingCount += 1;
  }
  setReady() {}
  setThinking() {
    this.thinkingCount += 1;
  }
  markFallback() {
    this.fallbackCount += 1;
  }
  async speakAudio(audioBase64: string) {
    if (this.failSpeech) throw new Error("avatar failed");
    this.audio.push(audioBase64);
  }
  interrupt() {
    this.interruptCount += 1;
    if (this.failInterrupt) throw new Error("Session not found");
  }
  subscribe(listener: LiveAvatarStateListener) {
    void listener;
    return () => undefined;
  }
}

class FakeFallback implements SpeechSynthesisProvider {
  isSupported = true;
  isActivated = true;
  spoken: Array<{ text: string; guideId: GuideId }> = [];
  resetCount = 0;
  stopCount = 0;

  async activate() {
    return true;
  }
  speak(
    text: string,
    guideId: GuideId,
    callbacks: SpeechSynthesisCallbacks,
  ) {
    this.spoken.push({ text, guideId });
    callbacks.onProvider?.("elevenlabs");
    callbacks.onStart();
    callbacks.onEnd();
  }
  stop() {
    this.stopCount += 1;
  }
  reset() {
    this.resetCount += 1;
  }
}

const callbacks = {
  providers: [] as string[],
  starts: 0,
  ends: 0,
  errors: 0,
  value(): SpeechSynthesisCallbacks {
    return {
      onProvider: (provider) => this.providers.push(provider),
      onStart: () => {
        this.starts += 1;
      },
      onEnd: () => {
        this.ends += 1;
      },
      onError: () => {
        this.errors += 1;
      },
    };
  },
  reset() {
    this.providers = [];
    this.starts = 0;
    this.ends = 0;
    this.errors = 0;
  },
};

test("Daniel uses ElevenLabs PCM through LiveAvatar when connected", async () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
    fetcher: async () =>
      new Response(Uint8Array.from([1, 2, 3]), { status: 200 }),
  });

  provider.speak("Hello", "daniel", callbacks.value());
  await flushPromises();

  assert.deepEqual(callbacks.providers, ["liveavatar"]);
  assert.equal(avatar.audio.length, 1);
  assert.equal(fallback.spoken.length, 0);
  assert.equal(callbacks.starts, 1);
  assert.equal(callbacks.ends, 1);
});

test("session creation starts only after explicit voice activation", async () => {
  const avatar = new FakeAvatar();
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
  });

  assert.equal(avatar.connectCount, 0);
  assert.equal(await provider.activate(), true);
  assert.equal(avatar.connectCount, 1);
});

test("Daniel preserves existing speech output when LiveAvatar is disconnected", () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  avatar.isConnected = false;
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
  });

  provider.speak("Fallback answer", "daniel", callbacks.value());

  assert.deepEqual(fallback.spoken, [
    { text: "Fallback answer", guideId: "daniel" },
  ]);
  assert.equal(avatar.fallbackCount, 1);
});

test("LiveAvatar is interrupted before MP3 fallback begins", async () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  avatar.failSpeech = true;
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
    fetcher: async () =>
      new Response(Uint8Array.from([1, 2, 3]), { status: 200 }),
  });

  provider.speak("Fallback after avatar failure", "daniel", callbacks.value());
  await flushPromises();

  assert.equal(avatar.interruptCount, 1);
  assert.equal(avatar.fallbackCount, 1);
  assert.deepEqual(fallback.spoken, [
    {
      text: "Fallback after avatar failure",
      guideId: "daniel",
    },
  ]);
});

test("a stale interrupt cannot block the current answer's MP3 fallback", async () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  avatar.failSpeech = true;
  avatar.failInterrupt = true;
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
    fetcher: async () =>
      new Response(Uint8Array.from([1, 2, 3]), { status: 200 }),
  });

  provider.speak("Current answer", "daniel", callbacks.value());
  await flushPromises();

  assert.deepEqual(fallback.spoken, [
    { text: "Current answer", guideId: "daniel" },
  ]);
  assert.equal(callbacks.errors, 0);
});

test("Emily always uses the existing speech provider", () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
  });

  provider.speak("Emily answer", "emily", callbacks.value());

  assert.deepEqual(fallback.spoken, [
    { text: "Emily answer", guideId: "emily" },
  ]);
  assert.equal(avatar.audio.length, 0);
});

test("Voice Mode off resets the LiveAvatar session and fallback audio", async () => {
  const avatar = new FakeAvatar();
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
  });

  provider.reset();
  await flushPromises();

  assert.equal(avatar.disconnectCount, 1);
  assert.equal(fallback.resetCount, 1);
});

test("End Session resets the LiveAvatar session and fallback audio", async () => {
  const avatar = new FakeAvatar();
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
  });

  provider.reset();
  await flushPromises();

  assert.equal(avatar.disconnectCount, 1);
  assert.equal(fallback.resetCount, 1);
});

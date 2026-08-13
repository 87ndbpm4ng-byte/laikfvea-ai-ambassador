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
  supportsStreamingAudio = false;
  streamingChunks: Uint8Array[] = [];
  streamingEventIds: string[] = [];
  streamEnded = false;
  streamPlaybackStarted: (() => void) | null = null;
  connectResult: boolean | null = null;
  audio: string[] = [];
  failSpeech = false;
  failInterrupt = false;
  failStreaming = false;
  connectCount = 0;
  disconnectCount = 0;
  interruptCount = 0;
  listeningCount = 0;
  thinkingCount = 0;
  fallbackCount = 0;

  async connect() {
    this.connectCount += 1;
    if (this.connectResult !== null) this.isConnected = this.connectResult;
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
  async speakAudio(
    audioBase64: string,
    metadata?: { onPlaybackStarted?: () => void },
  ) {
    if (this.failSpeech) throw new Error("avatar failed");
    this.audio.push(audioBase64);
    metadata?.onPlaybackStarted?.();
  }
  async beginAudioStream(
    eventId: string,
    metadata?: { onPlaybackStarted?: () => void },
  ) {
    this.streamingEventIds.push(eventId);
    this.streamPlaybackStarted = metadata?.onPlaybackStarted ?? null;
  }
  sendAudioChunk(eventId: string, pcm: Uint8Array) {
    if (this.failStreaming) throw new Error("streaming backpressure");
    this.streamPlaybackStarted?.();
    this.streamPlaybackStarted = null;
    this.streamingEventIds.push(eventId);
    this.streamingChunks.push(pcm);
  }
  endAudioStream(eventId: string) {
    this.streamingEventIds.push(eventId);
    this.streamEnded = true;
  }
  interruptAudioStream() {}
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

test("Daniel Cantonese sends zh-HK through the same buffered LiveAvatar path", async () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  const fallback = new FakeFallback();
  let requestBody: { guideId?: string; language?: string; text?: string } | undefined;
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
    language: () => "zh-HK",
    fetcher: async (_input, init) => {
      requestBody = JSON.parse(String(init?.body));
      return new Response(Uint8Array.from([1, 2, 3, 4]), {
        status: 200,
        headers: {
          "X-Audio-Format": "pcm_s16le_24000_mono",
          "X-LiveAvatar-Speech-Mode": "buffered",
          "X-Speech-Provider": "openai",
        },
      });
    },
  });

  provider.speak("呢款水樽用 USB-C 充電。", "daniel", callbacks.value());
  await flushPromises();

  assert.deepEqual(requestBody, {
    text: "呢款水樽用 USB-C 充電。",
    guideId: "daniel",
    language: "zh-HK",
  });
  assert.equal(avatar.audio.length, 1);
  assert.equal(fallback.spoken.length, 0);
  assert.deepEqual(callbacks.providers, ["liveavatar"]);
});

test("reset invalidates pending Cantonese PCM before it can reach a later visitor", async () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  const fallback = new FakeFallback();
  let resolveSpeech: ((response: Response) => void) | undefined;
  const response = new Promise<Response>((resolve) => {
    resolveSpeech = resolve;
  });
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
    language: () => "zh-HK",
    fetcher: async () => response,
  });

  provider.speak("上一位訪客嘅答案。", "daniel", callbacks.value());
  provider.reset();
  resolveSpeech?.(
    new Response(Uint8Array.from([1, 2, 3, 4]), {
      status: 200,
      headers: { "X-LiveAvatar-Speech-Mode": "buffered" },
    }),
  );
  await flushPromises();

  assert.equal(avatar.audio.length, 0);
  assert.equal(fallback.spoken.length, 0);
  assert.equal(callbacks.starts, 0);
  assert.equal(callbacks.ends, 0);
  assert.equal(avatar.disconnectCount, 1);
});

test("Daniel progressively forwards streaming PCM with one event ID", async () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  avatar.supportsStreamingAudio = true;
  const fallback = new FakeFallback();
  const first = new Uint8Array(28_800).fill(1);
  const second = new Uint8Array(48_000).fill(2);
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
    fetcher: async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(first);
            controller.enqueue(second);
            controller.close();
          },
        }),
        {
          status: 200,
          headers: { "X-LiveAvatar-Speech-Mode": "streaming" },
        },
      ),
  });

  provider.speak("Streaming answer", "daniel", callbacks.value());
  await flushPromises();

  assert.equal(avatar.streamingChunks.length, 2);
  assert.equal(new Set(avatar.streamingEventIds).size, 1);
  assert.equal(avatar.streamEnded, true);
  assert.equal(avatar.audio.length, 0);
  assert.equal(fallback.spoken.length, 0);
  assert.equal(callbacks.starts, 1);
  assert.equal(callbacks.ends, 1);
});

test("progressive transport failure stops avatar output and uses MP3 once", async () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  avatar.supportsStreamingAudio = true;
  avatar.failStreaming = true;
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
    fetcher: async () =>
      new Response(new Uint8Array(30_000), {
        status: 200,
        headers: { "X-LiveAvatar-Speech-Mode": "streaming" },
      }),
  });

  provider.speak("Restart once through fallback", "daniel", callbacks.value());
  await flushPromises();

  assert.equal(avatar.audio.length, 0);
  assert.equal(avatar.fallbackCount, 1);
  assert.equal(fallback.spoken.length, 1);
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

  avatar.connectResult = false;
  provider.speak("Fallback answer", "daniel", callbacks.value());

  return flushPromises().then(() => {
    assert.deepEqual(fallback.spoken, [
      { text: "Fallback answer", guideId: "daniel" },
    ]);
    assert.equal(avatar.fallbackCount, 1);
  });
});

test("Daniel waits for the in-flight visual session before selecting fallback", async () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  avatar.isConnected = false;
  avatar.connectResult = true;
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
    fetcher: async () =>
      new Response(Uint8Array.from([1, 2, 3]), { status: 200 }),
  });

  provider.speak("Visual answer", "daniel", callbacks.value());
  await flushPromises();

  assert.equal(avatar.connectCount, 1);
  assert.equal(avatar.audio.length, 1);
  assert.equal(fallback.spoken.length, 0);
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

test("configured Emily uses OpenAI PCM through buffered LiveAvatar", async () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  const fallback = new FakeFallback();
  let requestBody: { guideId?: string } | undefined;
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
    guideId: "emily",
    fetcher: async (_input, init) => {
      requestBody = JSON.parse(String(init?.body));
      return new Response(Uint8Array.from([1, 2, 3, 4]), {
        status: 200,
        headers: { "X-LiveAvatar-Speech-Mode": "buffered" },
      });
    },
  });

  provider.speak("A warm practical answer", "emily", callbacks.value());
  await flushPromises();

  assert.equal(requestBody?.guideId, "emily");
  assert.equal(avatar.audio.length, 1);
  assert.equal(fallback.spoken.length, 0);
  assert.deepEqual(callbacks.providers, ["liveavatar"]);
});

test("Emily avatar failure immediately preserves OpenAI voice fallback", async () => {
  callbacks.reset();
  const avatar = new FakeAvatar();
  avatar.isConnected = false;
  avatar.connectResult = false;
  const fallback = new FakeFallback();
  const provider = new LiveAvatarSpeechSynthesisProvider({
    avatar,
    fallback,
    guideId: "emily",
  });

  provider.speak("Voice-only Emily answer", "emily", callbacks.value());
  await flushPromises();

  assert.deepEqual(fallback.spoken, [
    { text: "Voice-only Emily answer", guideId: "emily" },
  ]);
  assert.equal(avatar.fallbackCount, 1);
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

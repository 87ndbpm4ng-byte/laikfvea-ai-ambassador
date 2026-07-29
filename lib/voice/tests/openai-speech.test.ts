import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "@/app/api/speech/route";
import {
  generateElevenLabsSpeech,
  MissingElevenLabsConfigError,
} from "@/lib/voice/elevenlabs-speech-service";
import { generateGuideSpeech } from "@/lib/voice/guide-speech-service";
import {
  generateOpenAISpeech,
  MissingSpeechApiKeyError,
  type SpeechClient,
} from "@/lib/voice/openai-speech-service";
import { OpenAISpeechSynthesisProvider } from "@/lib/voice/openai-speech-synthesis";
import { activateVoiceSession } from "@/lib/voice/audio-session";
import { OPENAI_VOICE_PROFILES } from "@/lib/voice/openai-voice-config";
import type {
  SpeechSynthesisProvider,
  VoiceError,
} from "@/lib/voice/voice-types";
import type { GuideId } from "@/types/guide";

function flushPromises() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

class FakeFallback implements SpeechSynthesisProvider {
  isSupported = true;
  spoken: Array<{ text: string; guideId: GuideId }> = [];
  stopCount = 0;
  fail = false;

  speak(
    text: string,
    guideId: GuideId,
    callbacks: {
      onStart: () => void;
      onEnd: () => void;
      onError: (error: VoiceError) => void;
    },
  ) {
    this.spoken.push({ text, guideId });

    if (this.fail) {
      callbacks.onError({
        code: "synthesis-unavailable",
        message: "fallback failed",
      });
      return;
    }

    callbacks.onStart();
    callbacks.onEnd();
  }

  stop() {
    this.stopCount += 1;
  }
}

type FakeAudio = {
  src: string;
  currentTime: number;
  onplay: (() => void) | null;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  playCount: number;
  pauseCount: number;
  loadCount: number;
  playErrors: Error[];
  play(): Promise<void>;
  pause(): void;
  load(): void;
  removeAttribute(name: string): void;
};

function createFakeAudio(source = ""): FakeAudio {
  return {
    src: source,
    currentTime: 0,
    onplay: null,
    onended: null,
    onerror: null,
    playCount: 0,
    pauseCount: 0,
    loadCount: 0,
    playErrors: [],
    async play() {
      this.playCount += 1;
      const error = this.playErrors.shift();

      if (error) {
        throw error;
      }

      this.onplay?.();
    },
    pause() {
      this.pauseCount += 1;
    },
    load() {
      this.loadCount += 1;
    },
    removeAttribute(name) {
      if (name === "src") {
        this.src = "";
      }
    },
  };
}

test("voice session activates once through the explicit user action", async () => {
  let activationCount = 0;
  const provider: SpeechSynthesisProvider = {
    isSupported: true,
    speak() {},
    stop() {},
    async activate() {
      activationCount += 1;
      return true;
    },
  };

  await activateVoiceSession(provider);

  assert.equal(activationCount, 1);
});

test("persistent audio activation supports delayed speech playback", async () => {
  const audio = createFakeAudio();
  const provider = new OpenAISpeechSynthesisProvider({
    fallback: new FakeFallback(),
    fetcher: async () =>
      new Response(Uint8Array.from([1, 2, 3]), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "X-Speech-Provider": "elevenlabs",
        },
      }),
    createAudio: () => audio,
    createObjectURL: () => "blob:delayed",
    revokeObjectURL() {},
  });

  assert.equal(await provider.activate(), true);
  provider.speak("Delayed answer", "daniel", {
    onStart() {},
    onEnd() {},
    onError: assert.fail,
  });
  await flushPromises();

  assert.equal(audio.playCount, 2);
  assert.equal(audio.src, "blob:delayed");
});

test("three consecutive Daniel responses reuse one persistent audio element", async () => {
  const audio = createFakeAudio();
  let createdPlayers = 0;
  let urlIndex = 0;
  const provider = new OpenAISpeechSynthesisProvider({
    fallback: new FakeFallback(),
    fetcher: async () =>
      new Response(Uint8Array.from([1]), {
        status: 200,
        headers: { "X-Speech-Provider": "elevenlabs" },
      }),
    createAudio: () => {
      createdPlayers += 1;
      return audio;
    },
    createObjectURL: () => `blob:answer-${++urlIndex}`,
    revokeObjectURL() {},
  });
  const callbacks = { onStart() {}, onEnd() {}, onError: assert.fail };

  await provider.activate();
  provider.speak("First", "daniel", callbacks);
  await flushPromises();
  provider.speak("Second", "daniel", callbacks);
  await flushPromises();
  provider.speak("Third", "daniel", callbacks);
  await flushPromises();

  assert.equal(createdPlayers, 1);
  assert.equal(audio.playCount, 4);
  assert.equal(audio.src, "blob:answer-3");
});

test("Emily and Daniel use the configured OpenAI voices", () => {
  assert.equal(OPENAI_VOICE_PROFILES.emily.voice, "marin");
  assert.equal(OPENAI_VOICE_PROFILES.daniel.voice, "cedar");
});

test("guide speech routing keeps Emily on OpenAI and Daniel on ElevenLabs", async () => {
  const calls: string[] = [];
  const audio = Uint8Array.from([1]).buffer;
  const dependencies = {
    openai: async () => {
      calls.push("openai");
      return audio;
    },
    elevenlabs: async () => {
      calls.push("elevenlabs");
      return audio;
    },
  };

  const emily = await generateGuideSpeech(
    { text: "Hello", guideId: "emily" },
    dependencies,
  );
  const daniel = await generateGuideSpeech(
    { text: "Hello", guideId: "daniel" },
    dependencies,
  );

  assert.equal(emily.provider, "openai");
  assert.equal(daniel.provider, "elevenlabs");
  assert.deepEqual(calls, ["openai", "elevenlabs"]);
});

test("Daniel speech uses the configured ElevenLabs voice endpoint", async () => {
  let requestedURL = "";
  let requestedBody = "";

  const audio = await generateElevenLabsSpeech(
    { text: "A clear technical answer.", guideId: "daniel" },
    {
      apiKey: "test-key",
      voiceId: "daniel-test-voice",
      fetcher: async (input, init) => {
        requestedURL = String(input);
        requestedBody = String(init?.body);
        return new Response(Uint8Array.from([4, 5, 6]), { status: 200 });
      },
    },
  );

  assert.equal(audio.byteLength, 3);
  assert.match(
    requestedURL,
    /text-to-speech\/daniel-test-voice\/stream/,
  );
  assert.match(requestedBody, /"model_id":"eleven_multilingual_v2"/);
});

test("missing Daniel configuration fails safely", async () => {
  await assert.rejects(
    generateElevenLabsSpeech(
      { text: "Hello", guideId: "daniel" },
      { apiKey: "", voiceId: "" },
    ),
    MissingElevenLabsConfigError,
  );
});

test("server speech generation uses the selected guide profile", async () => {
  let receivedOptions: Record<string, unknown> | undefined;
  const client: SpeechClient = {
    audio: {
      speech: {
        async create(options) {
          receivedOptions = options;
          return {
            async arrayBuffer() {
              return Uint8Array.from([1, 2, 3]).buffer;
            },
          };
        },
      },
    },
  };

  const audio = await generateOpenAISpeech(
    { text: "Hello", guideId: "emily", language: "en-US" },
    { client },
  );

  assert.equal(audio.byteLength, 3);
  assert.equal(receivedOptions?.voice, "marin");
  assert.equal(receivedOptions?.input, "Hello");
});

test("missing API key fails safely before creating a client", async () => {
  await assert.rejects(
    generateOpenAISpeech(
      { text: "Hello", guideId: "daniel" },
      { apiKey: "" },
    ),
    MissingSpeechApiKeyError,
  );
});

test("invalid API input receives a safe 400 response", async () => {
  const response = await POST(
    new Request("http://localhost/api/speech", {
      method: "POST",
      body: JSON.stringify({ text: "", guideId: "unknown" }),
      headers: { "Content-Type": "application/json" },
    }),
  );
  const body = (await response.json()) as {
    success: boolean;
    error: { code: string };
  };

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error.code, "INVALID_REQUEST");
});

test("plays generated audio and cleans up its object URL", async () => {
  const fallback = new FakeFallback();
  const audio = createFakeAudio("blob:voice");
  const revoked: string[] = [];
  const provider = new OpenAISpeechSynthesisProvider({
    fallback,
    fetcher: async () =>
      new Response(Uint8Array.from([1, 2, 3]), {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      }),
    createAudio: () => audio,
    createObjectURL: () => "blob:voice",
    revokeObjectURL: (url) => revoked.push(url),
    language: () => "en-US",
  });
  let started = 0;
  let ended = 0;

  await provider.activate();
  provider.speak("A natural answer", "emily", {
    onStart: () => {
      started += 1;
    },
    onEnd: () => {
      ended += 1;
    },
    onError: assert.fail,
  });
  await flushPromises();
  audio.onended?.();

  assert.equal(started, 1);
  assert.equal(ended, 1);
  assert.deepEqual(revoked, ["blob:voice"]);
  assert.equal(fallback.spoken.length, 0);
});

test("Daniel API failure surfaces an error without browser fallback", async () => {
  const fallback = new FakeFallback();
  const audio = createFakeAudio();
  let receivedError: VoiceError | null = null;
  const provider = new OpenAISpeechSynthesisProvider({
    fallback,
    fetcher: async () => new Response(null, { status: 503 }),
    createAudio: () => audio,
    language: () => "en-US",
  });

  await provider.activate();
  provider.speak("Fallback answer", "daniel", {
    onStart() {},
    onEnd() {},
    onError(error) {
      receivedError = error;
    },
  });
  await flushPromises();

  assert.deepEqual(fallback.spoken, []);
  assert.equal(receivedError?.code, "synthesis-unavailable");
});

test("blocked Daniel playback offers a direct retry on the same player", async () => {
  const audio = createFakeAudio();
  const blockedError = new Error("Playback requires user activation.");
  blockedError.name = "NotAllowedError";
  const provider = new OpenAISpeechSynthesisProvider({
    fallback: new FakeFallback(),
    fetcher: async () =>
      new Response(Uint8Array.from([1]), {
        status: 200,
        headers: { "X-Speech-Provider": "elevenlabs" },
      }),
    createAudio: () => audio,
    createObjectURL: () => "blob:blocked",
    revokeObjectURL() {},
  });
  let blocked = 0;
  let started = 0;

  await provider.activate();
  audio.playErrors.push(blockedError);
  provider.speak("Tap to retry", "daniel", {
    onPlaybackBlocked: () => {
      blocked += 1;
    },
    onStart: () => {
      started += 1;
    },
    onEnd() {},
    onError: assert.fail,
  });
  await flushPromises();

  assert.equal(blocked, 1);
  assert.equal(started, 0);
  assert.equal(audio.src, "blob:blocked");
  assert.equal(await provider.retry(), true);
  assert.equal(started, 1);
  assert.equal(audio.playCount, 3);
});

test("stop interrupts playback and releases audio resources", async () => {
  const audio = createFakeAudio("blob:active");
  const revoked: string[] = [];
  const provider = new OpenAISpeechSynthesisProvider({
    fallback: new FakeFallback(),
    fetcher: async () => new Response(Uint8Array.from([1]), { status: 200 }),
    createAudio: () => audio,
    createObjectURL: () => "blob:active",
    revokeObjectURL: (url) => revoked.push(url),
  });

  await provider.activate();
  provider.speak("Stop this answer", "emily", {
    onStart() {},
    onEnd() {},
    onError: assert.fail,
  });
  await flushPromises();
  provider.stop();

  assert.equal(audio.pauseCount >= 2, true);
  assert.equal(audio.currentTime, 0);
  assert.deepEqual(revoked, ["blob:active"]);
});

test("new speech prevents overlapping playback", async () => {
  const audio = createFakeAudio();
  let urlIndex = 0;
  const revoked: string[] = [];
  const provider = new OpenAISpeechSynthesisProvider({
    fallback: new FakeFallback(),
    fetcher: async () => new Response(Uint8Array.from([1]), { status: 200 }),
    createAudio: () => audio,
    createObjectURL: () => `blob:${++urlIndex}`,
    revokeObjectURL: (url) => revoked.push(url),
  });
  const callbacks = { onStart() {}, onEnd() {}, onError: assert.fail };

  await provider.activate();
  provider.speak("First answer", "emily", callbacks);
  await flushPromises();
  provider.speak("Second answer", "emily", callbacks);
  await flushPromises();

  assert.equal(audio.playCount, 3);
  assert.equal(audio.src, "blob:2");
  assert.deepEqual(revoked, ["blob:1"]);
});

test("text conversation remains unaffected when both audio providers fail", async () => {
  const fallback = new FakeFallback();
  fallback.isSupported = false;
  const audio = createFakeAudio();
  const provider = new OpenAISpeechSynthesisProvider({
    fallback,
    fetcher: async () => new Response(null, { status: 503 }),
    createAudio: () => audio,
  });
  let error: VoiceError | null = null;

  await provider.activate();
  provider.speak("The visible answer remains available.", "daniel", {
    onStart() {},
    onEnd() {},
    onError: (voiceError) => {
      error = voiceError;
    },
  });
  await flushPromises();

  assert.equal(error?.code, "synthesis-unavailable");
});

test("End Session and Voice Mode off reset audio activation", async () => {
  const audio = createFakeAudio();
  const provider = new OpenAISpeechSynthesisProvider({
    fallback: new FakeFallback(),
    createAudio: () => audio,
  });

  await provider.activate();
  assert.equal(provider.isActivated, true);
  provider.reset();
  assert.equal(provider.isActivated, false);

  let activationRequired = 0;
  provider.speak("Should not play", "daniel", {
    onActivationRequired: () => {
      activationRequired += 1;
    },
    onStart: assert.fail,
    onEnd: assert.fail,
    onError: assert.fail,
  });

  assert.equal(activationRequired, 1);
});

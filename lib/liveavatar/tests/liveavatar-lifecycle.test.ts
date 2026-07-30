import assert from "node:assert/strict";
import test from "node:test";
import {
  AgentEventsEnum,
  SessionEvent,
} from "@heygen/liveavatar-web-sdk";
import { LiveAvatarService } from "@/lib/liveavatar/liveavatar-service";
import type { LiveAvatarSnapshot } from "@/lib/liveavatar/liveavatar-types";

type Handler = (...args: unknown[]) => void;

class FakeSession {
  handlers = new Map<string, Handler[]>();
  startCount = 0;
  stopCount = 0;

  async start() {
    this.startCount += 1;
  }
  async stop() {
    this.stopCount += 1;
  }
  attach() {}
  repeatAudio() {
    return "audio-event";
  }
  startListening() {
    return "listen-start";
  }
  stopListening() {
    return "listen-stop";
  }
  interrupt() {}
  async keepAlive() {}
  on(event: string, handler: Handler) {
    const handlers = this.handlers.get(event) ?? [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
    return this;
  }
  removeAllListeners() {
    this.handlers.clear();
    return this;
  }
  emit(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.forEach((handler) => handler(...args));
  }
}

function sessionResponse() {
  return new Response(
    JSON.stringify({
      success: true,
      sessionId: "safe-session-id",
      sessionToken: "short-lived-token",
      environment: "production",
      idleTimeoutSeconds: 120,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function failedSessionResponse(status: number, retryable: boolean) {
  return Response.json(
    {
      success: false,
      error: {
        code: retryable
          ? "LIVEAVATAR_TEMPORARILY_UNAVAILABLE"
          : "LIVEAVATAR_CONFIGURATION_REJECTED",
        message:
          "The avatar session could not be started. Voice-only mode is available.",
        retryable,
      },
    },
    { status },
  );
}

test("constructing the service does not create a session on page load", () => {
  let fetchCount = 0;
  let sessionCount = 0;

  new LiveAvatarService({
    fetcher: async () => {
      fetchCount += 1;
      return sessionResponse();
    },
    createSession: () => {
      sessionCount += 1;
      return new FakeSession() as never;
    },
  });

  assert.equal(fetchCount, 0);
  assert.equal(sessionCount, 0);
});

test("an explicit connect action creates exactly one session", async () => {
  let fetchCount = 0;
  let sessionCount = 0;
  const service = new LiveAvatarService({
    fetcher: async () => {
      fetchCount += 1;
      return sessionResponse();
    },
    createSession: () => {
      sessionCount += 1;
      return new FakeSession() as never;
    },
  });

  assert.equal(await service.connect(), true);
  assert.equal(fetchCount, 1);
  assert.equal(sessionCount, 1);
  await service.disconnect();
});

test("concurrent connect calls cannot create duplicate sessions", async () => {
  let releaseResponse: (() => void) | undefined;
  let fetchCount = 0;
  let sessionCount = 0;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  const service = new LiveAvatarService({
    fetcher: async () => {
      fetchCount += 1;
      await responseGate;
      return sessionResponse();
    },
    createSession: () => {
      sessionCount += 1;
      return new FakeSession() as never;
    },
  });

  const first = service.connect();
  const second = service.connect();
  releaseResponse?.();
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.equal(fetchCount, 1);
  assert.equal(sessionCount, 1);
  await service.disconnect();
});

test("automatic reconnect stops after two attempts and selects fallback", async () => {
  let fetchCount = 0;
  const session = new FakeSession();
  let latestSnapshot: LiveAvatarSnapshot | null = null;
  const service = new LiveAvatarService({
    reconnectDelayMs: 0,
    maxAutomaticReconnects: 2,
    fetcher: async () => {
      fetchCount += 1;
      if (fetchCount === 1) return sessionResponse();
      return failedSessionResponse(502, true);
    },
    createSession: () => session as never,
  });
  service.subscribe((snapshot) => {
    latestSnapshot = snapshot;
  });

  assert.equal(await service.connect(), true);
  let initialSnapshot: LiveAvatarSnapshot | null = null;
  const unsubscribe = service.subscribe((snapshot) => {
    initialSnapshot = snapshot;
  });
  assert.equal(
    (initialSnapshot as LiveAvatarSnapshot | null)?.reconnectAttemptCount,
    0,
  );
  unsubscribe();
  session.emit(SessionEvent.SESSION_DISCONNECTED, "network");
  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.equal(fetchCount, 3);
  assert.equal(
    (latestSnapshot as LiveAvatarSnapshot | null)?.reconnectAttemptCount,
    2,
  );
  assert.equal(
    (latestSnapshot as LiveAvatarSnapshot | null)?.outputPath,
    "elevenlabs-fallback",
  );
  await service.disconnect();
});

test("a deterministic 422 provider failure is not retried", async () => {
  let fetchCount = 0;
  let latestSnapshot: LiveAvatarSnapshot | null = null;
  const service = new LiveAvatarService({
    reconnectDelayMs: 0,
    fetcher: async () => {
      fetchCount += 1;
      return failedSessionResponse(502, false);
    },
  });
  service.subscribe((snapshot) => {
    latestSnapshot = snapshot;
  });

  assert.equal(await service.connect(), false);
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(fetchCount, 1);
  assert.equal(
    (latestSnapshot as LiveAvatarSnapshot | null)?.reconnectAttemptCount,
    0,
  );
  assert.equal(
    (latestSnapshot as LiveAvatarSnapshot | null)?.outputPath,
    "elevenlabs-fallback",
  );
  assert.equal(
    (latestSnapshot as LiveAvatarSnapshot | null)?.error,
    "The avatar session could not be started. Voice-only mode is available.",
  );
  await service.disconnect();
});

test("429 and 5xx route failures remain retryable", async () => {
  for (const status of [429, 500, 502, 503]) {
    let fetchCount = 0;
    const service = new LiveAvatarService({
      reconnectDelayMs: 0,
      maxAutomaticReconnects: 1,
      fetcher: async () => {
        fetchCount += 1;
        return failedSessionResponse(status, true);
      },
    });

    assert.equal(await service.connect(), false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(fetchCount, 2);
    await service.disconnect();
  }
});

test("session cleanup stops active resources", async () => {
  const session = new FakeSession();
  const service = new LiveAvatarService({
    fetcher: async () => sessionResponse(),
    createSession: () => session as never,
  });

  await service.connect();
  await service.disconnect();

  assert.equal(session.stopCount, 1);
});

test("a fresh visitor can create a new session after cleanup", async () => {
  let sessionCount = 0;
  const service = new LiveAvatarService({
    fetcher: async () => sessionResponse(),
    createSession: () => {
      sessionCount += 1;
      return new FakeSession() as never;
    },
  });

  assert.equal(await service.connect(), true);
  await service.disconnect();
  assert.equal(await service.connect(), true);

  assert.equal(sessionCount, 2);
  await service.disconnect();
});

test("speech completion events remain available after production safeguards", async () => {
  const session = new FakeSession();
  const service = new LiveAvatarService({
    fetcher: async () => sessionResponse(),
    createSession: () => session as never,
  });

  await service.connect();
  const speech = service.speakAudio("AQID");
  session.emit(AgentEventsEnum.AVATAR_SPEAK_ENDED, {});
  await speech;
  await service.disconnect();
});

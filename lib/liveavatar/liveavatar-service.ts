"use client";

import {
  AgentEventsEnum,
  LiveAvatarSession,
  SessionEvent,
  SessionState,
} from "@heygen/liveavatar-web-sdk";
import type {
  DanielAvatarOutput,
  LiveAvatarSnapshot,
  LiveAvatarState,
  LiveAvatarStateListener,
} from "@/lib/liveavatar/liveavatar-types";

type SessionApiResponse =
  | {
      success: true;
      sessionId: string;
      sessionToken: string;
      environment: "sandbox" | "production";
      idleTimeoutSeconds: number;
    }
  | {
      success: false;
      error?: { code?: string; message?: string; retryable?: boolean };
    };

type AvatarSession = Pick<
  LiveAvatarSession,
  | "start"
  | "stop"
  | "attach"
  | "repeatAudio"
  | "startListening"
  | "stopListening"
  | "interrupt"
  | "keepAlive"
  | "on"
  | "removeAllListeners"
>;

type LiveAvatarServiceOptions = {
  fetcher?: typeof fetch;
  createSession?: (token: string) => AvatarSession;
  reconnectDelayMs?: number;
  keepAliveIntervalMs?: number;
  maxAutomaticReconnects?: number;
};

const SAFE_CONNECTION_ERROR =
  "Daniel’s visual connection is unavailable. Voice playback will continue.";
const SAFE_CONFIGURATION_ERROR =
  "The avatar session could not be started. Voice-only mode is available.";

class LiveAvatarSessionRequestError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly code?: string,
  ) {
    super(message);
    this.name = "LiveAvatarSessionRequestError";
  }
}

export class LiveAvatarService implements DanielAvatarOutput {
  private readonly fetcher: typeof fetch;
  private readonly createSession: (token: string) => AvatarSession;
  private readonly reconnectDelayMs: number;
  private readonly keepAliveIntervalMs: number;
  private readonly listeners = new Set<LiveAvatarStateListener>();
  private snapshot: LiveAvatarSnapshot = {
    state: "disconnected",
    sessionId: null,
    error: null,
    reconnectAttemptCount: 0,
    outputPath: "elevenlabs-fallback",
    environment: null,
    idleTimeoutSeconds: 120,
  };
  private session: AvatarSession | null = null;
  private video: HTMLVideoElement | null = null;
  private connectPromise: Promise<boolean> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private desiredConnection = false;
  private reconnectAttemptCount = 0;
  private readonly maxAutomaticReconnects: number;
  private pendingSpeech:
    | { resolve: () => void; reject: (error: Error) => void }
    | null = null;

  constructor(options: LiveAvatarServiceOptions = {}) {
    this.fetcher =
      options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
    this.createSession =
      options.createSession ??
      ((token) => new LiveAvatarSession(token, { voiceChat: false }));
    this.reconnectDelayMs = options.reconnectDelayMs ?? 1_500;
    this.keepAliveIntervalMs = options.keepAliveIntervalMs ?? 30_000;
    this.maxAutomaticReconnects = options.maxAutomaticReconnects ?? 2;

    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", () => {
        void this.disconnect();
      });
    }
  }

  get isConnected() {
    return (
      this.session !== null &&
      this.snapshot.state !== "disconnected" &&
      this.snapshot.state !== "connecting"
    );
  }

  connect() {
    this.desiredConnection = true;

    if (this.isConnected) {
      return Promise.resolve(true);
    }

    if (!this.connectPromise) {
      this.connectPromise = this.createConnection().finally(() => {
        this.connectPromise = null;
      });
    }

    return this.connectPromise;
  }

  async reconnect() {
    this.desiredConnection = true;
    this.reconnectAttemptCount = 0;
    await this.releaseSession();
    return this.connect();
  }

  async disconnect() {
    this.desiredConnection = false;
    this.reconnectAttemptCount = 0;
    this.clearReconnectTimer();
    await this.releaseSession();
    this.update("disconnected", null, null, "elevenlabs-fallback");
  }

  attach(element: HTMLVideoElement | null) {
    this.video = element;

    if (element && this.session && this.isConnected) {
      this.attachStream(this.session);
    }
  }

  startListening() {
    if (!this.session || !this.isConnected) return;
    this.session.startListening();
    this.update("listening");
  }

  stopListening() {
    if (!this.session || !this.isConnected) return;
    this.session.stopListening();
    this.update("thinking");
  }

  setReady() {
    if (this.isConnected) this.update("connected");
  }

  setThinking() {
    if (this.isConnected) this.update("thinking");
  }

  markFallback() {
    this.update(
      this.snapshot.state,
      this.snapshot.sessionId,
      this.snapshot.error,
      "elevenlabs-fallback",
    );
  }

  speakAudio(audioBase64: string) {
    if (!this.session || !this.isConnected) {
      return Promise.reject(new Error("LiveAvatar is not connected."));
    }

    this.interruptPendingSpeech();

    return new Promise<void>((resolve, reject) => {
      this.pendingSpeech = { resolve, reject };

      try {
        this.session?.repeatAudio(audioBase64);
      } catch (error) {
        this.pendingSpeech = null;
        reject(
          error instanceof Error
            ? error
            : new Error("LiveAvatar audio delivery failed."),
        );
      }
    });
  }

  interrupt() {
    this.session?.interrupt();
    this.interruptPendingSpeech();
    if (this.isConnected) this.update("listening");
  }

  subscribe(listener: LiveAvatarStateListener) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  private async createConnection() {
    this.clearReconnectTimer();
    this.update("connecting", null, null);

    try {
      const response = await this.fetcher("/api/liveavatar/session", {
        method: "POST",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = (await response.json()) as SessionApiResponse;

      if (!response.ok || !payload.success) {
        throw new LiveAvatarSessionRequestError(
          !payload.success && payload.error?.message
            ? payload.error.message
            : SAFE_CONNECTION_ERROR,
          !payload.success && payload.error?.retryable === true,
          !payload.success ? payload.error?.code : undefined,
        );
      }

      if (!this.desiredConnection) return false;

      const session = this.createSession(payload.sessionToken);
      this.session = session;
      this.bindSession(session, payload.sessionId);
      await session.start();

      if (this.session !== session || !this.desiredConnection) {
        await session.stop().catch(() => undefined);
        return false;
      }

      this.update("connected", payload.sessionId, null, "liveavatar");
      this.snapshot = {
        ...this.snapshot,
        environment: payload.environment,
        idleTimeoutSeconds: payload.idleTimeoutSeconds,
      };
      this.notify();
      this.startKeepAlive(session);
      return true;
    } catch (error) {
      console.warn("[liveavatar] Connection failed.", {
        name: error instanceof Error ? error.name : "UnknownError",
        code:
          error instanceof LiveAvatarSessionRequestError
            ? error.code
            : undefined,
        retryable:
          error instanceof LiveAvatarSessionRequestError
            ? error.retryable
            : true,
      });
      await this.releaseSession();
      const retryable =
        !(error instanceof LiveAvatarSessionRequestError) || error.retryable;
      this.update(
        "disconnected",
        null,
        retryable ? SAFE_CONNECTION_ERROR : SAFE_CONFIGURATION_ERROR,
        "elevenlabs-fallback",
      );
      if (retryable) this.scheduleReconnect();
      return false;
    }
  }

  private bindSession(session: AvatarSession, sessionId: string) {
    session.on(SessionEvent.SESSION_STATE_CHANGED, (state) => {
      if (this.session !== session) return;
      if (state === SessionState.CONNECTING) {
        this.update("connecting", sessionId);
      } else if (state === SessionState.CONNECTED) {
        this.update("connected", sessionId, null);
      }
    });
    session.on(SessionEvent.SESSION_STREAM_READY, () => {
      if (this.session === session) this.attachStream(session);
    });
    session.on(SessionEvent.SESSION_DISCONNECTED, () => {
      if (this.session !== session) return;
      this.session = null;
      this.stopKeepAlive();
      this.clearVideo();
      this.interruptPendingSpeech();
      this.update("disconnected", null, SAFE_CONNECTION_ERROR);
      this.scheduleReconnect();
    });
    session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
      if (this.session === session) this.update("speaking");
    });
    session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
      if (this.session !== session) return;
      this.pendingSpeech?.resolve();
      this.pendingSpeech = null;
      this.update("listening");
    });
  }

  private attachStream(session: AvatarSession) {
    if (!this.video) return;
    session.attach(this.video);
    void this.video.play().catch((error: unknown) => {
      console.warn("[liveavatar] Avatar stream playback was blocked.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    });
  }

  private update(
    state: LiveAvatarState,
    sessionId = this.snapshot.sessionId,
    error = this.snapshot.error,
    outputPath = this.snapshot.outputPath,
  ) {
    this.snapshot = {
      state,
      sessionId,
      error,
      reconnectAttemptCount: this.reconnectAttemptCount,
      outputPath,
      environment: this.snapshot.environment,
      idleTimeoutSeconds: this.snapshot.idleTimeoutSeconds,
    };
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.snapshot));
  }

  private scheduleReconnect() {
    if (!this.desiredConnection || this.reconnectTimer) return;

    if (this.reconnectAttemptCount >= this.maxAutomaticReconnects) {
      this.update(
        "disconnected",
        null,
        SAFE_CONNECTION_ERROR,
        "elevenlabs-fallback",
      );
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttemptCount += 1;
      this.update(
        "connecting",
        null,
        null,
        "elevenlabs-fallback",
      );
      void this.connect();
    }, this.reconnectDelayMs);
  }

  private startKeepAlive(session: AvatarSession) {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (this.session !== session) return;
      void session.keepAlive().catch(() => this.scheduleReconnect());
    }, this.keepAliveIntervalMs);
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = null;
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private interruptPendingSpeech() {
    this.pendingSpeech?.reject(new Error("LiveAvatar speech interrupted."));
    this.pendingSpeech = null;
  }

  private clearVideo() {
    if (!this.video) return;
    this.video.pause();
    this.video.srcObject = null;
    this.video.removeAttribute("src");
    this.video.load();
  }

  private async releaseSession() {
    this.stopKeepAlive();
    this.interruptPendingSpeech();
    const session = this.session;
    this.session = null;
    session?.removeAllListeners();
    if (session) await session.stop().catch(() => undefined);
    this.clearVideo();
  }
}

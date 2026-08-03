"use client";

import type { DanielAvatarOutput } from "@/lib/liveavatar/liveavatar-types";
import type {
  SpeechSynthesisCallbacks,
  SpeechSynthesisProvider,
  VoiceError,
} from "@/lib/voice/voice-types";
import type { GuideId } from "@/types/guide";

type LiveAvatarSpeechOptions = {
  avatar: DanielAvatarOutput;
  fallback: SpeechSynthesisProvider;
  fetcher?: typeof fetch;
  language?: () => string | undefined;
};

const AVATAR_OUTPUT_ERROR: VoiceError = {
  code: "synthesis-unavailable",
  message:
    "Daniel’s visual voice is unavailable. The answer remains visible on screen.",
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32_768;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

export class LiveAvatarSpeechSynthesisProvider
  implements SpeechSynthesisProvider
{
  private readonly avatar: DanielAvatarOutput;
  private readonly fallback: SpeechSynthesisProvider;
  private readonly fetcher: typeof fetch;
  private readonly language: () => string | undefined;
  private activeRequest: AbortController | null = null;
  private sequence = 0;
  private activated = false;

  constructor(options: LiveAvatarSpeechOptions) {
    this.avatar = options.avatar;
    this.fallback = options.fallback;
    this.fetcher =
      options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
    this.language =
      options.language ??
      (() =>
        typeof navigator === "undefined" ? undefined : navigator.language);
  }

  get isSupported() {
    return this.fallback.isSupported;
  }

  get isActivated() {
    return this.activated && (this.fallback.isActivated ?? true);
  }

  async activate() {
    const fallbackActivation =
      this.fallback.activate?.() ?? Promise.resolve(true);
    const avatarConnection = this.avatar.connect();
    const [fallbackReady] = await Promise.all([
      fallbackActivation,
      avatarConnection,
    ]);
    this.activated = fallbackReady;
    return fallbackReady;
  }

  speak(
    text: string,
    guideId: GuideId,
    callbacks: SpeechSynthesisCallbacks,
  ) {
    const normalizedText = text.trim();
    if (!normalizedText) return;

    if (guideId !== "daniel" || !this.avatar.isConnected) {
      if (guideId === "daniel") this.avatar.markFallback();
      this.fallback.speak(normalizedText, guideId, callbacks);
      return;
    }

    this.stopActiveRequest();
    const controller = new AbortController();
    const requestId = this.sequence;
    this.activeRequest = controller;

    void this.generateAndPresent(
      normalizedText,
      callbacks,
      controller,
      requestId,
    );
  }

  async retry() {
    return this.fallback.retry?.() ?? false;
  }

  startListening() {
    this.avatar.startListening();
  }

  stopListening() {
    this.avatar.stopListening();
  }

  setReady() {
    this.avatar.setReady();
  }

  setThinking() {
    this.avatar.setThinking();
  }

  stop() {
    this.stopActiveRequest();
    this.avatar.interrupt();
    this.fallback.stop();
  }

  reset() {
    this.stop();
    this.activated = false;
    this.fallback.reset?.();
    void this.avatar.disconnect();
  }

  private async generateAndPresent(
    text: string,
    callbacks: SpeechSynthesisCallbacks,
    controller: AbortController,
    requestId: number,
  ) {
    try {
      const response = await this.fetcher("/api/liveavatar/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          guideId: "daniel",
          language: this.language(),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `LiveAvatar speech request failed with status ${response.status}.`,
        );
      }

      const audio = await response.arrayBuffer();

      if (
        controller.signal.aborted ||
        requestId !== this.sequence ||
        !audio.byteLength
      ) {
        return;
      }

      callbacks.onProvider?.("liveavatar");
      callbacks.onStart();
      await this.avatar.speakAudio(arrayBufferToBase64(audio));

      if (requestId === this.sequence) callbacks.onEnd();
    } catch (error) {
      if (controller.signal.aborted || requestId !== this.sequence) return;

      console.warn("[liveavatar] Daniel visual speech failed; using audio fallback.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
      try {
        this.avatar.interrupt();
      } catch {
        // A stale avatar must never prevent the current answer's audio fallback.
      }
      this.avatar.markFallback();

      if (this.fallback.isSupported) {
        this.fallback.speak(text, "daniel", callbacks);
      } else {
        callbacks.onError(AVATAR_OUTPUT_ERROR);
      }
    } finally {
      if (this.activeRequest === controller) this.activeRequest = null;
    }
  }

  private stopActiveRequest() {
    this.sequence += 1;
    this.activeRequest?.abort();
    this.activeRequest = null;
  }
}

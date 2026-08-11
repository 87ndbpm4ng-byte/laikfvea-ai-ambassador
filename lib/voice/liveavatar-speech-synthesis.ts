"use client";

import type { LiveAvatarOutput } from "@/lib/liveavatar/liveavatar-types";
import type {
  SpeechSynthesisCallbacks,
  SpeechSynthesisProvider,
  VoiceError,
} from "@/lib/voice/voice-types";
import type { GuideId } from "@/types/guide";
import {
  logVoiceDiagnostic,
  logVoiceDiagnosticError,
} from "@/lib/voice/voice-diagnostics";
import { analyseLiveAvatarPcm } from "@/lib/voice/pcm-audio";
import {
  beginLipSyncMeasurement,
  markLipSyncFallback,
  markLipSyncPcm,
  markStreamingCompleted,
  markStreamingFirstPcmChunk,
  markStreamingProgress,
} from "@/lib/voice/lip-sync-diagnostics";
import { PcmStreamChunker } from "@/lib/voice/pcm-stream-chunker";

type LiveAvatarSpeechOptions = {
  avatar: LiveAvatarOutput;
  fallback: SpeechSynthesisProvider;
  guideId?: GuideId;
  fetcher?: typeof fetch;
  language?: () => string | undefined;
};

function avatarOutputError(guideId: GuideId): VoiceError {
  return {
    code: "synthesis-unavailable",
    message: `${guideId === "daniel" ? "Daniel" : "Emily"}’s visual voice is unavailable. The answer remains visible on screen.`,
  };
}

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
  private readonly avatar: LiveAvatarOutput;
  private readonly fallback: SpeechSynthesisProvider;
  private readonly fetcher: typeof fetch;
  private readonly language: () => string | undefined;
  private readonly guideId: GuideId;
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
    this.guideId = options.guideId ?? "daniel";
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

    if (guideId !== this.guideId) {
      logVoiceDiagnostic("speech-provider-route", {
        guideId,
        selectedProvider: "openai",
        liveAvatarConnected: this.avatar.isConnected,
        mp3FallbackCalled: false,
      });
      this.fallback.speak(normalizedText, guideId, callbacks);
      return;
    }

    this.stopActiveRequest();
    const controller = new AbortController();
    const requestId = this.sequence;
    this.activeRequest = controller;

    void this.connectAndPresent(
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
    const diagnosticId = `${this.guideId}-${requestId}-${Date.now()}`;
    const ttsStartedAt = performance.now();
    beginLipSyncMeasurement(diagnosticId);
    try {
      const response = await this.fetcher("/api/liveavatar/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          guideId: this.guideId,
          language: this.language(),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `LiveAvatar speech request failed with status ${response.status}.`,
        );
      }

      const speechMode = response.headers.get("X-LiveAvatar-Speech-Mode");
      if (
        speechMode === "streaming" &&
        response.body &&
        this.avatar.supportsStreamingAudio
      ) {
        await this.streamToLiveAvatar(
          response,
          diagnosticId,
          callbacks,
          controller,
          requestId,
        );
        return;
      }

      const audio = await response.arrayBuffer();
      const ttsCompletedAt = performance.now();

      if (
        controller.signal.aborted ||
        requestId !== this.sequence ||
        !audio.byteLength
      ) {
        return;
      }

      const analysis = analyseLiveAvatarPcm(audio);
      const upstreamFirstByteMs = Number(
        response.headers.get("X-TTS-First-Byte-Ms"),
      );
      const upstreamCompleteMs = Number(
        response.headers.get("X-TTS-Complete-Ms"),
      );
      markLipSyncPcm(diagnosticId, analysis, {
        ttsLatencyMs: ttsCompletedAt - ttsStartedAt,
        ttsFirstByteMs: Number.isFinite(upstreamFirstByteMs)
          ? upstreamFirstByteMs
          : null,
        ttsCompleteMs: Number.isFinite(upstreamCompleteMs)
          ? upstreamCompleteMs
          : null,
      });

      callbacks.onProvider?.("liveavatar");
      logVoiceDiagnostic("liveavatar-repeat-audio", {
        selectedProvider: "liveavatar",
        liveAvatarConnected: this.avatar.isConnected,
        repeatAudioCalled: true,
      });
      callbacks.onStart();
      await this.avatar.speakAudio(arrayBufferToBase64(audio), {
        diagnosticId,
      });

      if (requestId === this.sequence) callbacks.onEnd();
    } catch (error) {
      if (controller.signal.aborted || requestId !== this.sequence) return;

      console.warn("[liveavatar] Guide visual speech failed; using audio fallback.", {
        guideId: this.guideId,
        name: error instanceof Error ? error.name : "UnknownError",
      });
      logVoiceDiagnosticError("liveavatar-repeat-audio-failed", error);
      try {
        this.avatar.interrupt();
      } catch {
        // A stale avatar must never prevent the current answer's audio fallback.
      }
      this.avatar.markFallback();
      markLipSyncFallback(diagnosticId);

      if (this.fallback.isSupported) {
        logVoiceDiagnostic("speech-provider-route", {
          selectedProvider:
            this.guideId === "daniel" ? "elevenlabs-mp3" : "openai",
          liveAvatarConnected: false,
          mp3FallbackCalled: true,
        });
        this.fallback.speak(text, this.guideId, callbacks);
      } else {
        callbacks.onError(avatarOutputError(this.guideId));
      }
    } finally {
      if (this.activeRequest === controller) this.activeRequest = null;
    }
  }

  private async streamToLiveAvatar(
    response: Response,
    diagnosticId: string,
    callbacks: SpeechSynthesisCallbacks,
    controller: AbortController,
    requestId: number,
  ) {
    const reader = response.body!.getReader();
    const chunker = new PcmStreamChunker();
    const eventId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${this.guideId}-stream-${Date.now()}-${requestId}`;
    let deliveredChunks = 0;
    let deliveredBytes = 0;
    let playbackStarted = false;
    let receivedFirstPcm = false;

    callbacks.onProvider?.("liveavatar");
    const completion = this.avatar.beginAudioStream(eventId, {
      diagnosticId,
      onPlaybackStarted: () => {
        playbackStarted = true;
        callbacks.onStart();
      },
    });
    void completion.catch(() => undefined);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (controller.signal.aborted || requestId !== this.sequence) {
          throw new DOMException("Speech stream aborted.", "AbortError");
        }
        if (done) break;
        if (!receivedFirstPcm) {
          receivedFirstPcm = true;
          markStreamingFirstPcmChunk(diagnosticId);
        }
        for (const chunk of chunker.push(value)) {
          this.avatar.sendAudioChunk(eventId, chunk.pcm);
          deliveredChunks += 1;
          deliveredBytes += chunk.pcm.byteLength;
          markStreamingProgress(
            diagnosticId,
            deliveredChunks,
            deliveredBytes,
          );
        }
      }

      for (const chunk of chunker.flush()) {
        this.avatar.sendAudioChunk(eventId, chunk.pcm);
        deliveredChunks += 1;
        deliveredBytes += chunk.pcm.byteLength;
        markStreamingProgress(diagnosticId, deliveredChunks, deliveredBytes);
      }
      if (!deliveredBytes) throw new Error("ElevenLabs returned empty PCM.");

      this.avatar.endAudioStream(eventId);
      markStreamingCompleted(diagnosticId);
      if (process.env.NODE_ENV === "development") {
        console.info("[liveavatar] Progressive speech delivered.", {
          eventIdSuffix: eventId.slice(-6),
          chunkCount: deliveredChunks,
          averageChunkBytes: Math.round(deliveredBytes / deliveredChunks),
          pcmByteLength: deliveredBytes,
        });
      }
      await completion;
      if (requestId === this.sequence) callbacks.onEnd();
    } catch (error) {
      await reader.cancel().catch(() => undefined);
      this.avatar.interruptAudioStream();
      if (playbackStarted && process.env.NODE_ENV === "development") {
        console.warn("[liveavatar] Partial avatar speech stopped before fallback restart.");
      }
      throw error;
    }
  }

  private async connectAndPresent(
    text: string,
    callbacks: SpeechSynthesisCallbacks,
    controller: AbortController,
    requestId: number,
  ) {
    if (!this.avatar.isConnected) {
      logVoiceDiagnostic("liveavatar-await-connection", {
        selectedProvider: "liveavatar",
        liveAvatarConnected: false,
      });
      let connected = false;
      try {
        connected = await this.avatar.connect();
      } catch (error) {
        logVoiceDiagnosticError("liveavatar-connect-failed", error);
      }

      if (controller.signal.aborted || requestId !== this.sequence) return;

      if (!connected || !this.avatar.isConnected) {
        this.avatar.markFallback();
        logVoiceDiagnostic("speech-provider-route", {
          selectedProvider:
            this.guideId === "daniel" ? "elevenlabs-mp3" : "openai",
          liveAvatarConnected: false,
          mp3FallbackCalled: true,
        });
        this.fallback.speak(text, this.guideId, callbacks);
        if (this.activeRequest === controller) this.activeRequest = null;
        return;
      }
    }

    await this.generateAndPresent(text, callbacks, controller, requestId);
  }

  private stopActiveRequest() {
    this.sequence += 1;
    this.activeRequest?.abort();
    this.activeRequest = null;
    this.avatar.interruptAudioStream();
  }
}

import { BrowserSpeechSynthesisProvider } from "@/lib/voice/browser-speech-synthesis";
import type {
  SpeechSynthesisCallbacks,
  SpeechSynthesisProvider,
  VoiceError,
} from "@/lib/voice/voice-types";
import type { GuideId } from "@/types/guide";

type AudioPlayback = {
  src: string;
  currentTime: number;
  onplay: (() => void) | null;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  error?: {
    code: number;
    message?: string;
  } | null;
  play(): Promise<void>;
  pause(): void;
  load?(): void;
  removeAttribute?(name: string): void;
};

type OpenAISpeechSynthesisOptions = {
  fallback?: SpeechSynthesisProvider;
  fetcher?: typeof fetch;
  createAudio?: () => AudioPlayback;
  createObjectURL?: (blob: Blob) => string;
  revokeObjectURL?: (url: string) => void;
  language?: () => string | undefined;
};

const SILENT_AUDIO_SOURCE =
  "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";

const OUTPUT_ERROR: VoiceError = {
  code: "synthesis-unavailable",
  message:
    "I couldn’t play the spoken response. The answer remains visible on screen.",
};

function isPlaybackBlocked(error: unknown) {
  return error instanceof Error && error.name === "NotAllowedError";
}

export class OpenAISpeechSynthesisProvider
  implements SpeechSynthesisProvider
{
  private readonly fallback: SpeechSynthesisProvider;
  private readonly fetcher: typeof fetch;
  private readonly createAudio: () => AudioPlayback;
  private readonly createObjectURL: (blob: Blob) => string;
  private readonly revokeObjectURL: (url: string) => void;
  private readonly language: () => string | undefined;
  private audio: AudioPlayback | null = null;
  private activeObjectURL: string | null = null;
  private activeRequest: AbortController | null = null;
  private activeCallbacks: SpeechSynthesisCallbacks | null = null;
  private requestSequence = 0;
  private unlocked = false;

  constructor(options: OpenAISpeechSynthesisOptions = {}) {
    this.fallback =
      options.fallback ?? new BrowserSpeechSynthesisProvider();
    this.fetcher = options.fetcher ?? fetch;
    this.createAudio =
      options.createAudio ?? (() => new Audio() as AudioPlayback);
    this.createObjectURL =
      options.createObjectURL ?? ((blob) => URL.createObjectURL(blob));
    this.revokeObjectURL =
      options.revokeObjectURL ?? ((url) => URL.revokeObjectURL(url));
    this.language =
      options.language ??
      (() =>
        typeof navigator === "undefined" ? undefined : navigator.language);
  }

  get isSupported() {
    return (
      (typeof window !== "undefined" &&
        typeof fetch === "function" &&
        "Audio" in window &&
        "URL" in window) ||
      this.fallback.isSupported
    );
  }

  async unlock() {
    if (this.unlocked) {
      return true;
    }

    const audio = this.getAudio();

    try {
      audio.src = SILENT_AUDIO_SOURCE;
      audio.load?.();
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute?.("src");
      audio.load?.();
      this.unlocked = true;
      return true;
    } catch (error) {
      console.warn("[voice-output] Audio unlock was blocked.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
      return false;
    }
  }

  speak(
    text: string,
    guideId: GuideId,
    callbacks: SpeechSynthesisCallbacks,
  ) {
    const normalizedText = text.trim();

    if (!normalizedText) {
      return;
    }

    this.stop();
    const requestId = this.requestSequence;
    const controller = new AbortController();
    this.activeRequest = controller;

    void this.generateAndPlay(
      normalizedText,
      guideId,
      callbacks,
      controller,
      requestId,
    );
  }

  async retry() {
    if (!this.audio || !this.activeObjectURL || !this.activeCallbacks) {
      return false;
    }

    try {
      await this.audio.play();
      return true;
    } catch (error) {
      console.warn("[voice-output] Direct speech retry failed.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
      return false;
    }
  }

  stop() {
    this.requestSequence += 1;
    this.activeRequest?.abort();
    this.activeRequest = null;

    if (this.audio) {
      this.clearAudioHandlers(this.audio);
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    this.activeCallbacks = null;
    this.releaseObjectURL();
    this.fallback.stop();
  }

  private getAudio() {
    if (!this.audio) {
      this.audio = this.createAudio();
    }

    return this.audio;
  }

  private async generateAndPlay(
    text: string,
    guideId: GuideId,
    callbacks: SpeechSynthesisCallbacks,
    controller: AbortController,
    requestId: number,
  ) {
    try {
      const response = await this.fetcher("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          guideId,
          language: this.language(),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Speech request failed with status ${response.status}.`);
      }

      const serverProvider =
        response.headers.get("x-speech-provider") ?? "unknown";
      const blob = await response.blob();

      if (controller.signal.aborted || requestId !== this.requestSequence) {
        return;
      }

      const audio = this.getAudio();
      const objectURL = this.createObjectURL(blob);
      this.activeObjectURL = objectURL;
      this.activeCallbacks = callbacks;
      audio.src = objectURL;
      this.configureAudioHandlers(
        audio,
        guideId,
        callbacks,
        serverProvider,
      );
      audio.load?.();

      try {
        await audio.play();
      } catch (error) {
        if (isPlaybackBlocked(error)) {
          console.warn("[voice-output] Guide speech requires a direct tap.", {
            guideId,
            provider: serverProvider,
          });
          callbacks.onPlaybackBlocked?.();
          return;
        }

        throw error;
      }
    } catch (error) {
      if (controller.signal.aborted || requestId !== this.requestSequence) {
        return;
      }

      this.releaseActivePlayback();
      this.handleFailure(
        text,
        guideId,
        callbacks,
        error instanceof Error ? error.message : "unknown-error",
      );
    } finally {
      if (this.activeRequest === controller) {
        this.activeRequest = null;
      }
    }
  }

  private configureAudioHandlers(
    audio: AudioPlayback,
    guideId: GuideId,
    callbacks: SpeechSynthesisCallbacks,
    serverProvider: string,
  ) {
    this.clearAudioHandlers(audio);
    audio.onplay = () => {
      if (serverProvider === "elevenlabs" || serverProvider === "openai") {
        callbacks.onProvider?.(serverProvider);
      }
      callbacks.onStart();
    };
    audio.onended = () => {
      this.releaseActivePlayback();
      callbacks.onEnd();
    };
    audio.onerror = () => {
      const reason = `media-error-${audio.error?.code ?? "unknown"}`;
      this.releaseActivePlayback();
      this.handleFailure("", guideId, callbacks, reason);
    };
  }

  private clearAudioHandlers(audio: AudioPlayback) {
    audio.onplay = null;
    audio.onended = null;
    audio.onerror = null;
  }

  private releaseActivePlayback() {
    if (this.audio) {
      this.clearAudioHandlers(this.audio);
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.activeCallbacks = null;
    this.releaseObjectURL();
  }

  private handleFailure(
    text: string,
    guideId: GuideId,
    callbacks: SpeechSynthesisCallbacks,
    reason: string,
  ) {
    if (guideId === "daniel") {
      console.error("[voice-output] Daniel speech playback failed.", {
        provider: "elevenlabs",
        reason,
      });
      callbacks.onError(OUTPUT_ERROR);
      return;
    }

    if (!text || !this.fallback.isSupported) {
      callbacks.onError(OUTPUT_ERROR);
      return;
    }

    callbacks.onProvider?.("browser");
    this.fallback.speak(text, guideId, callbacks);
  }

  private releaseObjectURL() {
    if (this.activeObjectURL) {
      this.revokeObjectURL(this.activeObjectURL);
      this.activeObjectURL = null;
    }
  }
}

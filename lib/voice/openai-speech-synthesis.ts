import { BrowserSpeechSynthesisProvider } from "@/lib/voice/browser-speech-synthesis";
import type {
  SpeechPlaybackProvider,
  SpeechSynthesisProvider,
  VoiceError,
} from "@/lib/voice/voice-types";
import type { GuideId } from "@/types/guide";

type AudioPlayback = {
  src: string;
  currentTime: number;
  duration?: number;
  networkState?: number;
  readyState?: number;
  error?: {
    code: number;
    message?: string;
  } | null;
  onplay: (() => void) | null;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  addEventListener?: (event: string, listener: () => void) => void;
  canPlayType?: (type: string) => string;
  play(): Promise<void>;
  pause(): void;
};

type OpenAISpeechSynthesisOptions = {
  fallback?: SpeechSynthesisProvider;
  fetcher?: typeof fetch;
  createAudio?: (source: string) => AudioPlayback;
  createObjectURL?: (blob: Blob) => string;
  revokeObjectURL?: (url: string) => void;
  language?: () => string | undefined;
};

const OUTPUT_ERROR: VoiceError = {
  code: "synthesis-unavailable",
  message:
    "I couldn’t play the spoken response. The answer remains visible on screen.",
};

export class OpenAISpeechSynthesisProvider
  implements SpeechSynthesisProvider
{
  private readonly fallback: SpeechSynthesisProvider;
  private readonly fetcher: typeof fetch;
  private readonly createAudio: (source: string) => AudioPlayback;
  private readonly createObjectURL: (blob: Blob) => string;
  private readonly revokeObjectURL: (url: string) => void;
  private readonly language: () => string | undefined;
  private activeAudio: AudioPlayback | null = null;
  private activeObjectURL: string | null = null;
  private activeRequest: AbortController | null = null;
  private requestSequence = 0;

  constructor(options: OpenAISpeechSynthesisOptions = {}) {
    this.fallback =
      options.fallback ?? new BrowserSpeechSynthesisProvider();
    this.fetcher = options.fetcher ?? fetch;
    this.createAudio =
      options.createAudio ?? ((source) => new Audio(source) as AudioPlayback);
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

  speak(
    text: string,
    guideId: GuideId,
    callbacks: {
      onProvider?: (provider: SpeechPlaybackProvider) => void;
      onStart: () => void;
      onEnd: () => void;
      onError: (error: VoiceError) => void;
    },
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

  stop() {
    this.requestSequence += 1;
    this.activeRequest?.abort();
    this.activeRequest = null;

    if (this.activeAudio) {
      this.activeAudio.onplay = null;
      this.activeAudio.onended = null;
      this.activeAudio.onerror = null;
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }

    this.releaseObjectURL();
    this.fallback.stop();
  }

  private async generateAndPlay(
    text: string,
    guideId: GuideId,
    callbacks: {
      onProvider?: (provider: SpeechPlaybackProvider) => void;
      onStart: () => void;
      onEnd: () => void;
      onError: (error: VoiceError) => void;
    },
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

      if (guideId === "daniel") {
        console.info("[voice-output] Daniel server audio received.", {
          provider: serverProvider,
          responseStatus: response.status,
          contentType: response.headers.get("content-type"),
          blobMimeType: blob.type,
          audioByteLength: blob.size,
          cacheControl: response.headers.get("cache-control"),
        });
      }

      if (controller.signal.aborted || requestId !== this.requestSequence) {
        return;
      }

      const objectURL = this.createObjectURL(blob);
      const audio = this.createAudio(objectURL);
      this.activeObjectURL = objectURL;
      this.activeAudio = audio;

      if (guideId === "daniel") {
        console.info("[voice-output] Daniel audio element created.", {
          objectURL,
          audioSource: audio.src,
          sourceMatchesObjectURL: audio.src === objectURL,
          blobMimeType: blob.type,
          mp3Support: audio.canPlayType?.("audio/mpeg") || "unavailable",
          objectURLActive: this.activeObjectURL === objectURL,
        });

        const mediaEvents = [
          "loadstart",
          "loadedmetadata",
          "canplay",
          "canplaythrough",
          "play",
          "playing",
          "pause",
          "ended",
          "error",
        ];

        for (const mediaEvent of mediaEvents) {
          audio.addEventListener?.(mediaEvent, () => {
            console.info(`[voice-output] Daniel media event: ${mediaEvent}.`, {
              currentTime: audio.currentTime,
              duration: audio.duration,
              readyState: audio.readyState,
              networkState: audio.networkState,
              objectURLActive: this.activeObjectURL === objectURL,
              mediaErrorCode: audio.error?.code ?? null,
              mediaErrorMessage: audio.error?.message ?? null,
            });
          });
        }
      }

      audio.onplay = () => {
        if (serverProvider === "elevenlabs" || serverProvider === "openai") {
          callbacks.onProvider?.(serverProvider);
        }
        if (guideId === "daniel") {
          console.info("[voice-output] Daniel playback started.", {
            playbackSource: serverProvider,
            audioSource: "fresh-object-url",
            audioByteLength: blob.size,
          });
        }
        callbacks.onStart();
      };
      audio.onended = () => {
        this.releaseAudio(audio);
        callbacks.onEnd();
      };
      audio.onerror = () => {
        const mediaErrorCode = audio.error?.code ?? null;
        const mediaErrorMessage = audio.error?.message ?? null;
        console.error("[voice-output] Daniel audio element error.", {
          mediaErrorCode,
          mediaErrorMessage,
          readyState: audio.readyState,
          networkState: audio.networkState,
          objectURLActive: this.activeObjectURL === objectURL,
        });
        this.releaseAudio(audio);
        this.useFallback(
          text,
          guideId,
          callbacks,
          `audio-playback-error code=${mediaErrorCode ?? "none"} message=${
            mediaErrorMessage || "unavailable"
          }`,
        );
      };

      if (guideId === "daniel") {
        console.info("[voice-output] Daniel awaiting audio.play().", {
          objectURLActive: this.activeObjectURL === objectURL,
        });
      }

      try {
        await audio.play();
        if (guideId === "daniel") {
          console.info("[voice-output] Daniel audio.play() fulfilled.", {
            objectURLActive: this.activeObjectURL === objectURL,
          });
        }
      } catch (playbackError) {
        console.error("[voice-output] Daniel audio.play() rejected.", {
          name:
            playbackError instanceof Error
              ? playbackError.name
              : "UnknownError",
          message:
            playbackError instanceof Error
              ? playbackError.message
              : String(playbackError),
          objectURLActive: this.activeObjectURL === objectURL,
          mediaErrorCode: audio.error?.code ?? null,
          mediaErrorMessage: audio.error?.message ?? null,
        });
        throw playbackError;
      }
    } catch (error) {
      if (controller.signal.aborted || requestId !== this.requestSequence) {
        return;
      }

      if (this.activeAudio) {
        this.releaseAudio(this.activeAudio);
      }

      if (process.env.NODE_ENV === "development") {
        console.warn("[voice-output] OpenAI speech unavailable; using fallback.", {
          name: error instanceof Error ? error.name : "UnknownError",
        });
      }
      this.useFallback(
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

  private useFallback(
    text: string,
    guideId: GuideId,
    callbacks: {
      onProvider?: (provider: SpeechPlaybackProvider) => void;
      onStart: () => void;
      onEnd: () => void;
      onError: (error: VoiceError) => void;
    },
    reason: string,
  ) {
    if (guideId === "daniel") {
      console.error("[voice-output] Daniel speech playback failed.", {
        provider: "elevenlabs",
        playbackSource: "none",
        reason,
      });
      callbacks.onError(OUTPUT_ERROR);
      return;
    }

    if (!this.fallback.isSupported) {
      callbacks.onError(OUTPUT_ERROR);
      return;
    }

    callbacks.onProvider?.("browser");
    this.fallback.speak(text, guideId, callbacks);
  }

  private releaseAudio(audio: AudioPlayback) {
    if (this.activeAudio !== audio) {
      return;
    }

    audio.onplay = null;
    audio.onended = null;
    audio.onerror = null;
    this.activeAudio = null;
    this.releaseObjectURL();
  }

  private releaseObjectURL() {
    if (this.activeObjectURL) {
      console.info("[voice-output] Releasing speech object URL.", {
        objectURL: this.activeObjectURL,
      });
      this.revokeObjectURL(this.activeObjectURL);
      this.activeObjectURL = null;
    }
  }
}

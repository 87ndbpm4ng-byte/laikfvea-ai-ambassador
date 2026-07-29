import { BrowserSpeechSynthesisProvider } from "@/lib/voice/browser-speech-synthesis";
import type {
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
      audio.onplay = () => {
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
        this.releaseAudio(audio);
        this.useFallback(text, guideId, callbacks, "audio-playback-error");
      };

      await audio.play();
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
      onStart: () => void;
      onEnd: () => void;
      onError: (error: VoiceError) => void;
    },
    reason: string,
  ) {
    if (guideId === "daniel") {
      console.warn("[voice-output] Daniel using browser fallback.", {
        provider: "browser",
        playbackSource: "browser-speech-synthesis",
        reason,
      });
    }

    if (!this.fallback.isSupported) {
      callbacks.onError(OUTPUT_ERROR);
      return;
    }

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
      this.revokeObjectURL(this.activeObjectURL);
      this.activeObjectURL = null;
    }
  }
}

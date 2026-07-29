import type {
  RecognitionCallbacks,
  SpeechRecognitionProvider,
  VoiceError,
} from "@/lib/voice/voice-types";

type BrowserRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type BrowserRecognitionErrorEvent = {
  error: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: BrowserRecognitionEvent) => void) | null;
  onerror: ((event: BrowserRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type RecognitionConstructor = new () => BrowserSpeechRecognition;

type VoiceWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

function recognitionError(error: string): VoiceError {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return {
      code: "permission-denied",
      message: "Microphone access is blocked. Please allow access and try again.",
    };
  }

  if (error === "no-speech") {
    return {
      code: "recognition-timeout",
      message: "I didn’t hear anything. Tap the microphone and try again.",
    };
  }

  return {
    code: "recognition-failed",
    message: "I couldn’t hear that clearly. Please try again or type your question.",
  };
}

export class BrowserSpeechRecognitionProvider
  implements SpeechRecognitionProvider
{
  private recognition: BrowserSpeechRecognition | null = null;

  get isSupported() {
    if (typeof window === "undefined") {
      return false;
    }

    const voiceWindow = window as VoiceWindow;
    return Boolean(
      voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition,
    );
  }

  start(callbacks: RecognitionCallbacks) {
    if (!this.isSupported) {
      callbacks.onError({
        code: "recognition-unavailable",
        message:
          "Voice input isn’t available in this browser. You can still type your question.",
      });
      return;
    }

    this.abort();

    const voiceWindow = window as VoiceWindow;
    const Recognition =
      voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;

    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      callbacks.onInterimTranscript(interimTranscript.trim());

      if (finalTranscript.trim()) {
        callbacks.onFinalTranscript(finalTranscript.trim());
      }
    };
    recognition.onerror = (event) => callbacks.onError(recognitionError(event.error));
    recognition.onend = callbacks.onEnd;
    this.recognition = recognition;

    try {
      recognition.start();
    } catch {
      callbacks.onError(recognitionError("start-failed"));
    }
  }

  stop() {
    this.recognition?.stop();
  }

  abort() {
    this.recognition?.abort();
    this.recognition = null;
  }
}

import assert from "node:assert/strict";
import test from "node:test";
import { BrowserSpeechRecognitionProvider } from "@/lib/voice/browser-speech-recognition";

function captureRecognitionLocale(locale: string) {
  let createdLocale = "";
  class Recognition {
    continuous = false;
    interimResults = false;
    lang = "";
    maxAlternatives = 1;
    onresult = () => undefined;
    onerror = () => undefined;
    onend = () => undefined;
    start() {
      createdLocale = this.lang;
    }
    abort() {}
  }
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { SpeechRecognition: Recognition },
  });
  try {
    const provider = new BrowserSpeechRecognitionProvider(locale);
    provider.start({
      onInterimTranscript: () => undefined,
      onFinalTranscript: () => undefined,
      onError: () => undefined,
      onEnd: () => undefined,
    });
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
  return createdLocale;
}

test("browser recognition uses the language fixed for the visitor session", () => {
  assert.equal(captureRecognitionLocale("ru-RU"), "ru-RU");
  assert.equal(captureRecognitionLocale("zh-CN"), "zh-CN");
  assert.equal(captureRecognitionLocale("zh-HK"), "zh-HK");
  assert.equal(captureRecognitionLocale("fr-FR"), "fr-FR");
});

test("recognition is created only after the visitor starts Talk", () => {
  let constructorCount = 0;
  class Recognition {
    continuous = false;
    interimResults = false;
    lang = "";
    maxAlternatives = 1;
    onresult = () => undefined;
    onerror = () => undefined;
    onend = () => undefined;
    constructor() {
      constructorCount += 1;
    }
    start() {}
    stop() {}
    abort() {}
  }
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { SpeechRecognition: Recognition },
  });
  try {
    const provider = new BrowserSpeechRecognitionProvider("en-GB");
    assert.equal(provider.isSupported, true);
    assert.equal(constructorCount, 0);
    provider.start({
      onInterimTranscript: () => undefined,
      onFinalTranscript: () => undefined,
      onError: () => undefined,
      onEnd: () => undefined,
    });
    assert.equal(constructorCount, 1);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});

test("permission and microphone hardware failures are classified safely", () => {
  for (const [browserError, expectedCode] of [
    ["not-allowed", "permission-denied"],
    ["service-not-allowed", "permission-denied"],
    ["audio-capture", "microphone-unavailable"],
    ["no-speech", "recognition-timeout"],
    ["network", "recognition-failed"],
  ] as const) {
    let receivedCode = "";
    class Recognition {
      continuous = false;
      interimResults = false;
      lang = "";
      maxAlternatives = 1;
      onresult = () => undefined;
      onerror = (event: { error: string }) => void event;
      onend = () => undefined;
      start() {
        this.onerror({ error: browserError });
      }
      stop() {}
      abort() {}
    }
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { SpeechRecognition: Recognition },
    });
    try {
      new BrowserSpeechRecognitionProvider("en-GB").start({
        onInterimTranscript: () => undefined,
        onFinalTranscript: () => undefined,
        onError: (error) => {
          receivedCode = error.code;
        },
        onEnd: () => undefined,
      });
      assert.equal(receivedCode, expectedCode, browserError);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }
  }
});

test("intentional recognition aborts do not surface an error", () => {
  let errorCount = 0;
  class Recognition {
    continuous = false;
    interimResults = false;
    lang = "";
    maxAlternatives = 1;
    onresult = () => undefined;
    onerror = (event: { error: string }) => void event;
    onend = () => undefined;
    start() {}
    stop() {}
    abort() {
      this.onerror({ error: "aborted" });
    }
  }
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { SpeechRecognition: Recognition },
  });
  try {
    const provider = new BrowserSpeechRecognitionProvider("en-GB");
    provider.start({
      onInterimTranscript: () => undefined,
      onFinalTranscript: () => undefined,
      onError: () => {
        errorCount += 1;
      },
      onEnd: () => undefined,
    });
    provider.abort();
    assert.equal(errorCount, 0);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});

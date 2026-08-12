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

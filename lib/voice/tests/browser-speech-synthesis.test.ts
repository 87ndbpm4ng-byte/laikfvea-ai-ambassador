import assert from "node:assert/strict";
import test from "node:test";
import { selectGuideVoice } from "@/lib/voice/browser-speech-synthesis";

function voice(
  name: string,
  lang = "en-US",
  isDefault = false,
): SpeechSynthesisVoice {
  return {
    default: isDefault,
    lang,
    localService: true,
    name,
    voiceURI: name,
  };
}

test("selects distinct preferred voices for Emily and Daniel", () => {
  const voices = [
    voice("Samantha"),
    voice("Daniel"),
    voice("French Voice", "fr-FR"),
  ];

  assert.equal(selectGuideVoice(voices, "emily")?.name, "Samantha");
  assert.equal(selectGuideVoice(voices, "daniel")?.name, "Daniel");
});

test("prefers an English default when a named guide voice is unavailable", () => {
  const voices = [
    voice("French Voice", "fr-FR"),
    voice("English Default", "en-GB", true),
  ];

  assert.equal(
    selectGuideVoice(voices, "emily")?.name,
    "English Default",
  );
});

test("returns null when the browser exposes no voices", () => {
  assert.equal(selectGuideVoice([], "daniel"), null);
});

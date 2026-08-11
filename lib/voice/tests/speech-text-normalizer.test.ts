import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSpeechText } from "@/lib/voice/speech-text-normalizer";

test("speech normalization removes presentation-only Markdown", () => {
  assert.equal(
    normalizeSpeechText(
      "### Charging\n\n**Important:**\n- Use the supplied cable\n- Do not generate hydrogen while charging",
    ),
    "Charging Important: Use the supplied cable. Do not generate hydrogen while charging.",
  );
});

test("speech normalization preserves wording, units and warnings", () => {
  const text = "Maximum wireless charging power is 5 W.\n\nImportant: do not run hydrogen generation while charging.";
  assert.equal(
    normalizeSpeechText(text),
    "Maximum wireless charging power is 5 W. Important: do not run hydrogen generation while charging.",
  );
});

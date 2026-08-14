import assert from "node:assert/strict";
import test from "node:test";
import { classifyInputSignal, getInputSignalMessage, isAccidentalDuplicateSubmission } from "@/lib/conversation/input-signal";

test("empty and non-linguistic input is rejected locally", () => {
  for (const input of ["", "   ", "???", "!!!", "🎉🎉", "---"]) {
    assert.notEqual(classifyInputSignal(input, false), "valid", input);
  }
});

test("ambiguous short follow-ups require existing context", () => {
  for (const input of ["it", "why?", "это", "为什么", "點解", "pourquoi?"]) {
    assert.equal(classifyInputSignal(input, false), "uninterpretable", input);
    assert.equal(classifyInputSignal(input, true), "valid", input);
  }
});

test("obvious keyboard noise is rejected without blocking real short questions", () => {
  for (const input of ["asdfgh", "123123", "aaaaaa", "qwerty"]) {
    assert.equal(classifyInputSignal(input, false), "uninterpretable", input);
  }
  for (const input of ["GO?", "pH?", "UV?", "PRO?", "安全嗎？"]) {
    assert.equal(classifyInputSignal(input, false), "valid", input);
  }
});

test("low-signal guidance is localized and Cantonese uses Traditional Chinese", () => {
  for (const language of ["en", "ru", "zh", "yue", "fr"] as const) {
    assert.ok(getInputSignalMessage("empty", language).length > 8);
    assert.ok(getInputSignalMessage("uninterpretable", language).length > 8);
  }
  assert.match(getInputSignalMessage("empty", "yue"), /請|問|揀/);
  assert.doesNotMatch(getInputSignalMessage("empty", "yue"), /请|问|选/);
});

test("rapid identical submissions are suppressed without delaying a different intent", () => {
  const previous = { key: "typed::advanced:How does it work?", at: 1_000 };
  assert.equal(isAccidentalDuplicateSubmission(previous, previous.key, 1_100), true);
  assert.equal(isAccidentalDuplicateSubmission(previous, "typed::advanced:How do I clean it?", 1_100), false);
  assert.equal(isAccidentalDuplicateSubmission(previous, previous.key, 1_800), false);
});

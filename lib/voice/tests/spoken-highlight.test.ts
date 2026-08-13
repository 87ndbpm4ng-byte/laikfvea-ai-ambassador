import assert from "node:assert/strict";
import test from "node:test";
import {
  findActiveSpokenSegment,
  getAlignedSegmentStartTimes,
  getSpokenSegmentStartTimes,
  segmentSpokenText,
} from "@/lib/voice/spoken-highlight";
import type { SupportedLanguage } from "@/types/language";

const examples: Array<[SupportedLanguage, string]> = [
  ["en", "Hydrogen water is prepared. The cycle is documented."],
  ["ru", "Вода готовится по инструкции. Цикл документирован."],
  ["zh", "氢水按照说明书制备。操作周期已有记录。"],
  ["yue", "氫水會按照說明書製備。操作週期有清楚記錄。"],
  ["fr", "L’eau hydrogénée est préparée. Le cycle est documenté."],
];

for (const [language, answer] of examples) {
  test(`${language} segmentation preserves the complete answer`, () => {
    const segments = segmentSpokenText(answer, language);
    assert.equal(segments.map(({ text }) => text).join(""), answer);
    assert.ok(segments.length > 1);
    assert.ok(segments.every(({ text, weight }) => text && weight > 0));
  });
}

test("duration-derived sentence progression is monotonic and reaches the end", () => {
  const segments = segmentSpokenText(
    "This is the first sentence. This is the second. This is the third.",
    "en",
  );
  const starts = getSpokenSegmentStartTimes(segments, 8_000);

  assert.equal(starts.length, segments.length);
  assert.equal(starts[0], 0);
  assert.ok(starts.every((start, index) => index === 0 || start > starts[index - 1]));
  assert.ok(starts.at(-1)! < 8_000);
});

test("invalid audio duration disables estimated highlighting", () => {
  const segments = segmentSpokenText("A complete answer remains readable.", "en");
  assert.deepEqual(getSpokenSegmentStartTimes(segments, Number.NaN), []);
  assert.deepEqual(getSpokenSegmentStartTimes(segments, 0), []);
});

test("provider character timestamps select the correct display sentence", () => {
  const answer = "Power is 5 W. Use USB-C twice.";
  const segments = segmentSpokenText(answer, "en");
  const characters = Array.from(answer);
  const starts = getAlignedSegmentStartTimes(answer, segments, {
    characters,
    characterStartTimesSeconds: characters.map((_, index) => index * 0.1),
    characterEndTimesSeconds: characters.map((_, index) => (index + 1) * 0.1),
  });

  assert.equal(segments.map(({ text }) => text).join(""), answer);
  assert.equal(findActiveSpokenSegment(starts, 0), 0);
  assert.equal(findActiveSpokenSegment(starts, 500), 0);
  assert.equal(findActiveSpokenSegment(starts, starts[1]), 1);
  assert.equal(findActiveSpokenSegment(starts, 99_000), segments.length - 1);
});

for (const [language, answer] of examples) {
  test(`${language} aligned sentences map repeated text without search ambiguity`, () => {
    const repeated = `${answer} ${answer}`;
    const characters = Array.from(repeated);
    const segments = segmentSpokenText(repeated, language);
    const starts = getAlignedSegmentStartTimes(repeated, segments, {
      characters,
      characterStartTimesSeconds: characters.map((_, index) => index / 20),
      characterEndTimesSeconds: characters.map((_, index) => (index + 1) / 20),
    });
    assert.equal(starts.length, segments.length);
    assert.ok(starts.every((value, index) => index === 0 || value > starts[index - 1]));
  });
}

test("normalized alignment that changes visible text is rejected", () => {
  const answer = "H₂ reaches 500 ppb.";
  const segments = segmentSpokenText(answer, "en");
  assert.deepEqual(
    getAlignedSegmentStartTimes(answer, segments, {
      characters: Array.from("H2 reaches 500 ppb."),
      characterStartTimesSeconds: [],
      characterEndTimesSeconds: [],
    }),
    [],
  );
});

test("multiline and repeated punctuation preserve the original answer", () => {
  const answer = "Really?! Yes...\nNext line remains intact.  Final sentence!";
  const segments = segmentSpokenText(answer, "en");
  assert.equal(segments.map(({ text }) => text).join(""), answer);
  assert.ok(segments.length >= 3);
});

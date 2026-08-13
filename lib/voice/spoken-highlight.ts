import type { SupportedLanguage } from "@/types/language";
import type { SpeechAlignment } from "@/lib/voice/voice-types";

export type SpokenTextSegment = {
  text: string;
  weight: number;
};

const SEGMENT_LOCALES: Record<SupportedLanguage, string> = {
  en: "en",
  ru: "ru",
  zh: "zh-CN",
  yue: "zh-HK",
  fr: "fr",
};

function segmentWeight(text: string) {
  const visibleLength = Array.from(text.trim()).length;
  const pauseWeight = /[.!?。！？]\s*$/.test(text)
    ? 5
    : /[,;:，；：]\s*$/.test(text)
      ? 2
      : 0;
  return Math.max(1, visibleLength + pauseWeight);
}

/** Groups the answer into complete sentences without changing any text. */
export function segmentSpokenText(
  text: string,
  language: SupportedLanguage,
): SpokenTextSegment[] {
  if (!text) return [];

  const Segmenter = Intl.Segmenter;
  const pieces = Segmenter
    ? Array.from(
        new Segmenter(SEGMENT_LOCALES[language], {
          granularity: "sentence",
        }).segment(text),
        ({ segment }) => segment,
      )
    : text.match(/[^.!?。！？]+[.!?。！？]+(?:\s+|$)|[^.!?。！？]+$/gu) ?? [text];
  return pieces.map((piece) => ({ text: piece, weight: segmentWeight(piece) }));
}

export function getSpokenSegmentStartTimes(
  segments: SpokenTextSegment[],
  durationMs: number,
) {
  if (!segments.length || !Number.isFinite(durationMs) || durationMs <= 0) {
    return [];
  }

  const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0);
  let elapsedWeight = 0;
  return segments.map((segment) => {
    const startMs = (elapsedWeight / totalWeight) * durationMs;
    elapsedWeight += segment.weight;
    return startMs;
  });
}

export function getAlignedSegmentStartTimes(
  text: string,
  segments: SpokenTextSegment[],
  alignment: SpeechAlignment,
) {
  if (alignment.characters.join("") !== text) return [];
  const starts: number[] = [];
  let characterOffset = 0;

  for (const segment of segments) {
    starts.push(
      (alignment.characterStartTimesSeconds[characterOffset] ?? Number.NaN) *
        1_000,
    );
    characterOffset += Array.from(segment.text).length;
  }

  return starts.every(Number.isFinite) ? starts : [];
}

export function findActiveSpokenSegment(starts: number[], currentTimeMs: number) {
  if (!starts.length || currentTimeMs < starts[0]) return -1;
  let activeIndex = 0;
  for (let index = 1; index < starts.length; index += 1) {
    if (currentTimeMs < starts[index]) break;
    activeIndex = index;
  }
  return activeIndex;
}

import assert from "node:assert/strict";
import test from "node:test";
import { selectPendingGuideSpeech } from "@/lib/voice/conversation-speech";
import type {
  ConversationMessage,
  QuestionSubmissionSource,
} from "@/types/conversation";

function guideMessage(id: string, source: QuestionSubmissionSource) {
  return {
    id,
    role: "guide",
    content: `${source} answer`,
    timestamp: "2026-08-11T00:00:00.000Z",
    source,
  } satisfies ConversationMessage;
}

for (const source of ["typed", "voice", "quick-topic"] as const) {
  test(`${source} guide answers reach the shared speech boundary`, () => {
    const message = guideMessage(`guide-${source}`, source);
    assert.equal(selectPendingGuideSpeech([message], null), message);
  });
}

test("Daniel and Emily share the same source-independent speech selection", () => {
  const message = guideMessage("guide-shared", "quick-topic");
  assert.equal(selectPendingGuideSpeech([message], null)?.content, message.content);
});

test("a second Quick Topic is spoken while the previous response is not duplicated", () => {
  const first = guideMessage("guide-first", "quick-topic");
  const second = guideMessage("guide-second", "quick-topic");

  assert.equal(selectPendingGuideSpeech([first], "guide-first"), null);
  assert.equal(
    selectPendingGuideSpeech([first, second], "guide-first"),
    second,
  );
});

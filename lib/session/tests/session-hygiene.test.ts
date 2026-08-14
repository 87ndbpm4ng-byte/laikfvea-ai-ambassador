import assert from "node:assert/strict";
import test from "node:test";
import { MAX_STORED_CONVERSATION_MESSAGES, MAX_STORED_QUESTIONS } from "@/lib/conversation/conversation-limits";
import { SessionManager } from "@/lib/session/session-manager";
import { InMemorySessionStore } from "@/lib/session/session-store";

test("session deletion is idempotent and prevents visitor-context reuse", () => {
  let sequence = 0;
  const manager = new SessionManager({
    store: new InMemorySessionStore(),
    createId: () => `visitor-${++sequence}`,
  });
  const first = manager.createSession();
  manager.recordVisitorMessage(first.sessionId, { content: "Tell me about PRO." });
  assert.equal(manager.deleteSession(first.sessionId), true);
  assert.equal(manager.deleteSession(first.sessionId), false);
  const second = manager.createSession();
  assert.notEqual(second.sessionId, first.sessionId);
  assert.equal(second.activeProduct, null);
  assert.equal(second.conversationHistory.length, 0);
});

test("TTL cleanup removes abandoned sessions but excludes active generation ownership", () => {
  let now = new Date("2026-08-14T10:00:00.000Z");
  let sequence = 0;
  const manager = new SessionManager({
    store: new InMemorySessionStore(),
    clock: () => now,
    createId: () => `ttl-${++sequence}`,
  });
  const abandoned = manager.createSession();
  const generating = manager.createSession();
  now = new Date("2026-08-14T10:11:00.000Z");
  const deleted = manager.deleteExpiredSessions(10 * 60 * 1_000, new Set([generating.sessionId]));
  assert.deepEqual(deleted, [abandoned.sessionId]);
  assert.equal(manager.readSession(abandoned.sessionId), null);
  assert.ok(manager.readSession(generating.sessionId));
});

test("stored kiosk history and question lists remain bounded", () => {
  const manager = new SessionManager({ store: new InMemorySessionStore() });
  const session = manager.createSession();
  for (let index = 0; index < 40; index += 1) {
    manager.recordVisitorMessage(session.sessionId, { content: `Question ${index} about GO` });
    manager.recordAssistantMessage(session.sessionId, { content: `Answer ${index} about GO` });
  }
  const stored = manager.readSession(session.sessionId);
  assert.equal(stored?.conversationHistory.length, MAX_STORED_CONVERSATION_MESSAGES);
  assert.equal(stored?.questionsAsked.length, MAX_STORED_QUESTIONS);
  assert.equal(stored?.questionsAsked.at(-1), "Question 39 about GO");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { SessionManager } from "@/lib/session/session-manager";
import { InMemorySessionStore } from "@/lib/session/session-store";

function createManager() {
  let sequence = 0;

  return new SessionManager({
    store: new InMemorySessionStore(),
    clock: () => new Date("2026-07-29T12:00:00.000Z"),
    createId: () => `context-${++sequence}`,
  });
}

test("charging follow-ups preserve product, topic and previous turn", () => {
  const manager = createManager();
  const session = manager.createSession();

  const charging = manager.recordVisitorMessage(session.sessionId, {
    content: "How do I charge the Advanced Bottle?",
  });
  assert.equal(charging.activeProduct, "advanced");
  assert.equal(charging.activeTopic, "charging");
  assert.equal(charging.currentIntent, "SUPPORT");
  assert.equal(charging.currentConversationStage, "DISCOVERY");

  manager.recordAssistantMessage(session.sessionId, {
    content: "Open the Advanced Bottle rear cover to access the charging port.",
  });
  const duration = manager.recordVisitorMessage(session.sessionId, {
    content: "How long does it take?",
  });
  assert.equal(duration.activeProduct, "advanced");
  assert.equal(duration.activeTopic, "charging");
  assert.equal(duration.lastDiscussedFeature, "duration");
  assert.equal(duration.referenceResolution?.resolvedTo, "Advanced Bottle — charging");
  assert.match(duration.resolvedQuestion ?? "", /active product: Advanced Bottle/);
  assert.match(duration.resolvedQuestion ?? "", /active topic: charging/);
  assert.equal(
    duration.previousAnswer,
    "Open the Advanced Bottle rear cover to access the charging port.",
  );

  manager.recordAssistantMessage(session.sessionId, {
    content: "The available documentation does not state a charging time.",
  });
  const useWhileCharging = manager.recordVisitorMessage(session.sessionId, {
    content: "Can I use it while charging?",
  });
  assert.equal(useWhileCharging.activeProduct, "advanced");
  assert.equal(useWhileCharging.activeTopic, "charging");
  assert.equal(useWhileCharging.referenceResolution?.ambiguous, false);
});

test("comparison context supports both, first, second and other product references", () => {
  const manager = createManager();
  const session = manager.createSession();

  const comparison = manager.recordVisitorMessage(session.sessionId, {
    content: "Compare both bottles.",
  });
  assert.equal(comparison.activeProduct, "both");
  assert.equal(comparison.activeTopic, "comparison");
  assert.deepEqual(comparison.comparisonProducts, ["everyday", "advanced"]);

  manager.recordAssistantMessage(session.sessionId, {
    content: "The Everyday Bottle is the option being discussed for travelling.",
  });
  const travel = manager.recordVisitorMessage(session.sessionId, {
    content: "Which one is better for travelling?",
  });
  assert.equal(travel.activeProduct, "everyday");
  assert.equal(travel.activeTopic, "comparison");
  assert.equal(travel.lastDiscussedFeature, "portability");
  assert.equal(
    travel.referenceResolution?.resolvedTo,
    "Everyday Bottle — comparison",
  );
  assert.match(travel.resolvedQuestion ?? "", /active topic: comparison/);

  manager.recordAssistantMessage(session.sessionId, {
    content: "The Everyday Bottle is the current travel option.",
  });
  const inhalation = manager.recordVisitorMessage(session.sessionId, {
    content: "Does it also support inhalation?",
  });
  assert.equal(inhalation.activeProduct, "everyday");
  assert.equal(inhalation.activeTopic, "hydrogen-inhalation");
  assert.equal(inhalation.referenceResolution?.ambiguous, false);

  const second = manager.recordVisitorMessage(session.sessionId, {
    content: "What about the second one?",
  });
  assert.equal(second.activeProduct, "advanced");

  const other = manager.recordVisitorMessage(session.sessionId, {
    content: "And the other one?",
  });
  assert.equal(other.activeProduct, "everyday");
});

test("hydrogen inhalation remains the referent for safety and frequency follow-ups", () => {
  const manager = createManager();
  const session = manager.createSession();

  const introduction = manager.recordVisitorMessage(session.sessionId, {
    content: "Explain hydrogen inhalation.",
  });
  assert.equal(introduction.activeTopic, "hydrogen-inhalation");
  assert.equal(introduction.currentIntent, "TECHNOLOGY");

  manager.recordAssistantMessage(session.sessionId, {
    content: "Hydrogen inhalation uses the supplied inhalation adapter and tube.",
  });
  const safety = manager.recordVisitorMessage(session.sessionId, {
    content: "Is it safe?",
  });
  assert.equal(safety.activeTopic, "hydrogen-inhalation");
  assert.equal(safety.lastDiscussedFeature, "safety");
  assert.equal(safety.referenceResolution?.resolvedTo, "hydrogen inhalation");

  manager.recordAssistantMessage(session.sessionId, {
    content: "The documentation does not provide enough safety information.",
  });
  const frequency = manager.recordVisitorMessage(session.sessionId, {
    content: "Can I do it every day?",
  });
  assert.equal(frequency.activeTopic, "hydrogen-inhalation");
  assert.equal(frequency.lastDiscussedFeature, "frequency");
  assert.equal(frequency.referenceResolution?.ambiguous, false);
});

test("an unresolved pronoun is marked ambiguous instead of guessed", () => {
  const manager = createManager();
  const session = manager.createSession();
  const result = manager.recordVisitorMessage(session.sessionId, {
    content: "Is it safe?",
  });

  assert.equal(result.referenceResolution?.ambiguous, true);
  assert.equal(result.referenceResolution?.resolvedTo, null);
  assert.match(result.resolvedQuestion ?? "", /requires a brief clarification/);
});

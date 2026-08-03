import assert from "node:assert/strict";
import test from "node:test";
import { presentationManager } from "@/lib/presentation/presentation-manager";
import type { ConversationMessage } from "@/types/conversation";

function message(
  content: string,
  role: "visitor" | "guide" = "visitor",
  relatedProduct?: "everyday" | "advanced",
): ConversationMessage {
  return {
    id: `${role}-${content}`,
    role,
    content,
    timestamp: "2026-08-03T00:00:00.000Z",
    relatedProduct,
  };
}

test("matches the requested concept with specific topics before products", () => {
  const visual = presentationManager.resolve({ messages: [
    message("How do I charge the Advanced Bottle?"),
    message("Open the charging cover.", "guide", "advanced"),
  ] });

  assert.deepEqual(visual, { type: "feature", asset: "charging" });
});

test("connects every supported presenter subject", () => {
  const cases = [
    ["Compare both bottles", "comparison"],
    ["How should I clean it?", "maintenance"],
    ["Explain hydrogen inhalation", "inhalation"],
    ["Which premium materials are used?", "materials"],
    ["How does electrolysis work?", "electrolysis"],
    ["What is hydrogen water?", "hydrogen"],
    ["Show me the Everyday Bottle", "everyday-bottle"],
    ["Show me the Advanced Bottle", "advanced-bottle"],
  ] as const;

  for (const [question, expected] of cases) {
    const expectedAssets = {
      comparison: "go-vs-pro",
      maintenance: "maintenance",
      inhalation: "hydrogen-inhalation",
      materials: "premium-materials",
      electrolysis: "hydrogen-process",
      hydrogen: "hydrogen-water",
      "everyday-bottle": "go-bottle",
      "advanced-bottle": "pro-bottle",
    } as const;
    assert.equal(
      presentationManager.resolve({ messages: [message(question)] })?.asset,
      expectedAssets[expected],
    );
  }
});

test("supports the extended infographic and feature registry", () => {
  assert.deepEqual(
    presentationManager.resolve({ messages: [message("Explain oxidative stress")] }),
    { type: "infographic", asset: "oxidative-stress" },
  );
  assert.deepEqual(
    presentationManager.resolve({ messages: [message("How does mineralisation work?")] }),
    { type: "feature", asset: "mineralisation" },
  );
});

test("uses related product metadata when the latest turn has no keyword", () => {
  assert.equal(
    presentationManager.resolve({ messages: [
      message("Tell me more"),
      message("Here is the documented overview.", "guide", "everyday"),
    ] })?.asset,
    "go-bottle",
  );
});

test("only considers the latest turn so an old visual does not remain", () => {
  const visual = presentationManager.resolve({ messages: [
    message("Show me the Advanced Bottle"),
    message("Here is the overview.", "guide", "advanced"),
    message("Thank you"),
    message("You are welcome.", "guide"),
  ] });

  assert.equal(visual, null);
});

test("unknown topics and an empty conversation return no presentation", () => {
  assert.equal(
    presentationManager.resolve({ messages: [message("Tell me about the exhibition")] }),
    null,
  );
  assert.equal(presentationManager.resolve({ messages: [] }), null);
});

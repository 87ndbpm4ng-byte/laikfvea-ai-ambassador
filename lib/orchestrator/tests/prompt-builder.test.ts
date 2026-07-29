import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { VISITOR_ANSWER_RULES } from "@/lib/ai/visitor-answer-rules";

const questions = [
  {
    message: "How do I charge the Advanced Bottle?",
    passage:
      "Open the rear cover to access the Type-C charging port. Use the supplied cable and adapter. Do not run hydrogen generation while charging.",
  },
  {
    message: "How do I clean it?",
    passage:
      "Clean the bottle and lid using a slightly damp cloth moistened with water. Do not allow moisture to enter the charging port.",
  },
  {
    message: "What should I do if the battery is low?",
    passage:
      'When the battery level drops below 10%, the screen will show a "Low Battery" warning.',
  },
  {
    message: "Compare the Everyday Bottle and Advanced Bottle.",
    passage:
      "The supplied approved information describes charging for the Advanced Bottle only.",
  },
] as const;

test("system prompt makes retrieved knowledge the sole product-fact source", async () => {
  const prompt = await readFile(
    path.join(process.cwd(), "lib/ai/system-prompt.ts"),
    "utf8",
  );

  assert.match(
    prompt,
    /sole factual source for product-specific answers/i,
  );
  assert.match(prompt, /preserve the exact meaning/i);
  assert.match(prompt, /never expose Markdown syntax/i);
  assert.doesNotMatch(prompt, /baseline approved product information/i);
});

test("prompt builder applies natural visitor-answer rules to supported questions", () => {
  const rules = VISITOR_ANSWER_RULES.join("\n");

  for (const question of questions) {
    const rendered = `${rules}\nVisitor message: ${question.message}\n${question.passage}`;

    assert.match(rendered, /VISITOR ANSWER STYLE/);
    assert.match(rendered, /Rewrite source material into concise, natural/);
    assert.match(rendered, /plain-text numbered list only when order matters/);
    assert.match(rendered, /plain 'Important:' label at the end/);
    assert.match(rendered, /Ask no more than one concise follow-up question/);
    assert.match(rendered, /Persona changes tone only/);
    assert.match(rendered, new RegExp(question.message.replace(/[?.]/g, "\\$&")));
  }
});

test("comparison instructions forbid filling an unsupported product side", () => {
  const rendered = VISITOR_ANSWER_RULES.join("\n");

  assert.match(
    rendered,
    /compare only attributes supported for each product/i,
  );
  assert.match(
    rendered,
    /say when the approved context does not support one side/i,
  );
});

test("prompt builder source includes private session context and ambiguity rules", async () => {
  const promptBuilder = await readFile(
    path.join(process.cwd(), "lib/orchestrator/prompt-builder.ts"),
    "utf8",
  );

  assert.match(promptBuilder, /CURRENT SESSION CONTEXT/);
  assert.match(promptBuilder, /Active product:/);
  assert.match(promptBuilder, /Active topic:/);
  assert.match(promptBuilder, /Previous visitor question:/);
  assert.match(promptBuilder, /Previous guide answer:/);
  assert.match(promptBuilder, /reference resolution is marked ambiguous/i);
  assert.match(promptBuilder, /Never mention session state/i);
});

test("prompt builder carries source authority without exposing it", async () => {
  const promptBuilder = await readFile(
    path.join(process.cwd(), "lib/orchestrator/prompt-builder.ts"),
    "utf8",
  );

  assert.match(promptBuilder, /Source priority:/);
  assert.match(promptBuilder, /highest source priority/i);
  assert.match(promptBuilder, /Do not blend conflicting values/i);
  assert.match(promptBuilder, /equal source priority/i);
  assert.match(promptBuilder, /Never mention retrieval.*source priority/i);
});

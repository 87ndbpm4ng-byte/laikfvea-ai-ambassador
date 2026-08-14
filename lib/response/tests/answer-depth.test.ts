import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classifyAnswerDepth,
  responseLengthForDepth,
} from "@/lib/response/answer-depth";
import { ResponseEngine } from "@/lib/response/response-engine";
import type { ResponseContext } from "@/lib/response/response-context";
import type { ResponseEvaluation } from "@/lib/response/response-types";

test("narrow exhibition facts select quick answers", () => {
  const questions = [
    ["What is GO's capacity?", "en"],
    ["How long is the GO cycle?", "en"],
    ["How long are PRO's modes?", "en"],
    ["How long is the Face & Body spray cycle?", "en"],
    ["What area does the Air Purifier cover?", "en"],
    ["How often is its pre-filter replaced?", "en"],
    ["What pH does the Water Ionizer produce?", "en"],
    ["What is the Mineralizer dilution?", "en"],
  ] as const;

  for (const [question, language] of questions) {
    assert.equal(classifyAnswerDepth(question, language), "quick", question);
  }
});

test("ordinary introductions and operation questions select standard answers", () => {
  for (const product of [
    "GO",
    "PRO",
    "the Water Ionizer",
    "the Face & Body Generator",
    "the Water Mineralizer",
    "the Air Purifier",
  ]) {
    assert.equal(classifyAnswerDepth(`Tell me about ${product}.`, "en"), "standard");
    assert.equal(classifyAnswerDepth(`How does ${product} work?`, "en"), "standard");
  }

  assert.equal(classifyAnswerDepth("What is the Water Mineralizer?", "en"), "standard");
});

test("explicit detail, complete instructions and comparisons select detailed answers", () => {
  const questions = [
    "Tell me more about PRO.",
    "Explain how to use the Water Ionizer step by step.",
    "Give me detailed specifications for the Air Purifier.",
    "Compare GO and PRO.",
  ];

  for (const question of questions) {
    assert.equal(classifyAnswerDepth(question, "en"), "detailed", question);
  }
});

test("unsupported narrow facts stay quick while health attacks do not gain detailed mode", () => {
  for (const question of [
    "What is the Water Ionizer flow rate?",
    "How long is the Face & Body Generator battery runtime?",
    "What is the Air Purifier CADR?",
    "What is the Mineralizer final pH?",
  ]) {
    assert.equal(classifyAnswerDepth(question, "en"), "quick", question);
  }

  for (const question of [
    "Can this cure disease?",
    "Which product is healthiest?",
    "Does it prevent thrombosis?",
  ]) {
    assert.equal(classifyAnswerDepth(question, "en"), "standard", question);
  }
});

test("quick, standard and detailed intent has five-language parity", () => {
  const examples = {
    en: ["How long does it take?", "Tell me about it.", "Explain it in detail."],
    ru: ["Сколько времени это занимает?", "Расскажите об этом.", "Расскажите подробнее."],
    zh: ["需要多久？", "请介绍一下。", "请详细解释。"],
    yue: ["要幾耐？", "介紹下佢。", "請詳細講解。"],
    fr: ["Combien de temps faut-il ?", "Présentez-le-moi.", "Plus de détails, s’il vous plaît."],
  } as const;

  for (const [language, questions] of Object.entries(examples)) {
    assert.deepEqual(
      questions.map((question) => classifyAnswerDepth(question, language as keyof typeof examples)),
      ["quick", "standard", "detailed"],
      language,
    );
  }
});

test("depth maps to the existing provider-independent response lengths", () => {
  assert.equal(responseLengthForDepth("quick"), "concise");
  assert.equal(responseLengthForDepth("standard"), "standard");
  assert.equal(responseLengthForDepth("detailed"), "detailed");
});

test("the response engine applies depth to the current visitor question", () => {
  const engine = new ResponseEngine();
  const evaluation: ResponseEvaluation = {
    stage: "LEARNING",
    intent: "TECHNOLOGY",
    goal: "EDUCATE",
    profile: "technical",
    hasPriorConversation: true,
    hasDiscussedTopics: true,
    hasViewedProducts: true,
  };
  const context = (question: string) => ({
    session: { previousQuestion: question, language: "en" },
  }) as unknown as ResponseContext;

  assert.equal(engine.determineLength(context("What is the capacity?"), evaluation), "concise");
  assert.equal(engine.determineLength(context("Tell me about the Air Purifier."), evaluation), "standard");
  assert.equal(engine.determineLength(context("Explain it in detail."), evaluation), "detailed");
});

import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import { createRetrievalQuery, shouldRunRetrieval } from "@/lib/retrieval/retrieval-query";
import type { VisitorSession } from "@/lib/session/session-types";

function session(overrides: Partial<VisitorSession> = {}): VisitorSession {
  return {
    sessionId: "exhibition-routing",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastInteraction: "2026-01-01T00:00:00.000Z",
    status: "active",
    currentConversationStage: "DISCOVERY",
    currentIntent: "SUPPORT",
    activeProduct: "advanced",
    activeTopic: null,
    lastDiscussedFeature: null,
    language: "en",
    discussedTopics: [],
    viewedProducts: ["advanced"],
    questionsAsked: [],
    visitorGoals: [],
    conversationHistory: [],
    completedConversation: false,
    endedAt: null,
    ...overrides,
  };
}

const engine = new RetrievalEngine(
  new ApprovedKnowledgeLoader(path.join(process.cwd(), "knowledge")),
);

const documentedCases: Array<[string, RegExp]> = [
  ["What comes in the box?", /Package contents/i],
  ["What are the electrodes made from?", /Technical specifications/i],
  ["What membrane does it use?", /Technical specifications/i],
  ["What's the hydrogen concentration?", /Technical specifications|Hydrogen water preparation/i],
  ["How long is one cycle?", /Hydrogen water preparation/i],
  ["Does it use USB-C?", /Charging/i],
  ["Can I use a fast charger?", /Safety instructions|Charging/i],
  ["Can I use hot water?", /Operating recommendations|Safety instructions/i],
  ["Can I use sparkling water?", /Safety instructions/i],
  ["Can I run another cycle?", /Operating recommendations/i],
  ["Should I drink it immediately?", /Operating recommendations/i],
  ["How long can I store the water?", /Operating recommendations/i],
  ["What do I do before first use?", /Initial setup/i],
  ["Can I rinse it under running water?", /Maintenance/i],
  ["How should I store it for months?", /Operating recommendations/i],
  ["What's the capacity?", /Technical specifications/i],
  ["What is the body made from?", /Technical specifications/i],
  ["How much does the mineral cartridge hold?", /Alkaline ionized water preparation/i],
  ["What power is wireless charging?", /Charging/i],
];

for (const [question, expectedHeading] of documentedCases) {
  test(`routes documented exhibition wording: ${question}`, async () => {
    const visitorSession = session();
    assert.equal(shouldRunRetrieval(question, "en", visitorSession), true);
    const result = await engine.search(
      createRetrievalQuery({ message: question, session: visitorSession }),
    );
    assert.equal(result.insufficientKnowledge, false);
    assert.ok(
      result.matchedChunks.some(({ chunk }) => expectedHeading.test(chunk.heading)),
      `${question}: ${result.matchedChunks.map(({ chunk }) => chunk.heading).join(", ")}`,
    );
  });
}

test("routes equivalent English, Russian and Chinese package questions to one source", async () => {
  const cases = [
    ["What comes in the box?", "en"],
    ["Что входит в комплект?", "ru"],
    ["包装里有什么？", "zh"],
  ] as const;
  const results = await Promise.all(cases.map(async ([message, language]) => {
    const visitorSession = session({ language });
    assert.equal(shouldRunRetrieval(message, language, visitorSession), true);
    return engine.search(createRetrievalQuery({ message, session: visitorSession }));
  }));
  for (const result of results) {
    assert.equal(result.matchedChunks[0]?.chunk.heading, "Package contents");
  }
  assert.equal(new Set(results.map((result) => result.sourceReferences[0])).size, 1);
});

test("Cantonese exhibition wording retrieves documented facts", async () => {
  const cases: Array<[string, RegExp]> = [
    ["盒入面有啲咩？", /Package contents/i],
    ["充電嗰陣可唔可以產生氫氣？", /Charging/i],
    ["吸入氫氣功能係點用？", /inhalation/i],
    ["個樽容量係幾多？", /Technical specifications/i],
    ["個樽係用咩物料造㗎？", /Technical specifications/i],
    ["可唔可以用有氣水？", /Safety instructions/i],
    ["個樽要點樣清潔？", /Maintenance|Initial setup/i],
  ];
  for (const [message, heading] of cases) {
    const visitorSession = session({ language: "yue" });
    assert.equal(shouldRunRetrieval(message, "yue", visitorSession), true);
    const result = await engine.search(
      createRetrievalQuery({ message, session: visitorSession }),
    );
    assert.equal(result.insufficientKnowledge, false, message);
    assert.ok(
      result.matchedChunks.some(({ chunk }) => heading.test(chunk.heading)),
      message,
    );
  }
});

test("generic conversational messages remain retrieval-free", () => {
  const visitorSession = session();
  for (const message of ["hello", "thank you", "that's interesting", "what do you mean?", "okay"]) {
    assert.equal(shouldRunRetrieval(message, "en", visitorSession), false);
  }
});

test("ambiguous follow-ups require established session context", () => {
  assert.equal(shouldRunRetrieval("What power?", "en", session()), false);
  assert.equal(
    shouldRunRetrieval(
      "What power?",
      "en",
      session({
        activeTopic: "charging",
        conversationHistory: [{
          messageId: "prior",
          role: "visitor",
          content: "Does it support wireless charging?",
          timestamp: "2026-01-01T00:00:00.000Z",
          conversationStage: "DISCOVERY",
          intent: "SUPPORT",
        }],
      }),
    ),
    true,
  );
});

test("true knowledge gaps have no passage that states the missing fact", async () => {
  for (const question of [
    "How long does a full battery last?",
    "How long does charging take?",
    "Can pregnant people use it?",
    "Is it safe for children?",
    "What warranty do you offer?",
    "Where is the company based?",
    "Which model is better for the gym?",
  ]) {
    const visitorSession = session();
    const result = await engine.search(
      createRetrievalQuery({ message: question, session: visitorSession }),
    );
    const retrievedText = result.matchedChunks
      .map(({ chunk }) => chunk.text)
      .join("\n")
      .toLocaleLowerCase("en");
    const forbiddenAnswerPatterns: Record<string, RegExp> = {
      "How long does a full battery last?": /(?:battery lasts?|runtime)\s+\d/i,
      "How long does charging take?": /(?:charging takes?|charge time)\s+\d/i,
      "Can pregnant people use it?": /pregnan/i,
      "Is it safe for children?": /children|child use/i,
      "What warranty do you offer?": /warranty/i,
      "Where is the company based?": /company (?:is )?based|headquarters/i,
      "Which model is better for the gym?": /gym/i,
    };
    assert.doesNotMatch(retrievedText, forbiddenAnswerPatterns[question], question);
  }
});

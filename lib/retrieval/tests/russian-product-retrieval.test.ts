import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { getProductQuickQuestions } from "@/lib/data/quick-questions";
import { createRetrievalQuery } from "@/lib/retrieval/retrieval-query";
import { RetrievalEngine } from "@/lib/retrieval/retrieval-engine";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import type { ProductId } from "@/types/product";
import type { VisitorSession } from "@/lib/session/session-types";

const loader = new ApprovedKnowledgeLoader(path.join(process.cwd(), "knowledge"));
const engine = new RetrievalEngine(loader);

function session(product: ProductId, language: VisitorSession["language"]): VisitorSession {
  return {
    sessionId: "russian-product-retrieval-test",
    createdAt: "2026-10-05T00:00:00.000Z",
    lastInteraction: "2026-10-05T00:00:00.000Z",
    status: "active",
    currentConversationStage: "DISCOVERY",
    currentIntent: "SUPPORT",
    language,
    activeProduct: product,
    viewedProducts: [product],
    discussedTopics: [],
    questionsAsked: [],
    visitorGoals: [],
    conversationHistory: [],
    completedConversation: false,
    endedAt: null,
  };
}

async function retrieve(product: ProductId, language: VisitorSession["language"], message: string) {
  const query = createRetrievalQuery({ message, session: session(product, language) });
  return { query, result: await engine.search(query) };
}

function assertGroundedProductResult(
  product: ProductId,
  question: string,
  result: Awaited<ReturnType<typeof retrieve>>["result"],
  heading: RegExp,
) {
  assert.equal(result.insufficientKnowledge, false, question);
  assert.ok(result.matchedChunks.some(({ chunk }) => heading.test(chunk.heading)), question);
  assert.ok(
    result.matchedChunks.every(({ chunk }) => chunk.product === product),
    question,
  );
}

test("all Russian product Quick Questions retrieve their own approved evidence", async () => {
  const cases: Array<[ProductId, readonly RegExp[]]> = [
    ["air-purifier", [/air path|identity/i, /operating modes/i, /technical specifications|placement/i, /pre-filter replacement/i]],
    ["water-ionizer", [/operating principle/i, /water types/i, /preparing|pH and ORP/i, /cleaning/i]],
    ["advanced", [/hydrogen water preparation/i, /hydrogen water preparation/i, /inhalation/i, /hydrogen water preparation|maintenance/i]],
    ["everyday", [/hydrogen water preparation|identity/i, /hydrogen water preparation/i, /technical specifications/i, /cleaning/i]],
    ["air-humidifier", [/identity|operating instructions/i, /operating modes/i, /water and essential oils|identity/i, /cleaning/i]],
    ["face-body-generator", [/operating principle/i, /operating procedure/i, /operating procedure/i, /cleaning/i]],
  ];

  for (const [product, headings] of cases) {
    const questions = getProductQuickQuestions(product, "ru");
    assert.equal(questions.length, headings.length, product);

    for (const [index, question] of questions.entries()) {
      const { query, result } = await retrieve(product, "ru", question.label);
      assert.equal(query.activeProduct, product, question.label);
      assertGroundedProductResult(product, question.label, result, headings[index]);
    }
  }
});

test("representative free-form Russian questions retain canonical product evidence", async () => {
  const cases: Array<[ProductId, string, RegExp]> = [
    ["air-purifier", "Расскажите, как устроен очиститель воздуха.", /air path|identity/i],
    ["water-ionizer", "Объясните принцип работы ионизатора воды.", /operating principle/i],
    ["advanced", "Объясните, как устроен PRO.", /hydrogen water preparation/i],
    ["advanced", "Как чистить PRO?", /maintenance|cleaning/i],
    ["everyday", "Объясните, как устроен GO.", /hydrogen water preparation|identity/i],
    ["everyday", "Как заряжать GO?", /charging/i],
    ["air-humidifier", "Расскажите, как устроен увлажнитель воздуха.", /identity|operating instructions/i],
    ["air-humidifier", "Какой объём резервуара у увлажнителя воздуха?", /technology and specification/i],
    ["air-humidifier", "Можно ли добавлять эфирные масла в увлажнитель воздуха?", /water and essential oils/i],
    ["face-body-generator", "Объясните принцип работы генератора для лица и тела.", /operating principle/i],
    ["face-body-generator", "Как заряжать генератор для лица и тела?", /charging/i],
  ];

  for (const [product, question, heading] of cases) {
    const { query, result } = await retrieve(product, "ru", question);
    assert.equal(query.activeProduct, product, question);
    assertGroundedProductResult(product, question, result, heading);
  }
});

test("Russian Air Purifier questions can use the native Capsula manual at manual priority", async () => {
  const cases: Array<[string, RegExp]> = [
    ["Как работает очиститель воздуха?", /air path|product identity|техника безопасности/i],
    ["Какие режимы работы есть у очистителя воздуха?", /operating modes|режимы работы/i],
    ["Для помещения какой площади предназначен очиститель воздуха?", /technical specifications|room coverage|технические характеристики/i],
    ["Когда нужно менять предварительный фильтр очистителя воздуха?", /pre-filter replacement|предварительного фильтра/i],
    ["Как заменить предварительный фильтр?", /pre-filter replacement|замена и сброс/i],
    ["Как сбросить ресурс предварительного фильтра?", /pre-filter replacement|сброс/i],
    ["Что такое ночной режим?", /operating modes|режимы работы/i],
    ["Что такое дневной режим?", /operating modes|режимы работы/i],
    ["Что такое Boost mode?", /operating modes|режимы работы/i],
    ["Как настроить расписание?", /app and connectivity|Capsula Link|расписание/i],
    ["Как подключить очиститель воздуха к приложению?", /app and connectivity|Capsula Link|подключить/i],
    ["Как чистить очиститель воздуха?", /cleaning and maintenance|очистка и обслуживание/i],
    ["Что означают индикаторы?", /indicators and troubleshooting|индикаторы/i],
    ["Какой уровень шума?", /technical specifications|технические характеристики/i],
    ["Какое энергопотребление?", /technical specifications|технические характеристики/i],
    ["Расскажите, как пользоваться Capsula M Size.", /getting started|подготовка|Capsula M Size/i],
  ];

  for (const [question, heading] of cases) {
    const { query, result } = await retrieve("air-purifier", "ru", question);
    assert.equal(query.activeProduct, "air-purifier", question);
    assert.equal(result.insufficientKnowledge, false, question);
    assert.ok(result.matchedChunks.some(({ chunk }) => chunk.sourceId === "AIR-PURIFIER-RU-MANUAL-001"), question);
    assert.ok(result.matchedChunks.some(({ chunk }) => heading.test(chunk.heading)), question);
    assert.ok(result.matchedChunks.every(({ chunk }) => chunk.product === "air-purifier"), question);
    assert.ok(result.matchedChunks.every(({ chunk }) => chunk.sourcePriority >= 400), question);
  }
});

test("French, Simplified Chinese, and Cantonese retain representative product routing", async () => {
  for (const language of ["fr", "zh", "yue"] as const) {
    const question = getProductQuickQuestions("air-purifier", language)[0];
    const { query, result } = await retrieve("air-purifier", language, question.label);
    assert.equal(query.activeProduct, "air-purifier", `${language}: ${question.label}`);
    assertGroundedProductResult(
      "air-purifier",
      `${language}: ${question.label}`,
      result,
      /air purifier user manual|air path|identity/i,
    );
  }
});

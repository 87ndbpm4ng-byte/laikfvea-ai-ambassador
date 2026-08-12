import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createKnowledgeQueryText } from "@/lib/i18n/knowledge-query";
import {
  getLanguageConfiguration,
  isSupportedLanguage,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n/languages";
import { getUiCopy } from "@/lib/i18n/ui-copy";

test("English, Russian and Simplified Chinese are offered as functional languages", () => {
  assert.deepEqual(SUPPORTED_LANGUAGES.map(({ code }) => code), ["en", "ru", "zh"]);
  assert.equal(isSupportedLanguage("en"), true);
  assert.equal(isSupportedLanguage("ru"), true);
  assert.equal(isSupportedLanguage("zh"), true);
  assert.equal(isSupportedLanguage("es"), false);
});

test("language configuration provides stable recognition locales", () => {
  assert.equal(getLanguageConfiguration("en").speechRecognitionLocale, "en-GB");
  assert.equal(getLanguageConfiguration("ru").speechRecognitionLocale, "ru-RU");
  assert.equal(getLanguageConfiguration("zh").speechRecognitionLocale, "zh-CN");
  assert.equal(getLanguageConfiguration("zh").nativeName, "中文（简体）");
});

test("Simplified Chinese visitor copy and Quick Topics are localized", () => {
  const copy = getUiCopy("zh");
  assert.equal(copy.specialistsHeading, "认识您的 AI 专家");
  assert.equal(copy.speakWith("Daniel"), "与 Daniel 交流");
  assert.equal(copy.conversationWith("Emily"), "与 Emily 对话");
  assert.equal(copy.askQuestion("Daniel"), "向 Daniel 提问");
  assert.equal(copy.quickTopics, "快捷问题");
  assert.equal(copy.talk, "开始说话");
  assert.equal(copy.endSession, "结束对话");
  assert.match(copy.topics.daniel["hydrogen-water-overview"].question, /氢水/);
  assert.match(copy.topics.emily["product-guidance"].question, /日常使用/);
});

test("Russian visitor copy and Quick Topics are localized", () => {
  const copy = getUiCopy("ru");
  assert.equal(copy.specialistsHeading, "Познакомьтесь с AI-специалистами");
  assert.equal(copy.talk, "Говорить");
  assert.equal(copy.endSession, "Завершить разговор");
  assert.equal(copy.speakWith("Daniel"), "Поговорить с Дэниелом");
  assert.equal(copy.conversationWith("Daniel"), "Разговор с Дэниелом");
  assert.equal(copy.askQuestion("Daniel"), "Задайте вопрос Дэниелу");
  assert.equal(copy.speakWith("Emily"), "Поговорить с Эмили");
  assert.equal(copy.readyFor("Daniel"), "Готов к разговору");
  assert.equal(copy.readyFor("Emily"), "Готова к разговору");
  assert.equal(copy.voiceReadyFor("Daniel"), "Готов");
  assert.equal(copy.voiceReadyFor("Emily"), "Готова");
  assert.equal(copy.quickTopics, "Быстрые вопросы");
  assert.match(copy.topics.daniel["hydrogen-water-overview"].question, /водород/i);
});

test("English interface copy remains unchanged", () => {
  const copy = getUiCopy("en");
  assert.equal(copy.speakWith("Daniel"), "Speak with Daniel");
  assert.equal(copy.conversationWith("Emily"), "Conversation with Emily");
  assert.equal(copy.quickTopics, "Quick topics");
  assert.equal(copy.endSession, "End session");
});

test("Russian knowledge questions become retrieval-oriented English without changing product names", () => {
  const charging = createKnowledgeQueryText(
    "Как заряжать Advanced Bottle?",
    "ru",
  );
  const inhalation = createKnowledgeQueryText(
    "Что такое водородная ингаляция?",
    "ru",
  );
  assert.match(charging, /advanced bottle/i);
  assert.match(charging, /charging/i);
  assert.match(inhalation, /inhalation/i);
});

test("Chinese knowledge questions become retrieval-oriented English without changing product names", () => {
  const charging = createKnowledgeQueryText(
    "如何给 Advanced Bottle 充电？",
    "zh",
  );
  const inhalation = createKnowledgeQueryText("什么是氢气吸入功能？", "zh-CN");
  assert.match(charging, /advanced bottle/i);
  assert.match(charging, /charging/i);
  assert.match(inhalation, /inhalation/i);
});

test("system prompts explicitly enforce the selected output language", async () => {
  const source = await readFile(
    path.join(process.cwd(), "lib/ai/system-prompt.ts"),
    "utf8",
  );
  assert.match(source, /Answer in natural English only/);
  assert.match(source, /Answer in natural Russian only/);
  assert.match(source, /Answer in natural Simplified Chinese only/);
  assert.match(source, /numbers, units and warnings exactly/);
  assert.match(source, /same approved facts/i);
});

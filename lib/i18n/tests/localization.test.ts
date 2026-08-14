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

test("English, Russian, Chinese, Cantonese and French are offered", () => {
  assert.deepEqual(SUPPORTED_LANGUAGES.map(({ code }) => code), ["en", "ru", "zh", "yue", "fr"]);
  assert.equal(isSupportedLanguage("en"), true);
  assert.equal(isSupportedLanguage("ru"), true);
  assert.equal(isSupportedLanguage("zh"), true);
  assert.equal(isSupportedLanguage("yue"), true);
  assert.equal(isSupportedLanguage("fr"), true);
  assert.equal(isSupportedLanguage("es"), false);
});

test("language configuration provides stable recognition locales", () => {
  assert.equal(getLanguageConfiguration("en").speechRecognitionLocale, "en-GB");
  assert.equal(getLanguageConfiguration("ru").speechRecognitionLocale, "ru-RU");
  assert.equal(getLanguageConfiguration("zh").speechRecognitionLocale, "zh-CN");
  assert.equal(getLanguageConfiguration("zh").nativeName, "中文（简体）");
  assert.equal(getLanguageConfiguration("yue").speechRecognitionLocale, "zh-HK");
  assert.equal(getLanguageConfiguration("yue").nativeName, "廣東話");
  assert.equal(getLanguageConfiguration("yue").ttsLanguageCode, null);
  assert.equal(getLanguageConfiguration("fr").speechRecognitionLocale, "fr-FR");
  assert.equal(getLanguageConfiguration("fr").nativeName, "Français");
  assert.equal(getLanguageConfiguration("fr").ttsLanguageCode, "fr");
});

test("connection-loss recovery copy exists in every supported language", () => {
  for (const language of ["en", "ru", "zh", "yue", "fr"] as const) {
    const copy = getUiCopy(language);
    assert.ok(copy.connectionLost.length > 8, language);
    assert.ok(copy.microphoneDenied.length > 8, language);
    assert.ok(copy.microphoneUnavailable.length > 8, language);
    assert.ok(copy.recognitionUnavailable.length > 8, language);
    assert.doesNotMatch(
      `${copy.connectionLost} ${copy.microphoneDenied} ${copy.microphoneUnavailable}`,
      /OpenAI|ElevenLabs|LiveAvatar|DOMException|NotAllowedError|\bHTTP\b|API key/i,
    );
  }
  assert.match(getUiCopy("yue").microphoneUnavailable, /咪高峰|快速問題/);
  assert.doesNotMatch(getUiCopy("yue").microphoneUnavailable, /麦克风|问题/);
});

test("active-product context is localized in every supported language", () => {
  assert.equal(getUiCopy("en").discussingProduct("Air Purifier"), "Discussing: Air Purifier");
  assert.equal(getUiCopy("ru").discussingProduct("Очиститель воздуха"), "Сейчас обсуждаем: Очиститель воздуха");
  assert.equal(getUiCopy("zh").discussingProduct("空气净化器"), "正在了解：空气净化器");
  assert.equal(getUiCopy("yue").discussingProduct("空氣淨化器"), "而家了解緊：空氣淨化器");
  assert.equal(getUiCopy("fr").discussingProduct("Purificateur d’air"), "Produit en cours : Purificateur d’air");
});

test("French visitor copy and Quick Topics are localized", () => {
  const copy = getUiCopy("fr");
  assert.equal(copy.specialistsHeading, "Rencontrez nos spécialistes IA");
  assert.equal(copy.speakWith("Daniel"), "Parler avec Daniel");
  assert.equal(copy.conversationWith("Emily"), "Conversation avec Emily");
  assert.equal(copy.askQuestion("Daniel"), "Posez une question à Daniel");
  assert.equal(copy.quickTopics, "Questions rapides");
  assert.equal(copy.talk, "Parler");
  assert.equal(copy.endSession, "Terminer la conversation");
  assert.match(copy.topics.daniel["hydrogen-water-overview"].question, /hydrogénée/);
  assert.match(copy.topics.emily["product-guidance"].question, /quotidien/);
});

test("Hong Kong Cantonese visitor copy and Quick Topics are localized", () => {
  const copy = getUiCopy("yue");
  assert.equal(copy.specialistsHeading, "認識您的 AI 專家");
  assert.equal(copy.speakWith("Daniel"), "同 Daniel 傾偈");
  assert.equal(copy.conversationWith("Emily"), "同 Emily 傾偈");
  assert.equal(copy.quickTopics, "快速問題");
  assert.equal(copy.talk, "講嘢");
  assert.equal(copy.endSession, "結束對話");
  assert.match(copy.topics.daniel["hydrogen-water-overview"].question, /氫水.*點樣/);
  assert.match(copy.topics.emily["product-guidance"].question, /日常使用/);
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

test("English conversation actions use exhibition-friendly labels", () => {
  const copy = getUiCopy("en");
  assert.equal(copy.speakWith("Daniel"), "Speak with Daniel");
  assert.equal(copy.conversationWith("Emily"), "Conversation with Emily");
  assert.equal(copy.quickTopics, "Quick questions");
  assert.equal(copy.exploreProducts, "Explore products →");
  assert.equal(copy.endSession, "End conversation");
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

test("Cantonese questions use the multilingual retrieval bridge", () => {
  const charging = createKnowledgeQueryText(
    "Advanced Bottle 充電嗰陣可唔可以產生氫氣？",
    "yue",
  );
  const packageContents = createKnowledgeQueryText("盒入面有啲咩？", "zh-HK");
  const materials = createKnowledgeQueryText("個樽係用咩物料造㗎？", "yue");
  assert.match(charging, /advanced bottle/i);
  assert.match(charging, /charging/i);
  assert.match(charging, /generate hydrogen/i);
  assert.match(packageContents, /package contents/i);
  assert.match(materials, /material/i);
});

test("French questions use the multilingual retrieval bridge", () => {
  const charging = createKnowledgeQueryText(
    "Puis-je produire de l’hydrogène pendant la charge de l’Advanced Bottle ?",
    "fr",
  );
  const packageContents = createKnowledgeQueryText("Que contient la boîte ?", "fr-FR");
  const materials = createKnowledgeQueryText("En quels matériaux la bouteille est-elle fabriquée ?", "fr");
  assert.match(charging, /advanced bottle/i);
  assert.match(charging, /charging/i);
  assert.match(charging, /generate hydrogen/i);
  assert.match(packageContents, /package contents/i);
  assert.match(materials, /material/i);
});

test("system prompts explicitly enforce the selected output language", async () => {
  const source = await readFile(
    path.join(process.cwd(), "lib/ai/system-prompt.ts"),
    "utf8",
  );
  assert.match(source, /Answer in natural English only/);
  assert.match(source, /Answer in natural Russian only/);
  assert.match(source, /Answer in natural Simplified Chinese only/);
  assert.match(source, /Answer in natural Cantonese only/);
  assert.match(source, /Traditional Chinese appropriate for Hong Kong/);
  assert.match(source, /Answer in natural standard French only/);
  assert.match(source, /numbers, units and warnings exactly/);
  assert.match(source, /same approved facts/i);
});

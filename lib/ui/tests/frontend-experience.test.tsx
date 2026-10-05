import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/page";
import {
  AttractScreen,
  ConversationScreen,
  JourneyChoiceScreen,
  ProductDetailScreen,
  ProductExplorerScreen,
  SpecialistSelectionScreen,
} from "@/components/screens/journey-screens";
import { VoiceControls } from "@/components/ui/voice-controls";
import { ProductManualDialog } from "@/components/ui/product-manual-dialog";
import { LiveAvatarPresentation } from "@/components/liveavatar/liveavatar-renderer";
import type {
  LiveAvatarOutput,
  LiveAvatarSnapshot,
} from "@/lib/liveavatar/liveavatar-types";
import type { SpeechSynthesisProvider } from "@/lib/voice/voice-types";
import type { SupportedLanguage } from "@/types/language";
import type { ConversationMessage } from "@/types/conversation";
import {
  EXHIBITION_PRODUCT_IDS,
  type ProductId,
} from "@/types/product";
import {
  exhibitionProducts,
} from "@/lib/data/exhibition-products";

const silentSpeechProvider: SpeechSynthesisProvider = {
  isSupported: true,
  isActivated: true,
  speak: () => undefined,
  stop: () => undefined,
};

const inertAvatarService: LiveAvatarOutput = {
  isConnected: false,
  supportsStreamingAudio: false,
  connect: async () => false,
  reconnect: async () => false,
  disconnect: async () => undefined,
  dispose: async () => undefined,
  attach: () => undefined,
  startListening: () => undefined,
  stopListening: () => undefined,
  setReady: () => undefined,
  setThinking: () => undefined,
  markFallback: () => undefined,
  speakAudio: async () => undefined,
  beginAudioStream: async () => undefined,
  sendAudioChunk: () => undefined,
  endAudioStream: () => undefined,
  interruptAudioStream: () => undefined,
  interrupt: () => undefined,
  subscribe: () => () => undefined,
};

function avatarSnapshot(
  state: LiveAvatarSnapshot["state"],
  error: string | null = null,
): LiveAvatarSnapshot {
  return {
    state,
    sessionId: state === "disconnected" ? null : "mock-session",
    error,
    reconnectAttemptCount: 0,
    outputPath: state === "disconnected" ? "elevenlabs-fallback" : "liveavatar",
    environment: "sandbox",
    idleTimeoutSeconds: 120,
  };
}

function renderAvatarState(
  state: LiveAvatarSnapshot["state"],
  language: SupportedLanguage = "en",
  guideId: "daniel" | "emily" = "daniel",
  error: string | null = null,
) {
  return renderToStaticMarkup(
    <LiveAvatarPresentation
      service={inertAvatarService}
      guideId={guideId}
      language={language}
      snapshot={avatarSnapshot(state, error)}
    />,
  );
}

function renderConversation(
  guideId: "daniel" | "emily",
  language: SupportedLanguage = "en",
  messages: ConversationMessage[] = [],
) {
  return renderToStaticMarkup(
    <ConversationScreen
      guideId={guideId}
      language={language}
      messages={messages}
      isLoading={false}
      onSubmitQuestion={async () => true}
      onRetryLastQuestion={async () => true}
      onProducts={() => undefined}
      onOpenProduct={() => undefined}
      onEnd={() => undefined}
      onIdleTimeout={() => undefined}
      synthesisProvider={silentSpeechProvider}
    />,
  );
}

test("the visitor journey begins with a neutral portrait-first kiosk attract screen", () => {
  const markup = renderToStaticMarkup(<Home />);

  assert.match(markup, /Explore water and air technology/);
  assert.match(markup, /Touch to begin/);
  assert.match(markup, /screen-container--full-bleed/);
  assert.match(markup, /src="\/kiosk\/idle-bubbles\.mp4"/);
  assert.match(markup, /autoPlay=""/);
  assert.match(markup, /loop=""/);
  assert.match(markup, /muted=""/);
  assert.doesNotMatch(markup, /Choose your language/);
  assert.doesNotMatch(markup, /Meet your AI specialists/);
});

test("the kiosk attract screen localizes its neutral invitation in all five languages", () => {
  const expected = {
    en: /Explore water and air technology/,
    ru: /Исследуйте технологии воды и воздуха/,
    zh: /探索水与空气科技/,
    yue: /探索水同空氣科技/,
    fr: /Découvrez les technologies de l’eau et de l’air/,
  } as const;

  for (const language of ["en", "ru", "zh", "yue", "fr"] as const) {
    const markup = renderToStaticMarkup(
      <AttractScreen language={language} onBegin={() => undefined} />,
    );
    assert.match(markup, expected[language]);
    assert.match(markup, /Touch|Коснитесь|轻触|輕觸|Touchez/);
    assert.doesNotMatch(markup, /Hydrogen Water Bottle GO|Hydrogen Water Bottle PRO/);
  }
});

test("the choice screen keeps the AI journey and local product browsing separate", () => {
  const markup = renderToStaticMarkup(
    <JourneyChoiceScreen
      language="en"
      onSpeak={() => undefined}
      onExplore={() => undefined}
      onBack={() => undefined}
    />,
  );

  assert.match(markup, /What would you like to do/);
  assert.match(markup, /Speak to AI Ambassador/);
  assert.match(markup, /Talk with Daniel or Emily and ask questions/);
  assert.match(markup, /Explore Products/);
  assert.match(markup, /Browse all six exhibition products, photos and manuals/);
  assert.equal((markup.match(/class="journey-choice-card /g) ?? []).length, 2);
  assert.doesNotMatch(markup, /liveavatar|ElevenLabs|OpenAI|conversation API/i);
});

test("product manuals are a local in-app utility and do not require an avatar session", () => {
  const closed = renderToStaticMarkup(
    <ProductManualDialog isOpen={false} language="en" onClose={() => undefined} />,
  );
  const chooser = renderToStaticMarkup(
    <ProductManualDialog isOpen language="en" onClose={() => undefined} />,
  );

  assert.equal(closed, "");
  assert.match(chooser, /role="dialog"/);
  assert.match(chooser, /Product manuals/);
  assert.match(chooser, /Water Ionizer User Manual/);
  assert.match(chooser, /Air Purifier User Manual/);
  assert.match(chooser, /GO User Manual/);
  assert.match(chooser, /PRO User Manual/);
  assert.equal((chooser.match(/product-manual-options/g) ?? []).length, 1);
  assert.doesNotMatch(chooser, /Air Humidifier|Face &amp; Body Generator/);
  assert.doesNotMatch(chooser, /liveavatar|session|ElevenLabs|OpenAI/i);
});

test("approved product details open their own local manual and preserve the detail screen", () => {
  const goDetail = renderToStaticMarkup(
    <ProductDetailScreen
      language="en"
      productId="everyday"
      guideName="Daniel"
      onBack={() => undefined}
      onCompare={() => undefined}
      onAskGuide={() => undefined}
    />,
  );
  const humidifierDetail = renderToStaticMarkup(
    <ProductDetailScreen
      language="en"
      productId="air-humidifier"
      guideName="Daniel"
      onBack={() => undefined}
      onCompare={() => undefined}
      onAskGuide={() => undefined}
    />,
  );
  const ionizerDetail = renderToStaticMarkup(
    <ProductDetailScreen
      language="en"
      productId="water-ionizer"
      guideName="Daniel"
      onBack={() => undefined}
      onCompare={() => undefined}
      onAskGuide={() => undefined}
    />,
  );
  const purifierDetail = renderToStaticMarkup(
    <ProductDetailScreen
      language="en"
      productId="air-purifier"
      guideName="Daniel"
      onBack={() => undefined}
      onCompare={() => undefined}
      onAskGuide={() => undefined}
    />,
  );
  const faceBodyDetail = renderToStaticMarkup(
    <ProductDetailScreen
      language="en"
      productId="face-body-generator"
      guideName="Daniel"
      onBack={() => undefined}
      onCompare={() => undefined}
      onAskGuide={() => undefined}
    />,
  );
  const proManual = renderToStaticMarkup(
    <ProductManualDialog
      isOpen
      language="en"
      manual={{ id: "advanced", href: "/manuals/pro-user-manual.pdf" }}
      onClose={() => undefined}
    />,
  );
  const purifierManual = renderToStaticMarkup(
    <ProductManualDialog
      isOpen
      language="en"
      manual={{ id: "air-purifier", href: "/manuals/air-purifier-user-manual.pdf" }}
      onClose={() => undefined}
    />,
  );
  const directManual = renderToStaticMarkup(
    <ProductManualDialog
      isOpen
      language="en"
      manual={{ id: "everyday", href: "/manuals/go-user-manual.pdf" }}
      onClose={() => undefined}
    />,
  );

  assert.match(goDetail, /User Manual/);
  assert.match(ionizerDetail, /User Manual/);
  assert.match(purifierDetail, /User Manual/);
  assert.doesNotMatch(humidifierDetail, /User Manual/);
  assert.doesNotMatch(faceBodyDetail, /User Manual/);
  assert.match(directManual, /Viewing: GO User Manual/);
  assert.match(directManual, /go-user-manual\.pdf/);
  assert.match(proManual, /Viewing: PRO User Manual/);
  assert.match(proManual, /pro-user-manual\.pdf/);
  assert.match(purifierManual, /Viewing: Air Purifier User Manual/);
  assert.match(purifierManual, /air-purifier-user-manual\.pdf/);
  assert.doesNotMatch(purifierManual, /liveavatar|session|ElevenLabs|OpenAI|retrieval/i);
  assert.doesNotMatch(directManual, /Back to manuals/);
  assert.doesNotMatch(directManual, /liveavatar|session|ElevenLabs|OpenAI/i);
});

test("Water Ionizer manual uses the approved local PDF without an AI provider", () => {
  const manual = { id: "water-ionizer" as const, href: "/manuals/water-ionizer-user-manual.pdf" };
  const dialog = renderToStaticMarkup(
    <ProductManualDialog isOpen language="en" manual={manual} onClose={() => undefined} />,
  );

  assert.match(dialog, /Viewing: Water Ionizer User Manual/);
  assert.match(dialog, /water-ionizer-user-manual\.pdf/);
  assert.doesNotMatch(dialog, /liveavatar|session|ElevenLabs|OpenAI|retrieval/i);
});

test("the conversation presents product manuals as a secondary utility action", () => {
  const markup = renderConversation("daniel");
  assert.match(markup, /Product manuals/);
  assert.match(markup, /conversation-manuals-action/);
  assert.match(markup, /Ask Daniel a question/);
});

test("the visual specialist panel distinguishes idle, connecting, and genuine failure", () => {
  const idleDaniel = renderAvatarState("disconnected");
  const idleEmily = renderAvatarState("disconnected", "en", "emily");
  const connecting = renderAvatarState("connecting");
  const failed = renderAvatarState("disconnected", "en", "daniel", "safe failure");
  const connected = renderAvatarState("connected");

  assert.match(idleDaniel, /data-visual-phase="idle"/);
  assert.match(idleDaniel, /Ready when you are/);
  assert.match(idleDaniel, /Daniel will appear when you start a conversation/);
  assert.doesNotMatch(idleDaniel, /Visual specialist unavailable/);
  assert.match(idleEmily, /Emily will appear when you start a conversation/);

  assert.match(connecting, /data-visual-phase="connecting"/);
  assert.match(connecting, /Daniel is getting ready/);
  assert.match(failed, /data-visual-phase="fallback"/);
  assert.match(failed, /Visual specialist unavailable/);
  assert.match(failed, /You can still continue the conversation/);
  assert.match(connected, /data-visual-phase="connected"/);
  assert.doesNotMatch(connected, /liveavatar-ambassador-placeholder/);
});

test("visual fallback keeps a browser-spoken answer in Speaking rather than Listening", () => {
  const fallbackSpeaking: LiveAvatarSnapshot = {
    ...avatarSnapshot("speaking"),
    error: "safe failure",
    outputPath: "elevenlabs-fallback",
  };
  const markup = renderToStaticMarkup(
    <LiveAvatarPresentation
      service={inertAvatarService}
      guideId="daniel"
      language="en"
      snapshot={fallbackSpeaking}
    />,
  );

  assert.match(markup, /data-visual-phase="fallback"/);
  assert.match(markup, /Speaking…/);
  assert.match(markup, /Daniel is answering now/);
  assert.doesNotMatch(markup, /Listening/);
});

test("the intentional avatar idle state renders safely in all five languages", () => {
  const expected = {
    en: /Ready when you are/,
    ru: /Всё готово/,
    zh: /随时可以开始/,
    yue: /隨時可以開始/,
    fr: /À vous de commencer/,
  } as const;

  for (const language of ["en", "ru", "zh", "yue", "fr"] as const) {
    const markup = renderAvatarState("disconnected", language);
    assert.match(markup, expected[language]);
    assert.match(markup, /data-visual-phase="idle"/);
  }
});

test("specialist selection presents Daniel and Emily as equal direct choices", () => {
  const markup = renderToStaticMarkup(
    <SpecialistSelectionScreen
      language="en"
      onSelect={() => undefined}
      onBack={() => undefined}
    />,
  );

  assert.match(markup, /Meet your AI specialists/);
  assert.match(markup, /Choose who you would like to speak with/);
  assert.match(markup, /Speak with Daniel/);
  assert.match(markup, /Speak with Emily/);
  assert.match(markup, /%2Fspecialists%2Femily-preview\.png/);
  assert.match(markup, /Emily — Wellness Specialist/);
  assert.match(markup, /%2Fspecialists%2Fdaniel-preview\.png/);
  assert.match(markup, /Daniel — Technology Specialist/);
  assert.doesNotMatch(markup, /VISUAL PREVIEW/);
  assert.equal((markup.match(/idle-specialist-card/g) ?? []).length, 2);
  assert.doesNotMatch(markup, /Meet Daniel/);
});

test("Russian UI localizes specialist selection and the full conversation shell", () => {
  const selection = renderToStaticMarkup(
    <SpecialistSelectionScreen
      language="ru"
      onSelect={() => undefined}
      onBack={() => undefined}
    />,
  );
  const danielConversation = renderConversation("daniel", "ru");
  const emilyConversation = renderConversation("emily", "ru");
  assert.match(selection, /Познакомьтесь с AI-специалистами/);
  assert.match(selection, /Поговорить с Дэниелом/);
  assert.match(selection, /Поговорить с Эмили/);
  assert.match(danielConversation, /Разговор с Дэниелом/);
  assert.match(danielConversation, /Задайте вопрос Дэниелу/);
  assert.match(danielConversation, /Технологический специалист/);
  assert.match(emilyConversation, /Разговор с Эмили/);
  assert.match(emilyConversation, /Задайте вопрос Эмили/);
  assert.match(emilyConversation, /Быстрые вопросы/);
  assert.match(emilyConversation, /Завершить разговор/);
  assert.doesNotMatch(
    `${danielConversation}${emilyConversation}`,
    /Quick topics|End session|Ask Emily a question|Разговор с Daniel/,
  );
});

test("Simplified Chinese UI localizes both specialists and the conversation shell", () => {
  const selection = renderToStaticMarkup(
    <SpecialistSelectionScreen language="zh" onSelect={() => undefined} onBack={() => undefined} />,
  );
  const danielConversation = renderConversation("daniel", "zh");
  const emilyConversation = renderConversation("emily", "zh");

  assert.match(selection, /认识您的 AI 专家/);
  assert.match(selection, /与 Daniel 交流/);
  assert.match(selection, /与 Emily 交流/);
  assert.match(danielConversation, /与 Daniel 对话/);
  assert.match(danielConversation, /向 Daniel 提问/);
  assert.match(danielConversation, /技术专家/);
  assert.match(emilyConversation, /与 Emily 对话/);
  assert.match(emilyConversation, /健康生活专家/);
  assert.match(emilyConversation, /快捷问题/);
  assert.match(emilyConversation, /结束对话/);
  assert.doesNotMatch(`${danielConversation}${emilyConversation}`, /Quick topics|End session|Ask Emily a question/);
});

test("Hong Kong Cantonese UI localizes both specialists and the conversation shell", () => {
  const selection = renderToStaticMarkup(
    <SpecialistSelectionScreen language="yue" onSelect={() => undefined} onBack={() => undefined} />,
  );
  const danielConversation = renderConversation("daniel", "yue");
  const emilyConversation = renderConversation("emily", "yue");

  assert.match(selection, /認識您的 AI 專家/);
  assert.match(selection, /同 Daniel 傾偈/);
  assert.match(selection, /同 Emily 傾偈/);
  assert.match(danielConversation, /科技專家/);
  assert.match(danielConversation, /快速問題/);
  assert.match(emilyConversation, /健康生活專家/);
  assert.match(emilyConversation, /結束對話/);
  assert.doesNotMatch(`${danielConversation}${emilyConversation}`, /认识您的 AI 专家|快捷问题|结束对话/);
});

test("French UI localizes both specialists and the conversation shell", () => {
  const selection = renderToStaticMarkup(
    <SpecialistSelectionScreen language="fr" onSelect={() => undefined} onBack={() => undefined} />,
  );
  const danielConversation = renderConversation("daniel", "fr");
  const emilyConversation = renderConversation("emily", "fr");

  assert.match(selection, /Rencontrez nos spécialistes IA/);
  assert.match(selection, /Parler avec Daniel/);
  assert.match(selection, /Parler avec Emily/);
  assert.match(danielConversation, /Spécialiste technologique/);
  assert.match(danielConversation, /Questions rapides/);
  assert.match(emilyConversation, /Spécialiste bien-être/);
  assert.match(emilyConversation, /Terminer la conversation/);
  assert.doesNotMatch(`${danielConversation}${emilyConversation}`, /Quick topics|End session|Ask Emily a question/);
});

test("shared conversation labels adapt to Daniel", () => {
  const markup = renderConversation("daniel");

  assert.match(markup, /Conversation with Daniel/);
  assert.match(markup, /Ask Daniel a question/);
  assert.match(markup, /Talk to Daniel/);
  assert.match(markup, />Talk</);
  assert.match(markup, /Quick questions/);
  assert.match(markup, /Explore products/);
  assert.match(markup, /Compare GO and PRO/);
  assert.match(markup, /How do I use the Water Ionizer/);
  assert.match(markup, /Tell me about the Air Purifier/);
  assert.equal((markup.match(/Explore products/g) ?? []).length, 1);
  assert.match(markup, /End conversation/);
  assert.doesNotMatch(markup, /Begin voice|Enable voice|Start conversation/);
  assert.match(markup, /Technology Specialist/);
});

test("conversation Quick Questions follow explicit product context changes", () => {
  const productEntry = (content: string, relatedProduct: ProductId): ConversationMessage => ({
    id: `visitor-${relatedProduct}`,
    role: "visitor",
    content,
    timestamp: "2026-08-14T00:00:00.000Z",
    relatedProduct,
    source: "typed",
  });

  const pro = renderConversation("daniel", "en", [
    productEntry("Tell me about PRO.", "advanced"),
  ]);
  assert.match(pro, /How does PRO work/);
  assert.match(pro, /How does hydrogen inhalation work/);
  assert.doesNotMatch(pro, /What room size is it designed for/);

  const switched = renderConversation("daniel", "en", [
    productEntry("Tell me about PRO.", "advanced"),
    productEntry("Now tell me about the Air Purifier.", "advanced"),
  ]);
  assert.match(switched, /Questions about Air Purifier/);
  assert.match(switched, /What room size is the Air Purifier designed for/);
  assert.match(switched, /When should I replace the Air Purifier pre-filter/);
  assert.doesNotMatch(switched, /How does hydrogen inhalation work/);
});

test("active product context is visible and localized without appearing in a general conversation", () => {
  const productMessage: ConversationMessage = {
    id: "visitor-air-purifier",
    role: "visitor",
    content: "Tell me about the Air Purifier.",
    timestamp: "2026-08-14T00:00:00.000Z",
    relatedProduct: "air-purifier",
    source: "typed",
  };
  const expected = {
    en: "Discussing: Air Purifier",
    ru: "Сейчас обсуждаем: Очиститель воздуха",
    zh: "正在了解：空气净化器",
    yue: "而家了解緊：空氣淨化器",
    fr: "Produit en cours : Purificateur d’air",
  } as const;

  for (const language of ["en", "ru", "zh", "yue", "fr"] as const) {
    assert.match(
      renderConversation("daniel", language, [productMessage]),
      new RegExp(expected[language]),
    );
  }

  assert.doesNotMatch(renderConversation("daniel"), /conversation-active-product/);
});

test("shared conversation labels adapt to Emily", () => {
  const markup = renderConversation("emily");

  assert.match(markup, /Conversation with Emily/);
  assert.match(markup, /Ask Emily a question/);
  assert.match(markup, /Talk to Emily/);
  assert.match(markup, />Talk</);
  assert.doesNotMatch(markup, /Begin voice|Enable voice|Start conversation/);
  assert.match(markup, /Wellness Specialist/);
  assert.match(markup, /Visual specialist unavailable/);
});

test("fallback presentation remains usable and hides raw provider errors", () => {
  const markup = renderConversation("daniel");

  assert.match(markup, /Ask Daniel a question/);
  assert.match(markup, /Speak with Daniel/);
  assert.match(markup, /You can still type your question/);
  assert.doesNotMatch(
    markup,
    /Session not found|Invalid session|insufficient credits/i,
  );
});

test("one Talk control represents listening, thinking and speaking states", () => {
  const baseProps = {
    playbackBlocked: false,
    audioSessionActivated: true,
    preparingVoice: false,
    activationFailed: false,
    guideName: "Daniel",
    language: "en" as const,
    transcript: "",
    error: null,
    recognitionSupported: true,
    synthesisSupported: true,
    disabled: false,
    onStartListening: () => undefined,
    onStopListening: () => undefined,
    onRetryPlayback: () => undefined,
  } as const;

  const ready = renderToStaticMarkup(
    <VoiceControls {...baseProps} inputState="idle" outputState="idle" />,
  );
  const listening = renderToStaticMarkup(
    <VoiceControls
      {...baseProps}
      inputState="listening"
      outputState="idle"
    />,
  );
  const thinking = renderToStaticMarkup(
    <VoiceControls
      {...baseProps}
      inputState="processing"
      outputState="idle"
    />,
  );
  const speaking = renderToStaticMarkup(
    <VoiceControls {...baseProps} inputState="idle" outputState="speaking" />,
  );

  assert.match(ready, />Talk</);
  assert.match(listening, />Stop</);
  assert.match(listening, /<strong>Listening…<\/strong>/);
  assert.match(thinking, />Talk</);
  assert.match(thinking, /<strong>Preparing an answer…<\/strong>/);
  assert.match(speaking, />Talk</);
  assert.match(speaking, /<strong>Speaking…<\/strong>/);
  assert.match(speaking, /Daniel is answering now/);
  assert.doesNotMatch(speaking, /voice-microphone-mark">Speaking/);
  for (const state of [ready, listening, thinking, speaking]) {
    assert.match(state, /class="voice-interaction"/);
    assert.match(state, /class="voice-microphone/);
    assert.match(state, /class="voice-status"/);
  }
  assert.doesNotMatch(ready, /role="switch"|Begin voice/);
});

test("voice-control geometry stays fixed across languages and states", async () => {
  const css = await readFile(
    new URL("../../../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /\.conversation-specialist \.voice-interaction \{[\s\S]*?grid-template-columns: 8\.5rem minmax\(0, 1fr\);/,
  );
  assert.match(
    css,
    /\.conversation-specialist \.voice-microphone \{[\s\S]*?width: 8\.5rem;[\s\S]*?height: 3\.5rem;/,
  );
  assert.match(css, /display: inline-flex;/);
  assert.match(css, /gap: var\(--space-2\);/);
  assert.match(
    css,
    /@media \(max-width: 29\.999rem\)[\s\S]*?\.conversation-specialist \.voice-interaction \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\);/,
  );
});

test("microphone failure keeps the typed-question route visible", () => {
  const markup = renderToStaticMarkup(
    <VoiceControls
      inputState="unavailable"
      outputState="idle"
      playbackBlocked={false}
      audioSessionActivated={true}
      preparingVoice={false}
      activationFailed={false}
      guideName="Emily"
      language="en"
      transcript=""
      error={{
        code: "recognition-unavailable",
        message: "Microphone permission was not granted.",
      }}
      recognitionSupported={false}
      synthesisSupported={true}
      disabled={false}
      onStartListening={() => undefined}
      onStopListening={() => undefined}
      onRetryPlayback={() => undefined}
    />,
  );

  assert.match(markup, /You can still type your question/);
  assert.match(markup, /Quick Question/);
  assert.doesNotMatch(markup, /OpenAI|ElevenLabs|LiveAvatar|API key/);
});

test("microphone hardware and speech failures never expose raw provider errors", () => {
  const baseProps = {
    inputState: "idle" as const,
    outputState: "idle" as const,
    playbackBlocked: false,
    audioSessionActivated: true,
    preparingVoice: false,
    activationFailed: false,
    guideName: "Emily",
    language: "en" as const,
    transcript: "",
    recognitionSupported: true,
    synthesisSupported: true,
    disabled: false,
    onStartListening: () => undefined,
    onStopListening: () => undefined,
    onRetryPlayback: () => undefined,
  };
  const microphone = renderToStaticMarkup(
    <VoiceControls
      {...baseProps}
      error={{ code: "microphone-unavailable", message: "DOMException: audio-capture" }}
    />,
  );
  const synthesis = renderToStaticMarkup(
    <VoiceControls
      {...baseProps}
      error={{ code: "synthesis-unavailable", message: "ElevenLabs request failed" }}
    />,
  );
  const blocked = renderToStaticMarkup(
    <VoiceControls {...baseProps} playbackBlocked error={null} />,
  );

  assert.match(microphone, /microphone isn’t available right now/i);
  assert.match(synthesis, /Answers will remain visible on screen/);
  assert.match(blocked, /Play response/);
  assert.doesNotMatch(`${microphone}${synthesis}`, /DOMException|audio-capture|ElevenLabs/);
});

test("recognition attempts are guarded against duplicates and stale callbacks", async () => {
  const source = await readFile(
    new URL("../../../hooks/use-voice-mode.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /listeningActiveRef\.current/);
  assert.match(source, /recognitionGenerationRef\.current !== recognitionGeneration/);
  assert.match(source, /recognitionGenerationRef\.current \+= 1;[\s\S]*recognition\.abort\(\)/);
});

test("specialist selection stays passive until a question requires voice and avatar output", async () => {
  const source = await readFile(
    new URL("../../../app/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /function selectSpecialist/);
  assert.match(source, /setScreen\("conversation"\)/);
  const selection = source.slice(
    source.indexOf("function selectSpecialist"),
    source.indexOf("useEffect(() => {", source.indexOf("function selectSpecialist")),
  );
  assert.doesNotMatch(selection, /activateVoiceSession|\.connect\(/);
  assert.match(
    source,
    /function prepareSpecialistInteraction[\s\S]*activateVoiceSession\(speechSynthesis\[selectedGuideId\]\)/,
  );
  assert.match(source, /audioActivationProvider=\{speechSynthesis\[selectedGuideId\]\}/);
  assert.doesNotMatch(source, /audioActivationProvider=\{fallbackSpeechSynthesis\}/);
  assert.match(
    source,
    /emily: new LiveAvatarService\(\{ guideId: "emily" \}\)/,
  );
  assert.match(source, /synthesisProvider=\{speechSynthesis\[selectedGuideId\]\}/);
  assert.doesNotMatch(source, /setScreen\("introduction"\)/);
  assert.doesNotMatch(source, /setScreen\("end"\)/);
  assert.doesNotMatch(source, /Start conversation|Enable Voice Mode/);

  for (const language of ["en", "ru", "zh", "yue", "fr"]) {
    assert.match(source, new RegExp(`code: "${language}"|SUPPORTED_LANGUAGES`));
  }
  assert.doesNotMatch(
    source,
    /ttsLanguageCode[\s\S]{0,160}liveAvatarServices\[guideId\]\.connect/,
  );
  assert.match(
    source,
    /useEffect\([\s\S]*?liveAvatarServices\.daniel\.dispose\(\)[\s\S]*?\[liveAvatarServices\]/,
  );
  assert.doesNotMatch(
    source,
    /dispose\(\)[\s\S]{0,300}\[fallbackSpeechSynthesis, speechSynthesis\]/,
  );

  const screenSource = await readFile(
    new URL("../../../components/screens/journey-screens.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    screenSource,
    /GuideIntroductionScreen|GuideSelectionScreen|Begin conversation/,
  );
});

test("typed, voice and Quick Topic questions share one submission boundary", async () => {
  const screenSource = await readFile(
    new URL("../../../components/screens/journey-screens.tsx", import.meta.url),
    "utf8",
  );
  const conversationSource = await readFile(
    new URL("../../../hooks/use-conversation.ts", import.meta.url),
    "utf8",
  );
  const voiceSource = await readFile(
    new URL("../../../hooks/use-voice-mode.ts", import.meta.url),
    "utf8",
  );

  assert.match(screenSource, /source: "typed"/);
  assert.match(screenSource, /source: "voice"/);
  assert.match(screenSource, /source: "quick-topic"/);
  assert.equal((screenSource.match(/onSubmitQuestion\(/g) ?? []).length, 3);
  assert.match(screenSource, /voice\.prepareQuestionSubmission\(\)/);
  assert.match(conversationSource, /const submitQuestion = useCallback/);
  assert.doesNotMatch(conversationSource, /demoFallback:/);
  assert.match(conversationSource, /sessionIdRef\.current = response\.sessionId/);
  assert.match(voiceSource, /selectPendingGuideSpeech\(/);
  assert.match(voiceSource, /latestGuideMessage\?\.speakable === false/);
  assert.match(
    voiceSource,
    /latestGuideMessage\?\.speakable === false[\s\S]*?setInputState\("idle"\)[\s\S]*?return;/,
  );
  assert.match(
    voiceSource,
    /synthesis\.speak\(normalizeSpeechText\(pendingGuideMessage\.content\), guideId/,
  );
  assert.doesNotMatch(
    voiceSource,
    /if \(!isEnabled \|\| !isAudioSessionActivated\)/,
  );
  assert.doesNotMatch(voiceSource, /questionId.*speak|speak.*questionId/s);
  assert.match(voiceSource, /synthesis\.stop\(\)/);
  const preparation = voiceSource.slice(
    voiceSource.indexOf("const prepareQuestionSubmission"),
    voiceSource.indexOf("const cancelQuestionSubmission"),
  );
  assert.ok(
    preparation.indexOf("synthesis.stop()") <
      preparation.indexOf("activateAudioSession()"),
  );
  assert.match(conversationSource, /source,\s*\n\s*};/);
  assert.match(conversationSource, /questionSource: source/);
  assert.match(conversationSource, /response\.resolvedActiveProduct/);
  assert.match(conversationSource, /const cancelPending = useCallback/);
});

test("conversation navigation cancels pending work and client input matches the server boundary", async () => {
  const pageSource = await readFile(
    new URL("../../../app/page.tsx", import.meta.url),
    "utf8",
  );
  const screenSource = await readFile(
    new URL("../../../components/screens/journey-screens.tsx", import.meta.url),
    "utf8",
  );
  const routeSource = await readFile(
    new URL("../../../app/api/conversation/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(pageSource, /function enterProductExplorer[\s\S]*?conversation\.cancelPending\(\)/);
  assert.match(pageSource, /function openProduct[\s\S]*?conversation\.cancelPending\(\)/);
  assert.match(screenSource, /maxLength={MAX_CONVERSATION_MESSAGE_LENGTH}/);
  assert.match(routeSource, /MAX_CONVERSATION_MESSAGE_LENGTH/);
});

test("choice-led product browsing is local and defers the existing AI setup until Ask", async () => {
  const pageSource = await readFile(
    new URL("../../../app/page.tsx", import.meta.url),
    "utf8",
  );
  const screenSource = await readFile(
    new URL("../../../components/screens/journey-screens.tsx", import.meta.url),
    "utf8",
  );

  assert.match(pageSource, /onBegin=\{\(\) => setScreen\("choice"\)\}/);
  assert.match(pageSource, /<JourneyChoiceScreen/);
  assert.match(pageSource, /enterProductExplorer\("choice"\)/);
  assert.match(pageSource, /setExplorerOrigin\(origin\)/);
  assert.match(pageSource, /deferredAiIntentRef\.current = \{[\s\S]*?kind: "product"/);
  assert.match(pageSource, /deferredAiIntentRef\.current = null/);
  assert.match(pageSource, /createAskAboutProductQuestion\(intent\.productId, selectedLanguage\)/);
  assert.match(pageSource, /explorerOrigin === "choice"/);
  assert.match(screenSource, /getProductManual\(productId\)/);
  assert.match(screenSource, /manual=\{manual\}/);
  assert.doesNotMatch(
    screenSource.slice(0, screenSource.indexOf("type ConversationScreenProps")),
    /LiveAvatarService|OpenAISpeechSynthesisProvider|activateVoiceSession/,
  );
});

test("responsive kiosk layout defines two areas without horizontal overflow", async () => {
  const css = await readFile(
    new URL("../../../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /grid-template-columns:\s*minmax\(19rem, 0\.9fr\) minmax\(28rem, 1\.35fr\)/,
  );
  assert.match(
    css,
    /\.conversation-specialist \.voice-interaction\s*{[^}]*grid-template-columns:\s*8\.5rem minmax\(0, 1fr\)/s,
  );
  assert.match(
    css,
    /\.conversation-specialist \.voice-microphone\s*{[^}]*display:\s*inline-flex;[^}]*width:\s*8\.5rem;[^}]*min-width:\s*8\.5rem;[^}]*height:\s*3\.5rem/s,
  );
  assert.match(css, /\.voice-microphone-mark\s*{[^}]*white-space:\s*nowrap/s);
  assert.match(
    css,
    /@media \(max-width: 29\.999rem\)[\s\S]*?\.conversation-specialist \.voice-interaction\s*{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s,
  );
  assert.match(
    css,
    /\.conversation-specialist \.specialist-end-action\s*{[^}]*border:\s*1px solid var\(--color-border-strong\)/s,
  );
  assert.match(css, /\.conversation-active-product\s*{/);
  assert.match(
    css,
    /@media \(max-width: 29\.999rem\)[\s\S]*?\.idle-header h1\s*{[\s\S]*?font-size:\s*clamp\(2\.5rem, 11vw, 2\.75rem\)/,
  );
  assert.match(css, /grid-auto-rows:\s*1fr/);
  assert.match(css, /@media \(orientation: portrait\)/);
  assert.match(css, /@media \(max-width: 47\.999rem\)/);
  assert.match(
    css,
    /\.conversation-workspace\s*{[^}]*grid-template-columns: 1fr/s,
  );
  assert.match(css, /\.journey-choice-grid\s*{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/s);
  assert.match(
    css,
    /@media \(max-width: 47\.999rem\)[\s\S]*?\.journey-choice-grid\s*{[^}]*grid-template-columns: minmax\(0, 1fr\)/s,
  );
});

test("wide kiosk allocates the remaining viewport height to internal conversation history", async () => {
  const css = await readFile(
    new URL("../../../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /\.response-area\s*\{[^}]*max-height:\s*min\(22rem, 36dvh\);[^}]*overflow-y:\s*auto;/s,
  );
  assert.match(
    css,
    /\.conversation-topics\s*\{[^}]*padding-top:\s*var\(--space-6\);[^}]*border-top:/s,
  );
  assert.match(
    css,
    /\.conversation-response-presentation:has\(\.presentation-panel\)\s*\{[^}]*align-items:\s*start;/s,
  );
  assert.match(
    css,
    /\/\* Landscape kiosk: allocate the remaining viewport height to the transcript, not page scrolling\. \*\/[\s\S]*?\.conversation-content\s*\{[^}]*height:\s*calc\([\s\S]*?100dvh[^}]*overflow:\s*hidden;[^}]*grid-template-rows:\s*minmax\(0, 1fr\);/s,
  );
  assert.match(
    css,
    /\.conversation-response-presentation:not\(:has\(\.presentation-panel\)\)\s*\{[^}]*flex:\s*1 1 auto;[^}]*flex-direction:\s*column;/s,
  );
  assert.match(
    css,
    /\.conversation-response-presentation:not\(:has\(\.presentation-panel\)\) \.response-area\s*\{[^}]*max-height:\s*none;[^}]*flex:\s*1 1 auto;/s,
  );
});

test("exhibition answers stay prominent and spoken highlighting does not alter flow", async () => {
  const css = await readFile(
    new URL("../../../app/globals.css", import.meta.url),
    "utf8",
  );
  const screenSource = await readFile(
    new URL("../../../components/screens/journey-screens.tsx", import.meta.url),
    "utf8",
  );
  const voiceSource = await readFile(
    new URL("../../../hooks/use-voice-mode.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /\.conversation-response-presentation:has\(\.presentation-panel\)\s*{[^}]*grid-template-columns:\s*minmax\(0, 1\.7fr\) minmax\(13rem, 0\.7fr\);[^}]*align-items:\s*start;/s,
  );
  assert.match(
    css,
    /\.guide-response p\s*{[^}]*font-size:\s*clamp\(1\.18rem, 1\.65vw, 1\.4rem\);[^}]*line-height:\s*1\.68;/s,
  );
  assert.match(
    css,
    /\.guide-response \.spoken-answer-segment\s*{[^}]*font:\s*inherit;[^}]*letter-spacing:\s*inherit;/s,
  );
  const finalGuideRule = css
    .slice(css.lastIndexOf("/* Final cascade: focused two-area kiosk composition */"))
    .match(/\.guide-response p\s*{([^}]*)}/s)?.[1];
  assert.ok(finalGuideRule);
  assert.doesNotMatch(finalGuideRule, /(?:^|\n)\s*(?:height|max-height|overflow-y)\s*:/);
  assert.match(screenSource, /spoken-answer-segment is-current/);
  assert.match(screenSource, /spoken-answer-segment is-complete/);
  assert.match(
    css,
    /\.spoken-answer-segment\.is-complete\s*{[^}]*opacity:\s*1;/s,
  );
  assert.match(screenSource, /: turn\.guide\.content/);
  assert.doesNotMatch(screenSource, /aria-hidden=.*spoken-answer-segment/);
  assert.match(voiceSource, /let timing: SpeechTiming \| null = null;/);
  assert.match(voiceSource, /let playbackClock: SpeechPlaybackClock \| null = null;/);
  assert.match(voiceSource, /onTiming: \(nextTiming\)[\s\S]*?startSpokenHighlight\(\);/);
  assert.match(voiceSource, /onPlaybackClock: \(clock: SpeechPlaybackClock\)[\s\S]*?startSpokenHighlight\(\);/);
});

test("the full-bleed kiosk invitation is pinned to the visual center", async () => {
  const css = await readFile(
    new URL("../../../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /\.attract-content-video \.attract-action\s*\{[^}]*position:\s*absolute;[^}]*top:\s*50%;[^}]*left:\s*50%;[^}]*grid-area:\s*auto;[^}]*transform:\s*translate\(-50%, -50%\);/s,
  );
  assert.match(
    css,
    /\.attract-content-video \.attract-action:hover\s*\{[^}]*transform:\s*translate\(-50%, calc\(-50% - 1px\)\);/s,
  );
});

test("the landscape composer is a single large touch control without changing narrow layouts", async () => {
  const css = await readFile(
    new URL("../../../app/globals.css", import.meta.url),
    "utf8",
  );

  const kioskRules = css.slice(
    css.indexOf("/* Landscape kiosk: allocate the remaining viewport height"),
  );
  assert.match(
    kioskRules,
    /\.composer\s*\{[^}]*height:\s*5\.75rem;[^}]*min-height:\s*5\.75rem;[^}]*padding-top:\s*0;[^}]*align-items:\s*stretch;/s,
  );
  assert.match(
    kioskRules,
    /\.composer input\s*\{[^}]*height:\s*100%;[^}]*padding-right:\s*var\(--space-6\);[^}]*padding-left:\s*var\(--space-6\);/s,
  );
  assert.match(
    kioskRules,
    /\.composer-send\s*\{[^}]*width:\s*8\.5rem;[^}]*min-width:\s*8\.5rem;[^}]*height:\s*100%;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s,
  );
  assert.match(css, /@media \(max-width: 47\.999rem\)[\s\S]*?\.composer input,[\s\S]*?\.composer-send\s*\{[^}]*min-height:\s*4\.375rem;/s);
});

test("conversation heading belongs to the dialogue column", () => {
  const markup = renderConversation("daniel");
  const dialogueStart = markup.indexOf('class="conversation-dialogue"');
  const headingStart = markup.indexOf('class="conversation-header"');
  const specialistStart = markup.indexOf('class="conversation-specialist"');

  assert.ok(specialistStart >= 0);
  assert.ok(dialogueStart > specialistStart);
  assert.ok(headingStart > dialogueStart);
});

test("the portfolio presents two flagship products before four other products with shared image rendering", () => {
  const opened: string[] = [];
  const markup = renderToStaticMarkup(
    <ProductExplorerScreen
      language="en"
      onOpenProduct={(productId) => opened.push(productId)}
      onBack={() => undefined}
    />,
  );

  assert.match(markup, /Flagship products/);
  assert.match(markup, /Other products/);
  assert.doesNotMatch(markup, /Functional Water|Indoor Environment/);
  for (const productId of EXHIBITION_PRODUCT_IDS) {
    assert.ok(
      markup.includes(
        exhibitionProducts[productId].displayNames.en.replaceAll("&", "&amp;"),
      ),
      productId,
    );
  }
  assert.equal(markup.match(/class="product-card"/g)?.length, 6);
  assert.equal(markup.match(/portfolio-group-flagship/g)?.length, 1);
  assert.equal(markup.match(/portfolio-group-other/g)?.length, 1);
  const flagshipStart = markup.indexOf('class="portfolio-group portfolio-group-flagship"');
  const otherStart = markup.indexOf('class="portfolio-group portfolio-group-other"');
  assert.ok(flagshipStart >= 0);
  assert.ok(otherStart > flagshipStart);
  const flagshipMarkup = markup.slice(flagshipStart, otherStart);
  const otherMarkup = markup.slice(otherStart);
  assert.ok(flagshipMarkup.indexOf("Air Purifier") < flagshipMarkup.indexOf("Water Ionizer"));
  assert.doesNotMatch(flagshipMarkup, /Hydrogen Water Bottle PRO|Hydrogen Water Bottle GO|Air Humidifier/);
  assert.ok(otherMarkup.indexOf("Hydrogen Water Bottle PRO") < otherMarkup.indexOf("Hydrogen Water Bottle GO"));
  assert.ok(otherMarkup.indexOf("Hydrogen Water Bottle GO") < otherMarkup.indexOf("H₂ Generator Face &amp; Body"));
  assert.ok(otherMarkup.indexOf("H₂ Generator Face &amp; Body") < otherMarkup.indexOf("Air Humidifier"));
  assert.match(markup, /products%2Fair-purifier-m-size%2Fhero-white-isolated\.png/);
  assert.match(markup, /products%2Fhydrogen-bottle-go%2Fhero\.png/);
  assert.match(markup, /products%2Fair-humidifier%2Fhero-white-isolated\.png/);
  const airPurifierImage = markup.match(/<img[^>]*air-purifier-m-size%2Fhero-white-isolated[^>]*>/)?.[0] ?? "";
  const airHumidifierImage = markup.match(/<img[^>]*air-humidifier%2Fhero-white-isolated[^>]*>/)?.[0] ?? "";
  assert.match(airPurifierImage, /products%2Fair-purifier-m-size%2Fhero-white-isolated\.png/);
  assert.match(airHumidifierImage, /products%2Fair-humidifier%2Fhero-white-isolated\.png/);
  assert.match(airPurifierImage, /data-nimg="fill"/);
  assert.match(airHumidifierImage, /data-nimg="fill"/);
  assert.doesNotMatch(markup, /Compare GO and PRO/);
  assert.doesNotMatch(markup, /Product visual coming soon/);
  assert.doesNotMatch(markup, /Water Mineralizer/);
  assert.doesNotMatch(markup, /Air Purifier M Size/);
  assert.deepEqual(opened, []);
});

test("product details provide local galleries and concise catalogue context", () => {
  for (const productId of EXHIBITION_PRODUCT_IDS) {
    const markup = renderToStaticMarkup(
      <ProductDetailScreen
        language="en"
        productId={productId}
        guideName="Daniel"
        onBack={() => undefined}
        onCompare={() => undefined}
        onAskGuide={() => undefined}
      />,
    );

    assert.ok(
      markup.includes(
        exhibitionProducts[productId].displayNames.en.replaceAll("&", "&amp;"),
      ),
      productId,
    );
    assert.match(markup, /Back to portfolio/);
    assert.match(markup, /Ask Daniel/);
    assert.match(
      markup,
      /Ask about how it works, specifications, use or maintenance/,
    );
    assert.match(markup, /At a glance/);
    assert.match(markup, /How it works/);
    assert.match(markup, /Care/);
    assert.match(markup, /product-gallery-thumbnail/);
    if (productId === "everyday" || productId === "advanced") {
      assert.match(markup, /Compare GO and PRO/);
    } else {
      assert.doesNotMatch(markup, /Compare GO and PRO/);
    }
  }
});

test("Indoor Environment detail galleries start with their catalogue hero images", () => {
  for (const [productId, hero] of [
    ["air-purifier", "/products/air-purifier-m-size/hero-white-isolated.png"],
    ["air-humidifier", "/products/air-humidifier/hero-dining-table.png"],
  ] as const) {
    const markup = renderToStaticMarkup(
      <ProductDetailScreen
        language="en"
        productId={productId}
        guideName="Daniel"
        onBack={() => undefined}
        onCompare={() => undefined}
        onAskGuide={() => undefined}
      />,
    );
    assert.match(markup, new RegExp(hero.replaceAll("/", "%2F").replace(".", "\\.")));
  }
});

test("portfolio identities and navigation remain localized in all five languages", () => {
  for (const language of ["en", "ru", "zh", "yue", "fr"] as const) {
    const portfolio = renderToStaticMarkup(
      <ProductExplorerScreen
        language={language}
        onOpenProduct={() => undefined}
        onBack={() => undefined}
      />,
    );
    assert.match(portfolio, new RegExp(exhibitionProducts["air-purifier"].displayNames[language]));
    assert.match(portfolio, new RegExp(exhibitionProducts["air-humidifier"].displayNames[language]));

    const detail = renderToStaticMarkup(
      <ProductDetailScreen
        language={language}
        productId="air-purifier"
        guideName="Daniel"
        onBack={() => undefined}
        onCompare={() => undefined}
        onAskGuide={() => undefined}
      />,
    );
    assert.doesNotMatch(detail, /undefined|null/);
  }
});

test("portfolio CSS provides intentional landscape, portrait and mobile grids", async () => {
  const css = await readFile(new URL("../../../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.product-grid\s*\{[^}]*repeat\(4, minmax\(0, 1fr\)\)/s);
  assert.match(css, /\.portfolio-group-flagship \.product-grid\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/s);
  assert.match(css, /\.portfolio-group-flagship \.product-card-visual\s*\{[^}]*height:\s*clamp\(14\.5rem, 19vw, 17rem\);/s);
  assert.doesNotMatch(css, /\.portfolio-group-indoor-environment/);
  assert.match(
    css,
    /\.product-card-image-frame\s*\{[^}]*position:\s*relative;[^}]*width:\s*100%;[^}]*height:\s*100%;/s,
  );
  assert.match(
    css,
    /\.product-card-visual\s*\{[^}]*height:\s*clamp\(14rem, 18vw, 16\.5rem\);[^}]*padding:\s*var\(--space-2\);/s,
  );
  assert.match(
    css,
    /\.detail-product-visual\s*\{[^}]*min-height:\s*29rem;[^}]*padding:\s*var\(--space-5\);/s,
  );
  assert.match(css, /@media \(orientation: portrait\)[\s\S]*?\.product-grid\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/s);
  assert.match(css, /@media \(max-width: 47\.999rem\)[\s\S]*?\.product-grid,[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/s);
  assert.match(css, /\.quick-topic-card\s*\{[^}]*min-height:\s*4\.75rem/s);
  assert.match(css, /\.quick-topic-list\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/page";
import {
  ConversationScreen,
  ProductDetailScreen,
  ProductExplorerScreen,
  SpecialistSelectionScreen,
} from "@/components/screens/journey-screens";
import { VoiceControls } from "@/components/ui/voice-controls";
import type { SpeechSynthesisProvider } from "@/lib/voice/voice-types";
import type { SupportedLanguage } from "@/types/language";
import type { ConversationMessage } from "@/types/conversation";
import { PRODUCT_IDS, type ProductId } from "@/types/product";
import {
  exhibitionProducts,
  productCategoryNames,
} from "@/lib/data/exhibition-products";

const silentSpeechProvider: SpeechSynthesisProvider = {
  isSupported: true,
  isActivated: true,
  speak: () => undefined,
  stop: () => undefined,
};

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
      onProducts={() => undefined}
      onOpenProduct={() => undefined}
      onEnd={() => undefined}
      onIdleTimeout={() => undefined}
      synthesisProvider={silentSpeechProvider}
    />,
  );
}

test("the visitor journey begins with language selection", () => {
  const markup = renderToStaticMarkup(<Home />);

  assert.match(markup, /Choose your language/);
  assert.match(markup, /English/);
  assert.doesNotMatch(markup, /Meet your AI specialists/);
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
  assert.match(markup, /Explore products →/);
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

test("shared conversation labels adapt to Emily", () => {
  const markup = renderConversation("emily");

  assert.match(markup, /Conversation with Emily/);
  assert.match(markup, /Ask Emily a question/);
  assert.match(markup, /Talk to Emily/);
  assert.match(markup, />Talk</);
  assert.doesNotMatch(markup, /Begin voice|Enable voice|Start conversation/);
  assert.match(markup, /Wellness Specialist/);
  assert.match(markup, /Visual session unavailable/);
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
  assert.doesNotMatch(markup, /OpenAI|ElevenLabs|LiveAvatar|API key/);
});

test("active route bypasses introduction and separate voice activation", async () => {
  const source = await readFile(
    new URL("../../../app/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /function selectSpecialist/);
  assert.match(source, /setScreen\("conversation"\)/);
  assert.match(source, /activateVoiceSession\(fallbackSpeechSynthesis\)/);
  assert.match(source, /liveAvatarServices\[guideId\]\.connect\(\)/);
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
  assert.match(
    voiceSource,
    /synthesis\.speak\(normalizeSpeechText\(latestGuideMessage\.content\), guideId/,
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
    /@media \(max-width: 29\.999rem\)\s*{[^}]*\.conversation-specialist \.voice-interaction\s*{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s,
  );
  assert.match(
    css,
    /\.conversation-specialist \.specialist-end-action\s*{[^}]*margin-top:\s*0/s,
  );
  assert.match(css, /grid-auto-rows:\s*1fr/);
  assert.match(css, /@media \(orientation: portrait\)/);
  assert.match(css, /@media \(max-width: 47\.999rem\)/);
  assert.match(
    css,
    /\.conversation-workspace\s*{[^}]*grid-template-columns: 1fr/s,
  );
});

test("ordinary answers grow before Quick Questions without an internal scrollbar", async () => {
  const css = await readFile(
    new URL("../../../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /\.response-area\s*\{[^}]*max-height:\s*none;[^}]*overflow:\s*visible;/s,
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
    /\.conversation-content\s*\{[^}]*max-height:\s*none;[^}]*grid-template-rows:\s*auto auto;/s,
  );
  assert.match(
    css,
    /\.conversation-workspace\s*\{[^}]*min-height:\s*auto;[^}]*align-items:\s*start;/s,
  );
  assert.match(
    css,
    /\.conversation-dialogue\s*\{[^}]*min-height:\s*auto;/s,
  );
  assert.doesNotMatch(
    css.slice(css.lastIndexOf("/* Final cascade: focused two-area kiosk composition */")),
    /\.conversation-content\s*\{[^}]*max-height:\s*calc/s,
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
    /\.spoken-answer-segment\.is-complete\s*{[^}]*opacity:\s*0\.72;/s,
  );
  assert.match(screenSource, /: turn\.guide\.content/);
  assert.doesNotMatch(screenSource, /aria-hidden=.*spoken-answer-segment/);
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

test("the portfolio is registry-driven and groups all six exhibition products", () => {
  const opened: string[] = [];
  const markup = renderToStaticMarkup(
    <ProductExplorerScreen
      language="en"
      onOpenProduct={(productId) => opened.push(productId)}
      onBack={() => undefined}
    />,
  );

  assert.match(markup, /Functional Water/);
  assert.match(markup, /Clean Air/);
  for (const productId of PRODUCT_IDS) {
    assert.ok(
      markup.includes(
        exhibitionProducts[productId].displayNames.en.replaceAll("&", "&amp;"),
      ),
      productId,
    );
  }
  assert.equal(markup.match(/class="product-card"/g)?.length, 6);
  assert.match(markup, /everyday-bottle\.png/);
  assert.match(markup, /advanced-bottle\.png/);
  assert.equal(markup.match(/<small>Product visual coming soon<\/small>/g)?.length, 4);
  assert.deepEqual(opened, []);
});

test("product details stay structural for pending products and compare only GO with PRO", () => {
  for (const productId of PRODUCT_IDS) {
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
    if (productId === "everyday" || productId === "advanced") {
      assert.match(markup, /Compare GO and PRO/);
    } else {
      assert.doesNotMatch(markup, /Compare GO and PRO/);
      assert.doesNotMatch(markup, /Key features|Best for/);
    }
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
    assert.match(portfolio, new RegExp(productCategoryNames["functional-water"][language]));
    assert.match(portfolio, new RegExp(productCategoryNames["clean-air"][language]));
    assert.match(portfolio, new RegExp(exhibitionProducts["air-purifier"].displayNames[language]));

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
  assert.match(css, /\.product-grid\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/s);
  assert.match(css, /@media \(orientation: portrait\)[\s\S]*?\.product-grid\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/s);
  assert.match(css, /@media \(max-width: 47\.999rem\)[\s\S]*?\.product-grid,[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/s);
  assert.match(css, /\.quick-topic-card\s*\{[^}]*min-height:\s*4\.75rem/s);
  assert.match(css, /\.quick-topic-list\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s);
});

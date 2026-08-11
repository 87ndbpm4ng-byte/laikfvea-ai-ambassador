import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/page";
import {
  ConversationScreen,
  SpecialistSelectionScreen,
} from "@/components/screens/journey-screens";
import { VoiceControls } from "@/components/ui/voice-controls";
import type { SpeechSynthesisProvider } from "@/lib/voice/voice-types";

const silentSpeechProvider: SpeechSynthesisProvider = {
  isSupported: true,
  isActivated: true,
  speak: () => undefined,
  stop: () => undefined,
};

function renderConversation(guideId: "daniel" | "emily") {
  return renderToStaticMarkup(
    <ConversationScreen
      guideId={guideId}
      messages={[]}
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

test("shared conversation labels adapt to Daniel", () => {
  const markup = renderConversation("daniel");

  assert.match(markup, /Conversation with Daniel/);
  assert.match(markup, /Ask Daniel a question/);
  assert.match(markup, /Talk to Daniel/);
  assert.match(markup, />Talk</);
  assert.doesNotMatch(markup, /Begin voice|Enable voice|Start conversation/);
  assert.match(markup, /Technology Specialist/);
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
  assert.match(source, /liveAvatarService\.connect\(\)/);
  assert.doesNotMatch(source, /setScreen\("introduction"\)/);
  assert.doesNotMatch(source, /setScreen\("end"\)/);
  assert.doesNotMatch(source, /Start conversation|Enable Voice Mode/);

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
    /\.conversation-specialist \.voice-interaction\s*{[^}]*grid-template-columns:\s*9rem minmax\(0, 1fr\)/s,
  );
  assert.match(
    css,
    /\.conversation-specialist \.voice-microphone\s*{[^}]*display:\s*inline-flex;[^}]*width:\s*9rem;[^}]*min-width:\s*9rem;[^}]*height:\s*3\.75rem/s,
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

test("conversation heading belongs to the dialogue column", () => {
  const markup = renderConversation("daniel");
  const dialogueStart = markup.indexOf('class="conversation-dialogue"');
  const headingStart = markup.indexOf('class="conversation-header"');
  const specialistStart = markup.indexOf('class="conversation-specialist"');

  assert.ok(specialistStart >= 0);
  assert.ok(dialogueStart > specialistStart);
  assert.ok(headingStart > dialogueStart);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/page";
import { ConversationScreen } from "@/components/screens/journey-screens";
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
      onAskSuggested={async () => true}
      onAskText={async () => true}
      onProducts={() => undefined}
      onOpenProduct={() => undefined}
      onEnd={() => undefined}
      onIdleTimeout={() => undefined}
      synthesisProvider={silentSpeechProvider}
    />,
  );
}

test("landing presents Daniel and Emily as equal specialist choices", () => {
  const markup = renderToStaticMarkup(<Home />);

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
  assert.match(markup, /Speak with Daniel/);
  assert.match(markup, /Technology Specialist/);
});

test("shared conversation labels adapt to Emily", () => {
  const markup = renderConversation("emily");

  assert.match(markup, /Conversation with Emily/);
  assert.match(markup, /Ask Emily a question/);
  assert.match(markup, /Speak with Emily/);
  assert.match(markup, /Wellness Specialist/);
  assert.match(markup, /Visual session unavailable/);
});

test("fallback presentation remains usable and hides raw provider errors", () => {
  const markup = renderConversation("daniel");

  assert.match(markup, /Ask Daniel a question/);
  assert.match(markup, /Enable voice conversation with Daniel/);
  assert.doesNotMatch(
    markup,
    /Session not found|Invalid session|insufficient credits/i,
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
  assert.match(css, /@media \(orientation: portrait\)/);
  assert.match(css, /@media \(max-width: 47\.999rem\)/);
  assert.match(
    css,
    /\.conversation-workspace\s*{[^}]*grid-template-columns: 1fr/s,
  );
});

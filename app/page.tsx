"use client";

import { useEffect, useMemo, useState } from "react";
import { ScreenContainer } from "@/components/layout/screen-container";
import {
  ConversationScreen,
  GuideIntroductionScreen,
  GuideSelectionScreen,
  ProductComparisonScreen,
  ProductDetailScreen,
  ProductExplorerScreen,
  SessionEndScreen,
} from "@/components/screens/journey-screens";
import { useConversation } from "@/hooks/use-conversation";
import { guides } from "@/lib/data/guides";
import { products } from "@/lib/data/products";
import { getSuggestedQuestion } from "@/lib/data/suggested-questions";
import { LiveAvatarService } from "@/lib/liveavatar/liveavatar-service";
import { LiveAvatarSpeechSynthesisProvider } from "@/lib/voice/liveavatar-speech-synthesis";
import { OpenAISpeechSynthesisProvider } from "@/lib/voice/openai-speech-synthesis";
import type { JourneyScreen } from "@/types/conversation";
import type { GuideId } from "@/types/guide";
import type { ProductId } from "@/types/product";

const languages = ["English", "中文", "Русский", "Español"] as const;

export default function Home() {
  const [screen, setScreen] = useState<JourneyScreen>("idle");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<GuideId | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductId>("everyday");
  const selectedGuide = selectedGuideId ? guides[selectedGuideId] : null;
  const conversation = useConversation(selectedGuide, selectedLanguage);
  const liveAvatarService = useMemo(() => new LiveAvatarService(), []);
  const fallbackSpeechSynthesis = useMemo(
    () => new OpenAISpeechSynthesisProvider(),
    [],
  );
  const speechSynthesis = useMemo(
    () =>
      new LiveAvatarSpeechSynthesisProvider({
        avatar: liveAvatarService,
        fallback: fallbackSpeechSynthesis,
      }),
    [fallbackSpeechSynthesis, liveAvatarService],
  );

  useEffect(() => {
    if (selectedGuideId !== "daniel") {
      void liveAvatarService.disconnect();
    }
  }, [liveAvatarService, selectedGuideId]);

  function openProduct(product: ProductId) {
    setSelectedProduct(product);
    setScreen("product-detail");
  }

  async function askAboutProduct() {
    const product = products[selectedProduct];
    await conversation.submitText(
      `Tell me about ${product.name}`,
      selectedProduct,
    );
    setScreen("conversation");
  }

  async function askAboutComparison() {
    const comparisonQuestion = getSuggestedQuestion("product-comparison");

    if (comparisonQuestion) {
      await conversation.submitSuggestedQuestion(comparisonQuestion);
    }

    setScreen("conversation");
  }

  function restartSession() {
    speechSynthesis.reset();
    setSelectedLanguage(null);
    setSelectedGuideId(null);
    setSelectedProduct("everyday");
    conversation.clearHistory();
    setScreen("idle");
  }

  function endSession() {
    speechSynthesis.reset();
    setScreen("end");
  }

  return (
    <main>
      <ScreenContainer>
        {screen === "idle" ? (
          <section
            className="screen-content idle-content"
            aria-labelledby="idle-heading"
          >
            <header className="idle-header">
              <p className="idle-eyebrow">Hydrogen technology, made clear</p>
              <h1 id="idle-heading">Choose your AI specialist.</h1>
              <p className="idle-support">
                Meet the guide whose perspective best matches what you would
                like to explore.
              </p>
            </header>

            <div
              className="idle-specialist-grid"
              role="group"
              aria-label="AI specialists"
            >
              {Object.values(guides).map((guide) => (
                <button
                  className="idle-specialist-card"
                  type="button"
                  key={guide.id}
                  onClick={() => {
                    setSelectedGuideId(guide.id);
                    setScreen("language");
                  }}
                >
                  <span className="idle-specialist-portrait" aria-hidden="true">
                    {guide.initial}
                  </span>
                  <span className="idle-specialist-copy">
                    <strong>{guide.name}</strong>
                    <span>{guide.role}</span>
                    <small>
                      {guide.id === "daniel"
                        ? "Explains technology, engineering and product features."
                        : "Explains wellness, hydration and everyday routines."}
                    </small>
                  </span>
                  <span className="idle-specialist-action">
                    Select {guide.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : screen === "language" ? (
          <section
            className="screen-content language-content"
            aria-labelledby="language-heading"
          >
            <button
              className="back-action"
              type="button"
              onClick={() => setScreen("idle")}
            >
              Back
            </button>

            <div className="language-panel">
              <h1 id="language-heading">Choose your language</h1>
              <div className="language-grid" role="group" aria-label="Languages">
                {languages.map((language) => (
                  <button
                    className="language-option"
                    type="button"
                    key={language}
                    onClick={() => {
                      setSelectedLanguage(language);
                      setScreen(
                        selectedGuideId ? "introduction" : "guide",
                      );
                    }}
                    lang={
                      language === "中文"
                        ? "zh"
                        : language === "Русский"
                          ? "ru"
                          : language === "Español"
                            ? "es"
                            : "en"
                    }
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : screen === "guide" ? (
          <GuideSelectionScreen
            selectedGuide={selectedGuideId}
            onSelect={setSelectedGuideId}
            onBack={() => setScreen("language")}
            onContinue={() => setScreen("introduction")}
          />
        ) : screen === "introduction" && selectedGuideId ? (
          <GuideIntroductionScreen
            guideId={selectedGuideId}
            onBack={() => setScreen("language")}
            onBegin={() => setScreen("conversation")}
          />
        ) : screen === "conversation" && selectedGuideId ? (
          <ConversationScreen
            guideId={selectedGuideId}
            messages={conversation.messages}
            isLoading={conversation.isLoading}
            onAskSuggested={conversation.submitSuggestedQuestion}
            onAskText={conversation.submitText}
            onProducts={() => setScreen("products")}
            onOpenProduct={openProduct}
            onEnd={endSession}
            onIdleTimeout={restartSession}
            synthesisProvider={speechSynthesis}
            liveAvatarService={liveAvatarService}
          />
        ) : screen === "products" ? (
          <ProductExplorerScreen
            onOpenProduct={openProduct}
            onCompare={() => setScreen("comparison")}
            onBack={() => setScreen("conversation")}
          />
        ) : screen === "product-detail" ? (
          <ProductDetailScreen
            productId={selectedProduct}
            onBack={() => setScreen("products")}
            onCompare={() => setScreen("comparison")}
            onAskGuide={askAboutProduct}
          />
        ) : screen === "comparison" ? (
          <ProductComparisonScreen
            onAsk={askAboutComparison}
            onBack={() => setScreen("products")}
          />
        ) : screen === "end" ? (
          <SessionEndScreen
            onRestart={restartSession}
            onReturn={() => setScreen("conversation")}
          />
        ) : (
          <GuideSelectionScreen
            selectedGuide={selectedGuideId}
            onSelect={setSelectedGuideId}
            onBack={() => setScreen("language")}
            onContinue={() => setScreen("introduction")}
          />
        )}
      </ScreenContainer>
    </main>
  );
}

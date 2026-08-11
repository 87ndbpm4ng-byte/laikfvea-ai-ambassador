"use client";

import { useEffect, useMemo, useState } from "react";
import { ScreenContainer } from "@/components/layout/screen-container";
import {
  ConversationScreen,
  ProductComparisonScreen,
  ProductDetailScreen,
  ProductExplorerScreen,
  SpecialistSelectionScreen,
} from "@/components/screens/journey-screens";
import { useConversation } from "@/hooks/use-conversation";
import { guides } from "@/lib/data/guides";
import { products } from "@/lib/data/products";
import { getSuggestedQuestion } from "@/lib/data/suggested-questions";
import { LiveAvatarService } from "@/lib/liveavatar/liveavatar-service";
import { activateVoiceSession } from "@/lib/voice/audio-session";
import { LiveAvatarSpeechSynthesisProvider } from "@/lib/voice/liveavatar-speech-synthesis";
import { OpenAISpeechSynthesisProvider } from "@/lib/voice/openai-speech-synthesis";
import type { JourneyScreen } from "@/types/conversation";
import type { GuideId } from "@/types/guide";
import type { ProductId } from "@/types/product";

const languages = ["English", "中文", "Русский", "Español"] as const;

export default function Home() {
  const [screen, setScreen] = useState<JourneyScreen>("language");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<GuideId | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductId>("everyday");
  const [voiceActivation, setVoiceActivation] =
    useState<Promise<boolean> | null>(null);
  const selectedGuide = selectedGuideId ? guides[selectedGuideId] : null;
  const conversation = useConversation(selectedGuide, selectedLanguage);
  const liveAvatarServices = useMemo(
    () => ({
      daniel: new LiveAvatarService({ guideId: "daniel" }),
      emily: new LiveAvatarService({ guideId: "emily" }),
    }),
    [],
  );
  const fallbackSpeechSynthesis = useMemo(
    () => new OpenAISpeechSynthesisProvider(),
    [],
  );
  const speechSynthesis = useMemo(
    () => ({
      daniel: new LiveAvatarSpeechSynthesisProvider({
        avatar: liveAvatarServices.daniel,
        fallback: fallbackSpeechSynthesis,
        guideId: "daniel",
      }),
      emily: new LiveAvatarSpeechSynthesisProvider({
        avatar: liveAvatarServices.emily,
        fallback: fallbackSpeechSynthesis,
        guideId: "emily",
      }),
    }),
    [fallbackSpeechSynthesis, liveAvatarServices],
  );

  useEffect(() => {
    for (const guideId of Object.keys(liveAvatarServices) as GuideId[]) {
      if (guideId !== selectedGuideId) {
        void liveAvatarServices[guideId].disconnect();
      }
    }
  }, [liveAvatarServices, selectedGuideId]);

  function openProduct(product: ProductId) {
    setSelectedProduct(product);
    setScreen("product-detail");
  }

  async function askAboutProduct() {
    const product = products[selectedProduct];
    await conversation.submitQuestion({
      content: `Tell me about ${product.name}`,
      source: "product",
      relatedProduct: selectedProduct,
    });
    setScreen("conversation");
  }

  async function askAboutComparison() {
    const comparisonQuestion = getSuggestedQuestion("product-comparison");

    if (comparisonQuestion) {
      await conversation.submitQuestion({
        content: comparisonQuestion.label,
        source: "product",
        questionId: comparisonQuestion.id,
        relatedProduct: comparisonQuestion.relatedProduct,
      });
    }

    setScreen("conversation");
  }

  function restartSession() {
    if (selectedGuideId) speechSynthesis[selectedGuideId].reset();
    void liveAvatarServices.daniel.disconnect();
    void liveAvatarServices.emily.disconnect();
    fallbackSpeechSynthesis.reset();
    setSelectedLanguage(null);
    setSelectedGuideId(null);
    setSelectedProduct("everyday");
    setVoiceActivation(null);
    conversation.clearHistory();
    setScreen("language");
  }

  function endSession() {
    restartSession();
  }

  function selectSpecialist(guideId: GuideId) {
    // Audio unlock starts synchronously inside the visitor's direct tap.
    const activation = activateVoiceSession(fallbackSpeechSynthesis);
    setVoiceActivation(activation);
    setSelectedGuideId(guideId);
    setScreen("conversation");

    // The optional visual session prepares in parallel and never blocks voice.
    void liveAvatarServices[guideId].connect();
  }

  return (
    <main>
      <ScreenContainer>
        {screen === "language" ? (
          <section
            className="screen-content language-content"
            aria-labelledby="language-heading"
          >
            <div className="language-panel">
              <h1 id="language-heading">Choose your language</h1>
              <div
                className="language-grid"
                role="group"
                aria-label="Languages"
              >
                {languages.map((language) => (
                  <button
                    className="language-option"
                    type="button"
                    key={language}
                    onClick={() => {
                      setSelectedLanguage(language);
                      setScreen("idle");
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
        ) : screen === "idle" ? (
          <SpecialistSelectionScreen
            onSelect={selectSpecialist}
            onBack={() => setScreen("language")}
          />
        ) : screen === "conversation" && selectedGuideId ? (
          <ConversationScreen
            guideId={selectedGuideId}
            messages={conversation.messages}
            isLoading={conversation.isLoading}
            onSubmitQuestion={conversation.submitQuestion}
            onProducts={() => setScreen("products")}
            onOpenProduct={openProduct}
            onEnd={endSession}
            onIdleTimeout={restartSession}
            synthesisProvider={speechSynthesis[selectedGuideId]}
            audioActivationProvider={fallbackSpeechSynthesis}
            voiceActivationPromise={voiceActivation}
            liveAvatarService={liveAvatarServices[selectedGuideId]}
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
        ) : (
          <SpecialistSelectionScreen
            onSelect={selectSpecialist}
            onBack={() => setScreen("language")}
          />
        )}
      </ScreenContainer>
    </main>
  );
}

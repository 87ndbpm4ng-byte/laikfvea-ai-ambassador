"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { createAskAboutProductQuestion } from "@/lib/data/product-navigation";
import { getSuggestedQuestion } from "@/lib/data/suggested-questions";
import {
  getLanguageConfiguration,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n/languages";
import { getUiCopy } from "@/lib/i18n/ui-copy";
import { LiveAvatarService } from "@/lib/liveavatar/liveavatar-service";
import { activateVoiceSession } from "@/lib/voice/audio-session";
import { LiveAvatarSpeechSynthesisProvider } from "@/lib/voice/liveavatar-speech-synthesis";
import { OpenAISpeechSynthesisProvider } from "@/lib/voice/openai-speech-synthesis";
import type { JourneyScreen } from "@/types/conversation";
import type { GuideId } from "@/types/guide";
import type { ProductId } from "@/types/product";
import type { SupportedLanguage } from "@/types/language";

export default function Home() {
  const [screen, setScreen] = useState<JourneyScreen>("language");
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<GuideId | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductId>("everyday");
  const [voiceActivation, setVoiceActivation] =
    useState<Promise<boolean> | null>(null);
  const resetInProgressRef = useRef(false);
  const selectedGuide = selectedGuideId ? guides[selectedGuideId] : null;
  const activeLanguage = selectedLanguage ?? "en";
  const languageConfiguration = getLanguageConfiguration(activeLanguage);
  const copy = getUiCopy(activeLanguage);
  const conversation = useConversation(selectedGuide, selectedLanguage);
  const clearConversationHistory = conversation.clearHistory;
  const liveAvatarServices = useMemo(
    () => ({
      daniel: new LiveAvatarService({ guideId: "daniel" }),
      emily: new LiveAvatarService({ guideId: "emily" }),
    }),
    [],
  );
  const fallbackSpeechSynthesis = useMemo(
    () =>
      new OpenAISpeechSynthesisProvider({
        language: () => languageConfiguration.locale,
      }),
    [languageConfiguration.locale],
  );
  const speechSynthesis = useMemo(
    () => ({
      daniel: new LiveAvatarSpeechSynthesisProvider({
        avatar: liveAvatarServices.daniel,
        fallback: fallbackSpeechSynthesis,
        guideId: "daniel",
        language: () => languageConfiguration.locale,
      }),
      emily: new LiveAvatarSpeechSynthesisProvider({
        avatar: liveAvatarServices.emily,
        fallback: fallbackSpeechSynthesis,
        guideId: "emily",
        language: () => languageConfiguration.locale,
      }),
    }),
    [fallbackSpeechSynthesis, languageConfiguration.locale, liveAvatarServices],
  );
  useEffect(() => {
    document.documentElement.lang = activeLanguage;
  }, [activeLanguage]);

  useEffect(() => {
    for (const guideId of Object.keys(liveAvatarServices) as GuideId[]) {
      if (guideId !== selectedGuideId) {
        void liveAvatarServices[guideId].disconnect();
      }
    }
  }, [liveAvatarServices, selectedGuideId]);

  function openProduct(product: ProductId) {
    conversation.selectProduct(product);
    setSelectedProduct(product);
    setScreen("product-detail");
  }

  async function askAboutProduct() {
    await conversation.submitQuestion({
      content: createAskAboutProductQuestion(selectedProduct, activeLanguage),
      source: "product",
      relatedProduct: selectedProduct,
    });
    setScreen("conversation");
  }

  async function askAboutComparison() {
    const comparisonQuestion = getSuggestedQuestion("product-comparison");

    if (comparisonQuestion) {
      await conversation.submitQuestion({
        content:
          copy.topics[selectedGuideId ?? "daniel"][comparisonQuestion.id]
            ?.question ?? comparisonQuestion.label,
        source: "product",
        questionId: comparisonQuestion.id,
        relatedProduct: comparisonQuestion.relatedProduct,
      });
    }

    setScreen("conversation");
  }

  const resetVisitorSession = useCallback(() => {
    if (resetInProgressRef.current) return;
    resetInProgressRef.current = true;

    speechSynthesis.daniel.reset();
    speechSynthesis.emily.reset();
    fallbackSpeechSynthesis.reset();
    clearConversationHistory();
    setSelectedLanguage(null);
    setSelectedGuideId(null);
    setSelectedProduct("everyday");
    setVoiceActivation(null);
    setScreen("language");

    void Promise.all([
      liveAvatarServices.daniel.disconnect(),
      liveAvatarServices.emily.disconnect(),
    ]).finally(() => {
      resetInProgressRef.current = false;
    });
  }, [
    clearConversationHistory,
    fallbackSpeechSynthesis,
    liveAvatarServices,
    speechSynthesis,
  ]);

  useEffect(() => {
    return () => {
      speechSynthesis.daniel.reset();
      speechSynthesis.emily.reset();
      fallbackSpeechSynthesis.reset();
    };
  }, [fallbackSpeechSynthesis, speechSynthesis]);

  useEffect(
    () => () => {
      void liveAvatarServices.daniel.dispose();
      void liveAvatarServices.emily.dispose();
    },
    [liveAvatarServices],
  );

  function endSession() {
    resetVisitorSession();
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
              <h1 id="language-heading">{copy.languageHeading}</h1>
              <div
                className="language-grid"
                role="group"
                aria-label={copy.languagesAria}
              >
                {SUPPORTED_LANGUAGES.map((language) => (
                  <button
                    className="language-option"
                    type="button"
                    key={language.code}
                    onClick={() => {
                      setSelectedLanguage(language.code);
                      setScreen("idle");
                    }}
                    lang={language.code}
                  >
                    {language.nativeName}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : screen === "idle" ? (
          <SpecialistSelectionScreen
            language={activeLanguage}
            onSelect={selectSpecialist}
            onBack={() => setScreen("language")}
          />
        ) : screen === "conversation" && selectedGuideId ? (
          <ConversationScreen
            guideId={selectedGuideId}
            language={activeLanguage}
            messages={conversation.messages}
            isLoading={conversation.isLoading}
            onSubmitQuestion={conversation.submitQuestion}
            onProducts={() => setScreen("products")}
            onOpenProduct={openProduct}
            onEnd={endSession}
            onIdleTimeout={resetVisitorSession}
            synthesisProvider={speechSynthesis[selectedGuideId]}
            audioActivationProvider={fallbackSpeechSynthesis}
            voiceActivationPromise={voiceActivation}
            liveAvatarService={liveAvatarServices[selectedGuideId]}
          />
        ) : screen === "products" ? (
          <ProductExplorerScreen
            language={activeLanguage}
            onOpenProduct={openProduct}
            onCompare={() => setScreen("comparison")}
            onBack={() => setScreen("conversation")}
          />
        ) : screen === "product-detail" ? (
          <ProductDetailScreen
            language={activeLanguage}
            productId={selectedProduct}
            guideName={copy.guideDisplayName[selectedGuideId ?? "daniel"]}
            onBack={() => setScreen("products")}
            onCompare={() => setScreen("comparison")}
            onAskGuide={askAboutProduct}
          />
        ) : screen === "comparison" ? (
          <ProductComparisonScreen
            language={activeLanguage}
            onAsk={askAboutComparison}
            onBack={() => setScreen("products")}
          />
        ) : (
          <SpecialistSelectionScreen
            language={activeLanguage}
            onSelect={selectSpecialist}
            onBack={() => setScreen("language")}
          />
        )}
      </ScreenContainer>
    </main>
  );
}

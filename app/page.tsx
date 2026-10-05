"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScreenContainer } from "@/components/layout/screen-container";
import {
  AttractScreen,
  ConversationScreen,
  JourneyChoiceScreen,
  ProductComparisonScreen,
  ProductDetailScreen,
  ProductExplorerScreen,
  SpecialistSelectionScreen,
} from "@/components/screens/journey-screens";
import { useConversation } from "@/hooks/use-conversation";
import { guides } from "@/lib/data/guides";
import { createAskAboutProductQuestion } from "@/lib/data/product-navigation";
import { getSuggestedQuestion } from "@/lib/data/suggested-questions";
import { isExhibitionProductId } from "@/lib/data/exhibition-product-catalog";
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
import type { ExhibitionProductId, ProductId } from "@/types/product";
import type { SupportedLanguage } from "@/types/language";

type ExplorerOrigin = "choice" | "conversation";

type DeferredAiIntent =
  | { kind: "product"; productId: ExhibitionProductId }
  | { kind: "comparison" };

export default function Home() {
  const [screen, setScreen] = useState<JourneyScreen>("attract");
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<GuideId | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ExhibitionProductId>("everyday");
  const [explorerOrigin, setExplorerOrigin] =
    useState<ExplorerOrigin>("choice");
  const deferredAiIntentRef = useRef<DeferredAiIntent | null>(null);
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
    if (!isExhibitionProductId(product)) return;
    conversation.cancelPending();
    conversation.selectProduct(product);
    setSelectedProduct(product);
    setScreen("product-detail");
  }

  async function submitProductQuestion() {
    prepareSpecialistInteraction();
    await conversation.submitQuestion({
      content: createAskAboutProductQuestion(selectedProduct, activeLanguage),
      source: "product",
      relatedProduct: selectedProduct,
    });
    setScreen("conversation");
  }

  function askAboutProduct() {
    if (!selectedLanguage || !selectedGuideId) {
      conversation.cancelPending();
      deferredAiIntentRef.current = {
        kind: "product",
        productId: selectedProduct,
      };
      setScreen("language");
      return;
    }

    void submitProductQuestion();
  }

  async function submitComparisonQuestion() {
    const comparisonQuestion = getSuggestedQuestion("product-comparison");

    if (comparisonQuestion) {
      prepareSpecialistInteraction();
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

  function askAboutComparison() {
    if (!selectedLanguage || !selectedGuideId) {
      conversation.cancelPending();
      deferredAiIntentRef.current = { kind: "comparison" };
      setScreen("language");
      return;
    }

    void submitComparisonQuestion();
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
    setExplorerOrigin("choice");
    deferredAiIntentRef.current = null;
    setVoiceActivation(null);
    setScreen("attract");

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
    setSelectedGuideId(guideId);
    setScreen("conversation");
  }

  useEffect(() => {
    if (
      screen !== "conversation" ||
      !selectedGuideId ||
      !selectedLanguage ||
      !deferredAiIntentRef.current
    ) {
      return;
    }

    const intent = deferredAiIntentRef.current;
    deferredAiIntentRef.current = null;

    if (intent.kind === "product") {
      conversation.selectProduct(intent.productId);
      setSelectedProduct(intent.productId);
      const activation = activateVoiceSession(speechSynthesis[selectedGuideId]);
      setVoiceActivation(activation);
      void conversation.submitQuestion({
        content: createAskAboutProductQuestion(intent.productId, selectedLanguage),
        source: "product",
        relatedProduct: intent.productId,
      });
      return;
    }

    const comparisonQuestion = getSuggestedQuestion("product-comparison");
    if (!comparisonQuestion) return;

    const activation = activateVoiceSession(speechSynthesis[selectedGuideId]);
    setVoiceActivation(activation);
    void conversation.submitQuestion({
      content:
        getUiCopy(selectedLanguage).topics[selectedGuideId][comparisonQuestion.id]
          ?.question ?? comparisonQuestion.label,
      source: "product",
      questionId: comparisonQuestion.id,
      relatedProduct: comparisonQuestion.relatedProduct,
    });
  }, [
    conversation,
    selectedGuideId,
    selectedLanguage,
    speechSynthesis,
    screen,
  ]);

  function enterProductExplorer(origin: ExplorerOrigin) {
    if (origin === "conversation") {
      conversation.cancelPending();
    }
    setExplorerOrigin(origin);
    setScreen("products");
  }

  function prepareSpecialistInteraction() {
    if (!selectedGuideId) return;

    // A question is the first point at which voice and avatar output are needed.
    // LiveAvatarService deduplicates this with any concurrent speech connection.
    const activation = activateVoiceSession(speechSynthesis[selectedGuideId]);
    setVoiceActivation(activation);
  }

  return (
    <main>
      <ScreenContainer fullBleed={screen === "attract"}>
        {screen === "attract" ? (
          <AttractScreen
            language={activeLanguage}
            onBegin={() => setScreen("choice")}
          />
        ) : screen === "choice" ? (
          <JourneyChoiceScreen
            language={activeLanguage}
            onBack={() => {
              deferredAiIntentRef.current = null;
              setSelectedProduct("everyday");
              setScreen("attract");
            }}
            onSpeak={() => {
              deferredAiIntentRef.current = null;
              setSelectedProduct("everyday");
              setScreen("language");
            }}
            onExplore={() => {
              deferredAiIntentRef.current = null;
              enterProductExplorer("choice");
            }}
          />
        ) : screen === "language" ? (
          <section
            className="screen-content language-content"
            aria-labelledby="language-heading"
          >
            <button
              className="back-action"
              type="button"
              onClick={() => {
                deferredAiIntentRef.current = null;
                setSelectedProduct("everyday");
                setScreen("choice");
              }}
            >
              {copy.back}
            </button>
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
            conversationNotice={conversation.conversationNotice}
            onSubmitQuestion={conversation.submitQuestion}
            onRetryLastQuestion={conversation.retryLastQuestion}
            onProducts={() => {
              enterProductExplorer("conversation");
            }}
            onOpenProduct={openProduct}
            onEnd={endSession}
            onIdleTimeout={resetVisitorSession}
            synthesisProvider={speechSynthesis[selectedGuideId]}
            audioActivationProvider={speechSynthesis[selectedGuideId]}
            voiceActivationPromise={voiceActivation}
            liveAvatarService={liveAvatarServices[selectedGuideId]}
          />
        ) : screen === "products" ? (
          <ProductExplorerScreen
            language={activeLanguage}
            onOpenProduct={openProduct}
            backLabel={
              explorerOrigin === "choice" ? copy.back : copy.backToConversation
            }
            onBack={() => {
              if (explorerOrigin === "choice") {
                deferredAiIntentRef.current = null;
                setSelectedProduct("everyday");
                setScreen("choice");
                return;
              }
              setScreen("conversation");
            }}
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

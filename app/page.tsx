"use client";

import { useState } from "react";
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
import { PrimaryButton } from "@/components/ui/primary-button";
import { useConversation } from "@/hooks/use-conversation";
import { guides } from "@/lib/data/guides";
import { products } from "@/lib/data/products";
import { getSuggestedQuestion } from "@/lib/data/suggested-questions";
import type { JourneyScreen } from "@/types/conversation";
import type { GuideId } from "@/types/guide";
import type { ProductId } from "@/types/product";

const languages = ["English", "中文", "Русский", "Español"] as const;

export default function Home() {
  const [screen, setScreen] = useState<JourneyScreen>("idle");
  const [, setSelectedLanguage] = useState<string | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<GuideId | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductId>("everyday");
  const selectedGuide = selectedGuideId ? guides[selectedGuideId] : null;
  const conversation = useConversation(selectedGuide);

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
    setSelectedLanguage(null);
    setSelectedGuideId(null);
    setSelectedProduct("everyday");
    conversation.clearHistory();
    setScreen("idle");
  }

  return (
    <main>
      <ScreenContainer>
        {screen === "idle" ? (
          <section
            className="screen-content idle-content"
            aria-labelledby="idle-heading"
          >
            <h1 id="idle-heading">Curious about hydrogen technology?</h1>
            <p>Explore the technology, compare products and ask questions.</p>
            <PrimaryButton onClick={() => setScreen("language")}>
              Start
            </PrimaryButton>
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
                      setScreen("guide");
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
            onBack={() => setScreen("guide")}
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
            onEnd={() => setScreen("end")}
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

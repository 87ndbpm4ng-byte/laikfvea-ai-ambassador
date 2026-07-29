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
import {
  ConversationEntry,
  GuideId,
  JourneyScreen,
  ProductId,
  getPreparedResponse,
  products,
} from "@/lib/experience-data";

const languages = ["English", "中文", "Русский", "Español"] as const;

export default function Home() {
  const [screen, setScreen] = useState<JourneyScreen>("idle");
  const [, setSelectedLanguage] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<GuideId | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductId>("everyday");
  const [history, setHistory] = useState<ConversationEntry[]>([]);

  function askQuestion(question: string) {
    setHistory((entries) => [
      ...entries,
      {
        id: Date.now(),
        question,
        response: getPreparedResponse(question),
      },
    ]);
  }

  function openProduct(product: ProductId) {
    setSelectedProduct(product);
    setScreen("product-detail");
  }

  function askAboutProduct() {
    const product = products[selectedProduct];
    askQuestion(`Tell me about ${product.name}`);
    setScreen("conversation");
  }

  function askAboutComparison() {
    askQuestion("Compare the available products");
    setScreen("conversation");
  }

  function restartSession() {
    setSelectedLanguage(null);
    setSelectedGuide(null);
    setSelectedProduct("everyday");
    setHistory([]);
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
            selectedGuide={selectedGuide}
            onSelect={setSelectedGuide}
            onBack={() => setScreen("language")}
            onContinue={() => setScreen("introduction")}
          />
        ) : screen === "introduction" && selectedGuide ? (
          <GuideIntroductionScreen
            guideId={selectedGuide}
            onBack={() => setScreen("guide")}
            onBegin={() => setScreen("conversation")}
          />
        ) : screen === "conversation" && selectedGuide ? (
          <ConversationScreen
            guideId={selectedGuide}
            history={history}
            onAsk={askQuestion}
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
            selectedGuide={selectedGuide}
            onSelect={setSelectedGuide}
            onBack={() => setScreen("language")}
            onContinue={() => setScreen("introduction")}
          />
        )}
      </ScreenContainer>
    </main>
  );
}

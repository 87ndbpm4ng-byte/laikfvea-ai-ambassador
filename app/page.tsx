"use client";

import { useState } from "react";
import { ScreenContainer } from "@/components/layout/screen-container";
import { PrimaryButton } from "@/components/ui/primary-button";

const languages = ["English", "中文", "Русский", "Español"] as const;

export default function Home() {
  const [screen, setScreen] = useState<"idle" | "language">("idle");

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
        ) : (
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
        )}
      </ScreenContainer>
    </main>
  );
}

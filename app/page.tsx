"use client";

import { useState } from "react";
import { ScreenContainer } from "@/components/layout/screen-container";
import { GuideCard } from "@/components/ui/guide-card";
import { PrimaryButton } from "@/components/ui/primary-button";

const languages = ["English", "中文", "Русский", "Español"] as const;
const guides = [
  {
    initial: "E",
    name: "Emily",
    role: "Wellness Specialist",
    focusAreas: ["Daily use", "Recovery", "Lifestyle"],
  },
  {
    initial: "D",
    name: "Daniel",
    role: "Technology Specialist",
    focusAreas: [
      "Hydrogen technology",
      "Engineering",
      "Product comparisons",
    ],
  },
] as const;

export default function Home() {
  const [screen, setScreen] = useState<"idle" | "language" | "guide">("idle");
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

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
                    onClick={() => setScreen("guide")}
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
        ) : (
          <section
            className="screen-content guide-content"
            aria-labelledby="guide-heading"
          >
            <button
              className="back-action"
              type="button"
              onClick={() => setScreen("language")}
            >
              Back
            </button>

            <header className="guide-header">
              <h1 id="guide-heading">Meet your guide</h1>
              <p>
                Choose the specialist who will introduce you to hydrogen
                technology.
              </p>
            </header>

            <div
              className="guide-grid"
              role="group"
              aria-label="Product specialists"
            >
              {guides.map((guide) => (
                <GuideCard
                  {...guide}
                  key={guide.name}
                  selected={selectedGuide === guide.name}
                  onSelect={() => setSelectedGuide(guide.name)}
                />
              ))}
            </div>

            <div className="guide-action">
              <PrimaryButton disabled={!selectedGuide}>Continue</PrimaryButton>
            </div>
          </section>
        )}
      </ScreenContainer>
    </main>
  );
}

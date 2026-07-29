"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { GuideCard } from "@/components/ui/guide-card";
import { PrimaryButton } from "@/components/ui/primary-button";
import { VoiceControls } from "@/components/ui/voice-controls";
import { useVoiceMode } from "@/hooks/use-voice-mode";
import { guides } from "@/lib/data/guides";
import {
  productComparisonRows,
  products,
} from "@/lib/data/products";
import { suggestedQuestions } from "@/lib/data/suggested-questions";
import type {
  ConversationMessage,
  SuggestedQuestion,
} from "@/types/conversation";
import type { GuideId } from "@/types/guide";
import type { ProductId } from "@/types/product";

type GuideSelectionScreenProps = {
  selectedGuide: GuideId | null;
  onSelect: (guide: GuideId) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function GuideSelectionScreen({
  selectedGuide,
  onSelect,
  onBack,
  onContinue,
}: GuideSelectionScreenProps) {
  return (
    <section
      className="screen-content guide-content"
      aria-labelledby="guide-heading"
    >
      <button className="back-action" type="button" onClick={onBack}>
        Back
      </button>

      <header className="guide-header">
        <h1 id="guide-heading">Meet your guide</h1>
        <p>
          Choose the specialist who will introduce you to hydrogen technology.
        </p>
      </header>

      <div
        className="guide-grid"
        role="group"
        aria-label="Product specialists"
      >
        {Object.values(guides).map((guide) => (
          <GuideCard
            {...guide}
            key={guide.id}
            selected={selectedGuide === guide.id}
            onSelect={() => onSelect(guide.id)}
          />
        ))}
      </div>

      <div className="guide-action">
        <PrimaryButton disabled={!selectedGuide} onClick={onContinue}>
          Continue
        </PrimaryButton>
      </div>
    </section>
  );
}

type GuideIntroductionScreenProps = {
  guideId: GuideId;
  onBack: () => void;
  onBegin: () => void;
};

export function GuideIntroductionScreen({
  guideId,
  onBack,
  onBegin,
}: GuideIntroductionScreenProps) {
  const guide = guides[guideId];

  return (
    <section
      className="screen-content introduction-content"
      aria-labelledby="introduction-heading"
    >
      <button className="back-action" type="button" onClick={onBack}>
        Back
      </button>

      <div className="introduction-portrait" aria-hidden="true">
        {guide.initial}
      </div>
      <h1 id="introduction-heading">Hello, I’m {guide.name}.</h1>
      <p>{guide.introduction}</p>
      <PrimaryButton onClick={onBegin}>Begin</PrimaryButton>
    </section>
  );
}

type ConversationScreenProps = {
  guideId: GuideId;
  messages: ConversationMessage[];
  isLoading: boolean;
  onAskSuggested: (question: SuggestedQuestion) => Promise<boolean>;
  onAskText: (question: string) => Promise<boolean>;
  onProducts: () => void;
  onEnd: () => void;
};

type ConversationTurn = {
  visitor: ConversationMessage;
  guide?: ConversationMessage;
};

function createConversationTurns(messages: ConversationMessage[]) {
  return messages.reduce<ConversationTurn[]>((turns, message) => {
    if (message.role === "visitor") {
      turns.push({ visitor: message });
    } else if (message.role === "guide") {
      const currentTurn = turns.at(-1);

      if (currentTurn && !currentTurn.guide) {
        currentTurn.guide = message;
      }
    }

    return turns;
  }, []);
}

export function ConversationScreen({
  guideId,
  messages,
  isLoading,
  onAskSuggested,
  onAskText,
  onProducts,
  onEnd,
}: ConversationScreenProps) {
  const guide = guides[guideId];
  const [draft, setDraft] = useState("");
  const conversationTurns = createConversationTurns(messages);
  const voice = useVoiceMode({
    guideId,
    messages,
    isConversationLoading: isLoading,
    submitTranscript: onAskText,
  });

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();

    if (!question || isLoading) {
      return;
    }

    const submitted = await onAskText(question);

    if (submitted) {
      setDraft("");
    }
  }

  function submitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section
      className="screen-content conversation-content"
      aria-labelledby="conversation-heading"
    >
      <header className="conversation-header">
        <div>
          <p className="guide-context">{guide.role}</p>
          <h1 id="conversation-heading">{guide.name}</h1>
        </div>
        <button className="text-action" type="button" onClick={onEnd}>
          End Session
        </button>
      </header>

      <div
        className="response-area"
        aria-live="polite"
        aria-label="Conversation"
        aria-busy={isLoading}
      >
        {conversationTurns.length === 0 ? (
          <div className="response-welcome">
            <p>
              Ask a question or choose a topic below. I’ll use the approved
              information available in this demonstration.
            </p>
          </div>
        ) : (
          <ol className="conversation-history">
            {conversationTurns.map((turn) => (
              <li className="conversation-entry" key={turn.visitor.id}>
                <div className="visitor-question">
                  <span>You asked</span>
                  <p>{turn.visitor.content}</p>
                </div>
                {turn.guide ? (
                  <div className="guide-response">
                    <span>{guide.name}</span>
                    <p>{turn.guide.content}</p>
                  </div>
                ) : (
                  <div className="guide-response">
                    <span>{guide.name}</span>
                    <p>Preparing response…</p>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="suggested-questions" aria-label="Suggested questions">
        {suggestedQuestions.map((question) => (
          <button
            className="suggestion-button"
            type="button"
            key={question.id}
            disabled={isLoading}
            onClick={() => onAskSuggested(question)}
          >
            {question.label}
          </button>
        ))}
      </div>

      <form className="composer" onSubmit={submitQuestion}>
        <label className="sr-only" htmlFor="visitor-question">
          Ask your guide
        </label>
        <input
          id="visitor-question"
          value={draft}
          disabled={isLoading}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={submitOnEnter}
          placeholder="Ask your guide"
        />
        <button
          className="composer-send"
          type="submit"
          disabled={!draft.trim() || isLoading}
        >
          {isLoading ? "Sending" : "Send"}
        </button>
      </form>

      <VoiceControls
        enabled={voice.isEnabled}
        inputState={voice.inputState}
        outputState={voice.outputState}
        playbackProvider={voice.playbackProvider}
        playbackBlocked={voice.isPlaybackBlocked}
        guideName={guide.name}
        transcript={voice.transcript}
        error={voice.error}
        recognitionSupported={voice.isRecognitionSupported}
        synthesisSupported={voice.isSynthesisSupported}
        disabled={isLoading}
        onEnabledChange={voice.setEnabled}
        onStartListening={voice.startListening}
        onStopListening={voice.stopListening}
        onStopSpeaking={voice.stopSpeaking}
        onRetryPlayback={voice.retryPlayback}
      />

      <button className="explorer-action" type="button" onClick={onProducts}>
        Explore Products
      </button>
    </section>
  );
}

type ProductExplorerScreenProps = {
  onOpenProduct: (product: ProductId) => void;
  onCompare: () => void;
  onBack: () => void;
};

export function ProductExplorerScreen({
  onOpenProduct,
  onCompare,
  onBack,
}: ProductExplorerScreenProps) {
  return (
    <section
      className="screen-content products-content"
      aria-labelledby="products-heading"
    >
      <header className="section-header">
        <h1 id="products-heading">Product Explorer</h1>
        <p>Explore the two products available in this demonstration.</p>
      </header>

      <div className="product-grid">
        {Object.values(products).map((product) => (
          <button
            className="product-card"
            type="button"
            key={product.id}
            onClick={() => onOpenProduct(product.id)}
          >
            <span className="product-image-placeholder" aria-hidden="true">
              {product.shortName}
            </span>
            <span className="product-card-copy">
              <span className="product-name">{product.name}</span>
              <span className="product-summary">{product.overview}</span>
              <span className="product-link">View product</span>
            </span>
          </button>
        ))}
      </div>

      <div className="screen-actions">
        <PrimaryButton onClick={onCompare}>Compare Products</PrimaryButton>
        <button className="secondary-action" type="button" onClick={onBack}>
          Back to Conversation
        </button>
      </div>
    </section>
  );
}

type ProductDetailScreenProps = {
  productId: ProductId;
  onBack: () => void;
  onCompare: () => void;
  onAskGuide: () => void;
};

export function ProductDetailScreen({
  productId,
  onBack,
  onCompare,
  onAskGuide,
}: ProductDetailScreenProps) {
  const product = products[productId];

  return (
    <section
      className="screen-content detail-content"
      aria-labelledby="product-detail-heading"
    >
      <button className="back-action" type="button" onClick={onBack}>
        Back
      </button>

      <div className="detail-grid">
        <div className="detail-image-placeholder" aria-hidden="true">
          {product.shortName}
        </div>
        <div className="detail-copy">
          <h1 id="product-detail-heading">{product.name}</h1>
          <p className="detail-overview">{product.overview}</p>

          <div className="detail-lists">
            <div>
              <h2>Key features</h2>
              <ul>
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2>Use cases</h2>
              <ul>
                {product.useCases.map((useCase) => (
                  <li key={useCase}>{useCase}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="screen-actions">
        <PrimaryButton onClick={onCompare}>Compare</PrimaryButton>
        <button
          className="secondary-action"
          type="button"
          onClick={onAskGuide}
        >
          Ask the guide
        </button>
      </div>
    </section>
  );
}

type ProductComparisonScreenProps = {
  onAsk: () => void;
  onBack: () => void;
};

export function ProductComparisonScreen({
  onAsk,
  onBack,
}: ProductComparisonScreenProps) {
  return (
    <section
      className="screen-content comparison-content"
      aria-labelledby="comparison-heading"
    >
      <header className="section-header">
        <h1 id="comparison-heading">Compare the bottles</h1>
        <p>A simple view of the listed capabilities.</p>
      </header>

      <div className="comparison-table-wrap">
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">Feature</th>
              <th scope="col">{products.everyday.name}</th>
              <th scope="col">{products.advanced.name}</th>
            </tr>
          </thead>
          <tbody>
            {productComparisonRows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                <td>{row.everyday}</td>
                <td>{row.advanced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="screen-actions">
        <PrimaryButton onClick={onAsk}>Ask about this comparison</PrimaryButton>
        <button className="secondary-action" type="button" onClick={onBack}>
          Back to Products
        </button>
      </div>
    </section>
  );
}

type SessionEndScreenProps = {
  onRestart: () => void;
  onReturn: () => void;
};

export function SessionEndScreen({
  onRestart,
  onReturn,
}: SessionEndScreenProps) {
  return (
    <section
      className="screen-content end-content"
      aria-labelledby="end-heading"
    >
      <h1 id="end-heading">Thank you for visiting.</h1>
      <div className="screen-actions">
        <PrimaryButton onClick={onRestart}>Start Again</PrimaryButton>
        <button className="secondary-action" type="button" onClick={onReturn}>
          Return to Conversation
        </button>
      </div>
    </section>
  );
}

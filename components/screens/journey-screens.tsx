"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { LiveAvatarRenderer } from "@/components/liveavatar/liveavatar-renderer";
import { PresentationLayer } from "@/components/presentation/presentation-layer";
import { PrimaryButton } from "@/components/ui/primary-button";
import { VoiceControls } from "@/components/ui/voice-controls";
import { useVoiceMode } from "@/hooks/use-voice-mode";
import { useLiveAvatarIdleTimeout } from "@/hooks/use-liveavatar-idle-timeout";
import { guides } from "@/lib/data/guides";
import { productComparisonRows, products } from "@/lib/data/products";
import { suggestedQuestions } from "@/lib/data/suggested-questions";
import type { SpeechSynthesisProvider } from "@/lib/voice/voice-types";
import type { LiveAvatarOutput } from "@/lib/liveavatar/liveavatar-types";
import type {
  ConversationMessage,
  QuestionSubmission,
  SuggestedQuestion,
} from "@/types/conversation";
import type { GuideId } from "@/types/guide";
import type { ProductId } from "@/types/product";
import type { SupportedLanguage } from "@/types/language";
import { getUiCopy } from "@/lib/i18n/ui-copy";

export function SpecialistSelectionScreen({
  language,
  onSelect,
  onBack,
}: {
  language: SupportedLanguage;
  onSelect: (guideId: GuideId) => void;
  onBack: () => void;
}) {
  const copy = getUiCopy(language);
  return (
    <section
      className="screen-content idle-content"
      aria-labelledby="specialist-heading"
    >
      <button className="back-action" type="button" onClick={onBack}>
        {copy.back}
      </button>
      <header className="idle-header">
        <p className="idle-eyebrow">{copy.guidedConversation}</p>
        <h1 id="specialist-heading">{copy.specialistsHeading}</h1>
        <p className="idle-support">{copy.specialistsSupport}</p>
      </header>

      <div className="idle-specialist-grid" aria-label={copy.specialistsAria}>
        {Object.values(guides).map((guide) => (
          <article className="idle-specialist-card" key={guide.id}>
            <div
              className="idle-specialist-portrait"
              role="img"
              aria-label={copy.visualPreviewUnavailable(guide.name)}
            >
              <span className="specialist-silhouette" aria-hidden="true">
                <i />
                <i />
              </span>
              <small>{copy.visualPreview}</small>
            </div>
            <div className="idle-specialist-copy">
              <h2>{copy.guideDisplayName[guide.id]}</h2>
              <p>{copy.guideRole[guide.id]}</p>
              <span>{copy.guideDescription[guide.id]}</span>
              <button
                className="idle-specialist-action"
                type="button"
                onClick={() => onSelect(guide.id)}
                aria-label={`${copy.speakWith(guide.name)}, ${copy.guideRole[guide.id]}`}
              >
                {copy.speakWith(guide.name)}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type ConversationScreenProps = {
  guideId: GuideId;
  language: SupportedLanguage;
  messages: ConversationMessage[];
  isLoading: boolean;
  onSubmitQuestion: (question: QuestionSubmission) => Promise<boolean>;
  onProducts: () => void;
  onOpenProduct: (product: ProductId) => void;
  onEnd: () => void;
  onIdleTimeout: () => void;
  synthesisProvider?: SpeechSynthesisProvider;
  audioActivationProvider?: SpeechSynthesisProvider;
  voiceActivationPromise?: Promise<boolean> | null;
  liveAvatarService?: LiveAvatarOutput;
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
  language,
  messages,
  isLoading,
  onSubmitQuestion,
  onProducts,
  onOpenProduct,
  onEnd,
  onIdleTimeout,
  synthesisProvider,
  audioActivationProvider,
  voiceActivationPromise,
  liveAvatarService,
}: ConversationScreenProps) {
  const guide = guides[guideId];
  const copy = getUiCopy(language);
  const guideDisplayName = copy.guideDisplayName[guideId];
  const quickTopics = suggestedQuestions.map((suggestedQuestion) => ({
    suggestedQuestion,
    ...copy.topics[guideId][suggestedQuestion.id],
  }));
  const [draft, setDraft] = useState("");
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const conversationTurns = createConversationTurns(messages);
  const latestVisitorMessage = [...messages]
    .reverse()
    .find((message) => message.role === "visitor");
  const latestRelatedProduct = [...messages]
    .reverse()
    .find((message) => message.relatedProduct)?.relatedProduct;
  const isComparisonContext = Boolean(
    latestVisitorMessage &&
    /\b(compare|comparison|both|products)\b/i.test(
      latestVisitorMessage.content,
    ),
  );
  const contextualProductIds: ProductId[] = isComparisonContext
    ? ["everyday", "advanced"]
    : latestRelatedProduct
      ? [latestRelatedProduct]
      : [];
  const voice = useVoiceMode({
    guideId,
    messages,
    isConversationLoading: isLoading,
    submitTranscript: (content) =>
      onSubmitQuestion({ content, source: "voice" }),
    synthesisProvider,
    audioActivationProvider,
    activationPromise: voiceActivationPromise,
    enabledByDefault: true,
    language,
  });
  const idleTimeout = useLiveAvatarIdleTimeout({
    service: liveAvatarService,
    active: true,
    systemBusy:
      isLoading ||
      voice.inputState === "listening" ||
      voice.inputState === "processing" ||
      voice.outputState === "speaking" ||
      voice.isPreparingVoice,
    onTimeout: onIdleTimeout,
  });

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  async function submitTypedQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();

    if (!question || isLoading) {
      return;
    }

    voice.prepareQuestionSubmission();
    const submitted = await onSubmitQuestion({
      content: question,
      source: "typed",
    });

    if (submitted) {
      setDraft("");
    } else {
      voice.cancelQuestionSubmission();
    }
  }

  async function submitQuickTopic(question: SuggestedQuestion) {
    voice.prepareQuestionSubmission();
    const submitted = await onSubmitQuestion({
      content: question.label,
      source: "quick-topic",
      questionId: question.id,
      relatedProduct: question.relatedProduct,
    });

    if (!submitted) voice.cancelQuestionSubmission();
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
      {!isOnline ? (
        <p className="connection-status" role="status">
          {copy.connectionLost}
        </p>
      ) : null}
      {idleTimeout.showWarning && idleTimeout.remainingSeconds !== null ? (
        <div
          className="liveavatar-idle-warning"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="liveavatar-idle-warning-title"
        >
          <div>
            <h2 id="liveavatar-idle-warning-title">{copy.stillExploring}</h2>
            <p>{copy.restartCountdown(idleTimeout.remainingSeconds)}</p>
            <PrimaryButton onClick={idleTimeout.continueSession}>
              {copy.continueSession}
            </PrimaryButton>
          </div>
        </div>
      ) : null}

      <div className="conversation-workspace">
        <aside className="conversation-specialist">
          {liveAvatarService ? (
            <LiveAvatarRenderer
              service={liveAvatarService}
              guideId={guideId}
              language={language}
              idleSecondsRemaining={idleTimeout.remainingSeconds}
            />
          ) : (
            <div
              className="specialist-static-stage"
              role="img"
              aria-label={`${guideDisplayName}, ${copy.guideRole[guideId]}. ${copy.visualUnavailable} ${copy.voiceRemainsAvailable}`}
            >
              <span className="specialist-silhouette" aria-hidden="true">
                <i />
                <i />
              </span>
              <div>
                <strong>{guideDisplayName}</strong>
                <p>{copy.guideRole[guideId]}</p>
                <small>
                  {copy.visualUnavailable} {copy.voiceRemainsAvailable}
                </small>
              </div>
            </div>
          )}

          <VoiceControls
            inputState={voice.inputState}
            outputState={voice.outputState}
            playbackBlocked={voice.isPlaybackBlocked}
            audioSessionActivated={voice.isAudioSessionActivated}
            preparingVoice={voice.isPreparingVoice}
            activationFailed={voice.activationFailed}
            guideName={guide.name}
            language={language}
            transcript={voice.transcript}
            error={voice.error}
            recognitionSupported={voice.isRecognitionSupported}
            synthesisSupported={voice.isSynthesisSupported}
            disabled={isLoading}
            onStartListening={voice.startListening}
            onStopListening={voice.stopListening}
            onRetryPlayback={voice.retryPlayback}
          />

          <button
            className="specialist-end-action"
            type="button"
            onClick={onEnd}
          >
            {copy.endSession}
          </button>
        </aside>

        <main className="conversation-dialogue">
          <header className="conversation-header">
            <div>
              <p className="guide-context">{copy.guideRole[guideId]}</p>
              <h1 id="conversation-heading">{copy.conversationWith(guide.name)}</h1>
            </div>
          </header>

          <div className="conversation-response-presentation">
            <div
              className="response-area"
              aria-live="polite"
              aria-label={copy.conversationAria}
              aria-busy={isLoading}
            >
              {conversationTurns.length === 0 ? (
                <div className="response-welcome">
                  <strong>{copy.whatToUnderstand}</strong>
                  <p>{copy.welcomeSupport(guide.name)}</p>
                </div>
              ) : (
                <ol className="conversation-history">
                  {conversationTurns.map((turn) => (
                    <li className="conversation-entry" key={turn.visitor.id}>
                      <div className="visitor-question">
                        <span>{copy.youAsked}</span>
                        <p>{turn.visitor.content}</p>
                      </div>
                      {turn.guide ? (
                        <div className="guide-response">
                          <span>{guideDisplayName}</span>
                          <p>{turn.guide.content}</p>
                        </div>
                      ) : (
                        <div className="guide-response is-preparing">
                          <span>{guideDisplayName}</span>
                          <p>
                            <span className="thinking-dots" aria-hidden="true">
                              <i />
                              <i />
                              <i />
                            </span>
                            <span className="sr-only">{copy.preparingResponse}</span>
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <PresentationLayer conversationState={{ messages }} />
          </div>

          <section
            className="conversation-topics"
            aria-labelledby="quick-topics-heading"
          >
            <div className="context-heading">
              <p id="quick-topics-heading">{copy.quickTopics}</p>
              <span>{copy.chooseStartingPoint}</span>
            </div>
            <div className="quick-topic-list">
              {quickTopics.map(
                ({ suggestedQuestion, question, title, description }) => (
                <button
                  className="quick-topic-card"
                  type="button"
                  key={suggestedQuestion.id}
                  disabled={isLoading}
                  onClick={() =>
                    void submitQuickTopic({
                      ...suggestedQuestion,
                      label: question,
                    })
                  }
                >
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                </button>
                ),
              )}
            </div>
          </section>

          <div className="conversation-product-actions">
            {contextualProductIds.map((productId) => (
              <button
                type="button"
                key={productId}
                onClick={() => onOpenProduct(productId)}
              >
                {copy.viewProduct(products[productId].name)}
              </button>
            ))}
            <button type="button" onClick={onProducts}>
              {copy.exploreProducts}
            </button>
          </div>

          <form className="composer" onSubmit={submitTypedQuestion}>
            <label className="sr-only" htmlFor="visitor-question">
              {copy.askQuestion(guide.name)}
            </label>
            <input
              id="visitor-question"
              value={draft}
              disabled={isLoading}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={submitOnEnter}
              placeholder={copy.askQuestion(guide.name)}
            />
            <button
              className="composer-send"
              type="submit"
              disabled={!draft.trim() || isLoading}
            >
              {isLoading ? copy.sending : copy.send}
            </button>
          </form>
        </main>
      </div>
    </section>
  );
}

type ProductExplorerScreenProps = {
  language: SupportedLanguage;
  onOpenProduct: (product: ProductId) => void;
  onCompare: () => void;
  onBack: () => void;
};

export function ProductExplorerScreen({
  language,
  onOpenProduct,
  onCompare,
  onBack,
}: ProductExplorerScreenProps) {
  const copy = getUiCopy(language);
  return (
    <section
      className="screen-content products-content"
      aria-labelledby="products-heading"
    >
      <header className="section-header">
        <h1 id="products-heading">{copy.productExplorer}</h1>
        <p>{copy.productExplorerSupport}</p>
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
              <span className="product-summary">{copy.productOverview[product.id]}</span>
              <span className="product-link">{copy.viewProductLabel}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="screen-actions">
        <PrimaryButton onClick={onCompare}>{copy.compareProducts}</PrimaryButton>
        <button className="secondary-action" type="button" onClick={onBack}>
          {copy.backToConversation}
        </button>
      </div>
    </section>
  );
}

type ProductDetailScreenProps = {
  language: SupportedLanguage;
  productId: ProductId;
  onBack: () => void;
  onCompare: () => void;
  onAskGuide: () => void;
};

export function ProductDetailScreen({
  language,
  productId,
  onBack,
  onCompare,
  onAskGuide,
}: ProductDetailScreenProps) {
  const product = products[productId];
  const copy = getUiCopy(language);

  return (
    <section
      className="screen-content detail-content"
      aria-labelledby="product-detail-heading"
    >
      <button className="back-action" type="button" onClick={onBack}>
        {copy.back}
      </button>

      <div className="detail-grid">
        <div className="detail-image-placeholder" aria-hidden="true">
          {product.shortName}
        </div>
        <div className="detail-copy">
          <h1 id="product-detail-heading">{product.name}</h1>
          <p className="detail-overview">{copy.productOverview[product.id]}</p>

          <div className="detail-lists">
            <div>
              <h2>{copy.keyFeatures}</h2>
              <ul>
                {copy.productFeatures[product.id].map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2>{copy.useCases}</h2>
              <ul>
                {copy.productUseCases[product.id].map((useCase) => (
                  <li key={useCase}>{useCase}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="screen-actions">
        <PrimaryButton onClick={onCompare}>{copy.compare}</PrimaryButton>
        <button className="secondary-action" type="button" onClick={onAskGuide}>
          {copy.askGuide}
        </button>
      </div>
    </section>
  );
}

type ProductComparisonScreenProps = {
  language: SupportedLanguage;
  onAsk: () => void;
  onBack: () => void;
};

export function ProductComparisonScreen({
  language,
  onAsk,
  onBack,
}: ProductComparisonScreenProps) {
  const copy = getUiCopy(language);
  return (
    <section
      className="screen-content comparison-content"
      aria-labelledby="comparison-heading"
    >
      <header className="section-header">
        <h1 id="comparison-heading">{copy.compareBottles}</h1>
        <p>{copy.comparisonSupport}</p>
      </header>

      <div className="comparison-table-wrap">
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">{copy.feature}</th>
              <th scope="col">{products.everyday.name}</th>
              <th scope="col">{products.advanced.name}</th>
            </tr>
          </thead>
          <tbody>
            {productComparisonRows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{copy.comparisonRows[row.id].label}</th>
                <td>{copy.comparisonRows[row.id].everyday}</td>
                <td>{copy.comparisonRows[row.id].advanced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="screen-actions">
        <PrimaryButton onClick={onAsk}>{copy.askComparison}</PrimaryButton>
        <button className="secondary-action" type="button" onClick={onBack}>
          {copy.backToProducts}
        </button>
      </div>
    </section>
  );
}

type SessionEndScreenProps = {
  language: SupportedLanguage;
  onRestart: () => void;
  onReturn: () => void;
};

export function SessionEndScreen({
  language,
  onRestart,
  onReturn,
}: SessionEndScreenProps) {
  const copy = getUiCopy(language);
  return (
    <section
      className="screen-content end-content"
      aria-labelledby="end-heading"
    >
      <div className="end-mark" aria-hidden="true">
        <span />
      </div>
      <h1 id="end-heading">{copy.thankYou}</h1>
      <div className="screen-actions">
        <PrimaryButton onClick={onRestart}>{copy.startAgain}</PrimaryButton>
        <button className="secondary-action" type="button" onClick={onReturn}>
          {copy.returnToConversation}
        </button>
      </div>
    </section>
  );
}

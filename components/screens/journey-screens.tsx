"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LiveAvatarRenderer } from "@/components/liveavatar/liveavatar-renderer";
import { PresentationLayer } from "@/components/presentation/presentation-layer";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ProductManualDialog } from "@/components/ui/product-manual-dialog";
import { VoiceControls } from "@/components/ui/voice-controls";
import { useVoiceMode } from "@/hooks/use-voice-mode";
import { useLiveAvatarIdleTimeout } from "@/hooks/use-liveavatar-idle-timeout";
import { guides } from "@/lib/data/guides";
import { products } from "@/lib/data/products";
import {
  getExhibitionProductCatalog,
} from "@/lib/data/exhibition-product-catalog";
import { getProductManual } from "@/lib/data/product-manuals";
import {
  exhibitionProductList,
  exhibitionProducts,
  productCategoryNames,
} from "@/lib/data/exhibition-products";
import {
  getGeneralQuickQuestions,
  getProductQuickQuestions,
  resolveQuickQuestionProduct,
  type QuickQuestion,
} from "@/lib/data/quick-questions";
import type { SpeechSynthesisProvider } from "@/lib/voice/voice-types";
import type { LiveAvatarOutput } from "@/lib/liveavatar/liveavatar-types";
import type {
  ConversationMessage,
  QuestionSubmission,
} from "@/types/conversation";
import type { GuideId } from "@/types/guide";
import type {
  BottleProductId,
  ExhibitionProductId,
  ProductId,
} from "@/types/product";
import type { SupportedLanguage } from "@/types/language";
import { getUiCopy } from "@/lib/i18n/ui-copy";
import { MAX_CONVERSATION_MESSAGE_LENGTH } from "@/lib/conversation/conversation-limits";

const specialistPreviews = {
  emily: {
    src: "/specialists/emily-preview.png",
    alt: "Emily — Wellness Specialist",
    objectPosition: "50% 34%",
  },
  daniel: {
    src: "/specialists/daniel-preview.png",
    alt: "Daniel — Technology Specialist",
    objectPosition: "50% 30%",
  },
} satisfies Record<
  GuideId,
  { src: string; alt: string; objectPosition: string }
>;

export function AttractScreen({
  language,
  onBegin,
}: {
  language: SupportedLanguage;
  onBegin: () => void;
}) {
  const copy = getUiCopy(language);

  return (
    <section
      className="screen-content attract-content attract-content-video"
      aria-labelledby="attract-heading"
    >
      <video
        className="attract-video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/kiosk/idle-bubbles.mp4" type="video/mp4" />
      </video>
      <div className="attract-veil" aria-hidden="true" />
      <h1 id="attract-heading" className="sr-only">
        {copy.attractHeading}
      </h1>
      <button className="attract-action" type="button" onClick={onBegin}>
        <span>{copy.attractAction}</span>
      </button>
    </section>
  );
}

export function JourneyChoiceScreen({
  language,
  onSpeak,
  onExplore,
  onBack,
}: {
  language: SupportedLanguage;
  onSpeak: () => void;
  onExplore: () => void;
  onBack: () => void;
}) {
  const copy = getUiCopy(language);

  return (
    <section
      className="screen-content journey-choice-content"
      aria-labelledby="journey-choice-heading"
    >
      <button className="back-action" type="button" onClick={onBack}>
        {copy.back}
      </button>
      <header className="journey-choice-header">
        <h1 id="journey-choice-heading">{copy.journeyChoiceHeading}</h1>
      </header>
      <div
        className="journey-choice-grid"
        role="group"
        aria-label={copy.journeyChoiceHeading}
      >
        <button
          className="journey-choice-card journey-choice-card--assistant"
          type="button"
          onClick={onSpeak}
        >
          <strong>{copy.speakToAiAmbassador}</strong>
          <span>{copy.speakToAiAmbassadorSupport}</span>
        </button>
        <button
          className="journey-choice-card journey-choice-card--products"
          type="button"
          onClick={onExplore}
        >
          <strong>{copy.exploreProductsChoice}</strong>
          <span>{copy.exploreProductsChoiceSupport}</span>
        </button>
      </div>
    </section>
  );
}

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
        {Object.values(guides).map((guide) => {
          const preview = specialistPreviews[guide.id];

          return (
            <article className="idle-specialist-card" key={guide.id}>
              <div className="idle-specialist-portrait">
                <Image
                  className="idle-specialist-preview"
                  src={preview.src}
                  alt={preview.alt}
                  fill
                  priority
                  sizes="(max-width: 47.999rem) 8.5rem, (max-width: 63.999rem) 100vw, 42vw"
                  style={{ objectPosition: preview.objectPosition }}
                />
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
          );
        })}
      </div>
    </section>
  );
}

type ConversationScreenProps = {
  guideId: GuideId;
  language: SupportedLanguage;
  messages: ConversationMessage[];
  isLoading: boolean;
  conversationNotice?: string | null;
  onSubmitQuestion: (question: QuestionSubmission) => Promise<boolean>;
  onRetryLastQuestion: () => Promise<boolean>;
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
  conversationNotice,
  onSubmitQuestion,
  onRetryLastQuestion,
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
  const [draft, setDraft] = useState("");
  const [isEndConfirmationOpen, setIsEndConfirmationOpen] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const latestTurnRef = useRef<HTMLLIElement | null>(null);
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
  const latestExplicitProduct = [...messages]
    .reverse()
    .filter((message) => message.role === "visitor")
    .map((message) => resolveQuickQuestionProduct(message.content, language))
    .find((productId): productId is ProductId => productId !== null);
  const quickQuestionProduct = latestExplicitProduct ?? latestRelatedProduct;
  const activeProductName = quickQuestionProduct
    ? exhibitionProducts[quickQuestionProduct].displayNames[language]
    : null;
  const quickQuestions = quickQuestionProduct
    ? getProductQuickQuestions(quickQuestionProduct, language)
    : getGeneralQuickQuestions(language);
  const isComparisonContext = Boolean(
    latestVisitorMessage &&
    /\b(compare|comparison|both|products)\b/i.test(
      latestVisitorMessage.content,
    ),
  );
  const contextualProductIds: BottleProductId[] = isComparisonContext
    ? ["everyday", "advanced"]
    : latestRelatedProduct === "everyday" || latestRelatedProduct === "advanced"
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

  useEffect(() => {
    const latestTurn = latestTurnRef.current;

    if (!latestTurn) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    latestTurn.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [isLoading, messages.length]);

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

  async function submitQuickTopic(question: QuickQuestion) {
    if (question.action === "explore-products") {
      onProducts();
      return;
    }

    voice.prepareQuestionSubmission();
    const submitted = await onSubmitQuestion({
      content: question.label,
      source: "quick-topic",
      questionId: question.id,
      relatedProduct: question.relatedProduct,
    });

    if (!submitted) voice.cancelQuestionSubmission();
  }

  async function retryLastQuestion() {
    voice.prepareQuestionSubmission();
    const retried = await onRetryLastQuestion();

    if (!retried) voice.cancelQuestionSubmission();
  }

  function submitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function openManuals() {
    if (voice.outputState === "speaking") {
      voice.stopSpeaking();
    }
    setIsManualDialogOpen(true);
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
      {conversationNotice ? (
        <p className="conversation-notice" role="status">
          {conversationNotice}
        </p>
      ) : null}
      {isEndConfirmationOpen ? (
        <div
          className="conversation-end-confirmation"
          role="dialog"
          aria-modal="true"
          aria-labelledby="conversation-end-confirmation-title"
          aria-describedby="conversation-end-confirmation-description"
        >
          <div>
            <h2 id="conversation-end-confirmation-title">
              {copy.endConversationConfirmationTitle}
            </h2>
            <p id="conversation-end-confirmation-description">
              {copy.endConversationConfirmationBody}
            </p>
            <div className="conversation-end-confirmation-actions">
              <PrimaryButton onClick={() => setIsEndConfirmationOpen(false)}>
                {copy.continueConversation}
              </PrimaryButton>
              <button
                className="secondary-action"
                type="button"
                onClick={onEnd}
              >
                {copy.endSession}
              </button>
            </div>
          </div>
        </div>
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
      <ProductManualDialog
        isOpen={isManualDialogOpen}
        language={language}
        onClose={() => setIsManualDialogOpen(false)}
      />

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
            onClick={() => setIsEndConfirmationOpen(true)}
          >
            {copy.endSession}
          </button>
        </aside>

        <main className="conversation-dialogue">
          <header className="conversation-header">
            <div>
              <p className="guide-context">{copy.guideRole[guideId]}</p>
              <h1 id="conversation-heading">{copy.conversationWith(guide.name)}</h1>
              {activeProductName ? (
                <p className="conversation-active-product" aria-live="polite">
                  {copy.discussingProduct(activeProductName)}
                </p>
              ) : null}
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
                  {conversationTurns.map((turn, index) => (
                    <li
                      className="conversation-entry"
                      key={turn.visitor.id}
                      ref={
                        index === conversationTurns.length - 1
                          ? latestTurnRef
                          : undefined
                      }
                    >
                      <div className="visitor-question">
                        <span>{copy.youAsked}</span>
                        <p>{turn.visitor.content}</p>
                      </div>
                      {turn.guide?.isRecovery ? (
                        <div className="guide-response guide-response--recovery" role="status">
                          <span>{copy.answerUnavailable}</span>
                          <div className="recovery-content">
                            <p>{turn.guide.content}</p>
                            <button
                              className="recovery-retry"
                              type="button"
                              disabled={isLoading}
                              onClick={() => void retryLastQuestion()}
                            >
                              {isLoading ? copy.sending : copy.tryAgain}
                            </button>
                          </div>
                        </div>
                      ) : turn.guide ? (
                        <div className="guide-response">
                          <span>{guideDisplayName}</span>
                          <p>
                            {voice.spokenHighlight?.messageId === turn.guide.id
                              ? voice.spokenHighlight.segments.map(
                                  (segment, index) => (
                                    <span
                                      className={
                                        index ===
                                        voice.spokenHighlight?.activeIndex
                                          ? "spoken-answer-segment is-current"
                                          : index <
                                              (voice.spokenHighlight
                                                ?.activeIndex ?? 0)
                                            ? "spoken-answer-segment is-complete"
                                            : "spoken-answer-segment"
                                      }
                                      key={`${turn.guide!.id}-${index}`}
                                    >
                                      {segment.text}
                                    </span>
                                  ),
                                )
                              : turn.guide.content}
                          </p>
                        </div>
                      ) : (
                        <div className="guide-response is-preparing">
                          <span>{guideDisplayName}</span>
                          <p>
                            <span className="preparing-copy">
                              {copy.preparingAnswer(guide.name)}
                            </span>
                            <span className="thinking-dots" aria-hidden="true">
                              <i />
                              <i />
                              <i />
                            </span>
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
              <span>
                {quickQuestionProduct
                  ? copy.questionsAbout(
                      exhibitionProducts[quickQuestionProduct].displayNames[language],
                    )
                  : copy.chooseStartingPoint}
              </span>
            </div>
            <div className="quick-topic-list">
              {quickQuestions.map((question) => (
                <button
                  className="quick-topic-card"
                  type="button"
                  key={question.id}
                  disabled={isLoading}
                  onClick={() => void submitQuickTopic(question)}
                >
                  <strong>{question.label}</strong>
                </button>
              ))}
            </div>
          </section>

          <div className="conversation-product-actions">
            <button
              className="conversation-manuals-action"
              type="button"
              onClick={openManuals}
            >
              {copy.productManuals}
            </button>
            {contextualProductIds.map((productId) => (
              <button
                type="button"
                key={productId}
                onClick={() => onOpenProduct(productId)}
              >
                {copy.viewProduct(products[productId].name)}
              </button>
            ))}
            {quickQuestionProduct ? (
              <button type="button" onClick={onProducts}>
                {copy.exploreProducts}
              </button>
            ) : null}
          </div>

          <form className="composer" onSubmit={submitTypedQuestion}>
            <label className="sr-only" htmlFor="visitor-question">
              {copy.askQuestion(guide.name)}
            </label>
            <input
              id="visitor-question"
              value={draft}
              disabled={isLoading}
              onChange={(event) =>
                setDraft(
                  event.target.value.slice(0, MAX_CONVERSATION_MESSAGE_LENGTH),
                )
              }
              onKeyDown={submitOnEnter}
              placeholder={copy.askQuestion(guide.name)}
              maxLength={MAX_CONVERSATION_MESSAGE_LENGTH}
              aria-describedby={
                draft.length >= MAX_CONVERSATION_MESSAGE_LENGTH
                  ? "visitor-question-limit"
                  : undefined
              }
            />
            <button
              className="composer-send"
              type="submit"
              disabled={!draft.trim() || isLoading}
            >
              {isLoading ? copy.sending : copy.send}
            </button>
            {draft.length >= MAX_CONVERSATION_MESSAGE_LENGTH ? (
              <span className="composer-limit" id="visitor-question-limit" role="status">
                {copy.questionLimitReached(MAX_CONVERSATION_MESSAGE_LENGTH)}
              </span>
            ) : null}
          </form>
        </main>
      </div>
    </section>
  );
}

type ProductExplorerScreenProps = {
  language: SupportedLanguage;
  onOpenProduct: (product: ExhibitionProductId) => void;
  onBack: () => void;
  backLabel?: string;
};

export function ProductExplorerScreen({
  language,
  onOpenProduct,
  onBack,
  backLabel,
}: ProductExplorerScreenProps) {
  const copy = getUiCopy(language);
  const groups = [
    {
      id: "flagship",
      label: copy.flagshipProducts,
      productIds: ["air-purifier", "water-ionizer"],
    },
    {
      id: "other",
      label: copy.otherProducts,
      productIds: ["advanced", "everyday", "face-body-generator", "air-humidifier"],
    },
  ];
  return (
    <section
      className="screen-content products-content"
      aria-labelledby="products-heading"
    >
      <header className="section-header">
        <h1 id="products-heading">{copy.productExplorer}</h1>
        <p>{copy.productExplorerSupport}</p>
      </header>

      <div className="portfolio-groups">
        {groups.map((group) => {
          const groupProducts = group.productIds.map((productId) =>
            exhibitionProductList.find(({ id }) => id === productId)!,
          );
          return (
            <section
              className={`portfolio-group portfolio-group-${group.id}`}
              key={group.id}
              aria-labelledby={`portfolio-${group.id}`}
            >
              <h2 id={`portfolio-${group.id}`}>{group.label}</h2>
              <div className="product-grid">
                {groupProducts.map((product) => (
                  <button
                    className="product-card"
                    type="button"
                    key={product.id}
                    onClick={() => onOpenProduct(product.id)}
                  >
                    <ProductVisual
                      productId={product.id}
                      language={language}
                      compact
                    />
                    <span className="product-card-copy">
                      <span className="product-name">
                        {product.displayNames[language]}
                      </span>
                      <span className="product-link">{copy.viewProductLabel}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="screen-actions">
        <button className="secondary-action" type="button" onClick={onBack}>
          {backLabel ?? copy.backToConversation}
        </button>
      </div>
    </section>
  );
}

type ProductDetailScreenProps = {
  language: SupportedLanguage;
  productId: ExhibitionProductId;
  guideName: string;
  onBack: () => void;
  onCompare: () => void;
  onAskGuide: () => void;
};

export function ProductDetailScreen({
  language,
  productId,
  guideName,
  onBack,
  onCompare,
  onAskGuide,
}: ProductDetailScreenProps) {
  const product = exhibitionProducts[productId];
  const catalog = getExhibitionProductCatalog(productId);
  const copy = getUiCopy(language);
  const displayName = product.displayNames[language];
  const manual = getProductManual(productId);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const hasComparison = product.comparableWith.some(
    (related) => related === "everyday" || related === "advanced",
  );

  return (
    <section
      className="screen-content detail-content"
      aria-labelledby="product-detail-heading"
    >
      <button className="back-action" type="button" onClick={onBack}>
        {copy.portfolioBack}
      </button>

      <div className="detail-grid">
        <ProductGallery productId={productId} language={language} />
        <div className="detail-copy">
          <p className="detail-category">
            {productCategoryNames[product.category][language]}
          </p>
          <h1 id="product-detail-heading">{displayName}</h1>
          <p className="detail-overview">{catalog.description[language]}</p>
          <p className="detail-question-prompt">{copy.productQuestionPrompt}</p>

          <div className="detail-lists">
            <div>
              <h2>{copy.atAGlance}</h2>
              <ul>
                {catalog.atAGlance[language].map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2>{copy.howItWorks}</h2>
              <p>{catalog.howItWorks[language]}</p>
            </div>
            <div>
              <h2>{copy.care}</h2>
              <p>{catalog.care[language]}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="screen-actions">
        <PrimaryButton onClick={onAskGuide}>
          {copy.askAboutProduct(guideName, displayName)}
        </PrimaryButton>
        {manual ? (
          <button
            className="secondary-action"
            type="button"
            onClick={() => setIsManualOpen(true)}
          >
            {copy.userManual}
          </button>
        ) : null}
        {hasComparison ? (
          <button className="secondary-action" type="button" onClick={onCompare}>
            {copy.compareGoPro}
          </button>
        ) : null}
      </div>
      <ProductManualDialog
        isOpen={isManualOpen}
        language={language}
        manual={manual}
        onClose={() => setIsManualOpen(false)}
      />
    </section>
  );
}

function ProductVisual({
  productId,
  language,
  compact = false,
}: {
  productId: ExhibitionProductId;
  language: SupportedLanguage;
  compact?: boolean;
}) {
  const product = exhibitionProducts[productId];
  const catalog = getExhibitionProductCatalog(productId);

  if (compact) {
    return (
      <span className="product-card-visual product-visual-photo">
        <span className="product-card-image-frame">
          <Image
            fill
            src={catalog.images[0].src}
            alt={product.displayNames[language]}
            sizes="(max-width: 768px) 9rem, (max-width: 1200px) 24vw, 30rem"
          />
        </span>
      </span>
    );
  }

  return (
    <span className="detail-product-visual product-visual-photo">
      <Image
        src={catalog.images[0].src}
        alt={product.displayNames[language]}
        width={640}
        height={640}
        sizes="(max-width: 768px) 100vw, 42rem"
      />
    </span>
  );
}

function ProductGallery({
  productId,
  language,
}: {
  productId: ExhibitionProductId;
  language: SupportedLanguage;
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const catalog = getExhibitionProductCatalog(productId);
  const copy = getUiCopy(language);
  const image = catalog.images[selectedImage] ?? catalog.images[0];

  return (
    <div className="product-gallery">
      <span className="detail-product-visual product-visual-photo">
        <Image
          src={image.src}
          alt={image.alt[language]}
          width={900}
          height={900}
          sizes="(max-width: 768px) 100vw, 42rem"
          priority
        />
      </span>
      {catalog.images.length > 1 ? (
        <div className="product-gallery-thumbnails" role="group" aria-label={copy.productExplorer}>
          {catalog.images.map((galleryImage, index) => (
            <button
              className={`product-gallery-thumbnail${selectedImage === index ? " is-selected" : ""}`}
              type="button"
              key={galleryImage.src}
              onClick={() => setSelectedImage(index)}
              aria-label={copy.galleryImage(index + 1, catalog.images.length)}
              aria-pressed={selectedImage === index}
            >
              <Image src={galleryImage.src} alt="" width={120} height={120} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
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

      <div className="comparison-product-pair">
        {(["everyday", "advanced"] as const).map((productId) => (
          <article key={productId} className="comparison-product-card">
            <ProductVisual productId={productId} language={language} compact />
            <h2>{exhibitionProducts[productId].displayNames[language]}</h2>
          </article>
        ))}
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

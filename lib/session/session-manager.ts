import {
  appendConversationEntry,
  createConversationEntry,
} from "@/lib/session/conversation-history";
import type {
  SessionEvent,
  SessionEventSink,
  SessionEventType,
} from "@/lib/session/session-events";
import type { SessionStore } from "@/lib/session/session-store";
import type {
  CreateSessionInput,
  RecordMessageInput,
  ResetReason,
  SessionClock,
  SessionId,
  SessionIdFactory,
  SessionResetResult,
  SessionUpdate,
  VisitorSession,
} from "@/lib/session/session-types";
import { getConversationStage } from "@/lib/experience/conversation-stages";
import type {
  ConversationStageId,
  VisitorIntentId,
} from "@/types/experience";
import type { ProductId } from "@/types/product";

export type SessionManagerDependencies = {
  store: SessionStore;
  clock?: SessionClock;
  createId?: SessionIdFactory;
  onEvent?: SessionEventSink;
};

function defaultIdFactory() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function addUniqueValue<T>(values: readonly T[], value: T) {
  return values.includes(value) ? [...values] : [...values, value];
}

export class SessionManager {
  private readonly store: SessionStore;
  private readonly clock: SessionClock;
  private readonly createId: SessionIdFactory;
  private readonly onEvent?: SessionEventSink;

  constructor({
    store,
    clock = () => new Date(),
    createId = defaultIdFactory,
    onEvent,
  }: SessionManagerDependencies) {
    this.store = store;
    this.clock = clock;
    this.createId = createId;
    this.onEvent = onEvent;
  }

  createSession(input: CreateSessionInput = {}) {
    const timestamp = this.now();
    const session: VisitorSession = {
      sessionId: input.sessionId ?? this.createId(),
      createdAt: timestamp,
      lastInteraction: timestamp,
      status: "active",
      currentConversationStage: input.initialStage ?? "WELCOME",
      currentIntent: input.initialIntent ?? null,
      language: input.language?.trim() || null,
      discussedTopics: [],
      viewedProducts: [],
      questionsAsked: [],
      visitorGoals: [],
      conversationHistory: [],
      completedConversation: false,
      endedAt: null,
    };

    this.store.create(session);
    this.emit("SESSION_CREATED", session, {
      conversationStage: session.currentConversationStage,
    });

    return session;
  }

  readSession(sessionId: SessionId) {
    return this.store.read(sessionId);
  }

  listSessions() {
    return this.store.list();
  }

  updateSession(sessionId: SessionId, update: SessionUpdate) {
    const session = this.requireActiveSession(sessionId);
    const updatedSession: VisitorSession = {
      ...session,
      language:
        update.language === undefined
          ? session.language
          : update.language?.trim() || null,
      visitorGoals:
        update.visitorGoals === undefined
          ? session.visitorGoals
          : this.normalizeTextValues(update.visitorGoals),
      lastInteraction: this.now(),
    };

    return this.persist(updatedSession);
  }

  touchSession(sessionId: SessionId) {
    const session = this.requireActiveSession(sessionId);
    return this.persist({
      ...session,
      lastInteraction: this.now(),
    });
  }

  recordVisitorMessage(
    sessionId: SessionId,
    input: RecordMessageInput,
  ) {
    const session = this.requireActiveSession(sessionId);
    const updatedSession = this.recordMessage(session, "visitor", input);
    const question = input.content.trim();
    const sessionWithQuestion: VisitorSession = {
      ...updatedSession,
      questionsAsked: question
        ? [...updatedSession.questionsAsked, question]
        : updatedSession.questionsAsked,
    };

    const persistedSession = this.persist(sessionWithQuestion);
    const message = persistedSession.conversationHistory.at(-1);

    if (message) {
      this.emit("MESSAGE_RECEIVED", persistedSession, {
        messageId: message.id,
        conversationStage: message.conversationStage,
        intent: message.intent,
      });
    }

    return persistedSession;
  }

  recordAssistantMessage(
    sessionId: SessionId,
    input: RecordMessageInput,
  ) {
    const session = this.requireActiveSession(sessionId);
    const updatedSession = this.persist(
      this.recordMessage(session, "assistant", input),
    );
    const message = updatedSession.conversationHistory.at(-1);

    if (message) {
      this.emit("MESSAGE_SENT", updatedSession, {
        messageId: message.id,
        conversationStage: message.conversationStage,
        intent: message.intent,
      });
    }

    return updatedSession;
  }

  markTopicDiscussed(sessionId: SessionId, topic: string) {
    const normalizedTopic = this.requireText(topic, "Topic");
    const session = this.requireActiveSession(sessionId);
    const updatedSession = this.persist({
      ...session,
      discussedTopics: addUniqueValue(
        session.discussedTopics,
        normalizedTopic,
      ),
      lastInteraction: this.now(),
    });

    this.emit("TOPIC_DISCUSSED", updatedSession, {
      topic: normalizedTopic,
    });

    return updatedSession;
  }

  markProductViewed(sessionId: SessionId, productId: ProductId) {
    const session = this.requireActiveSession(sessionId);
    const updatedSession = this.persist({
      ...session,
      viewedProducts: addUniqueValue(session.viewedProducts, productId),
      lastInteraction: this.now(),
    });

    this.emit("PRODUCT_VIEWED", updatedSession, { productId });

    return updatedSession;
  }

  addVisitorGoal(sessionId: SessionId, goal: string) {
    const normalizedGoal = this.requireText(goal, "Visitor goal");
    const session = this.requireActiveSession(sessionId);

    return this.persist({
      ...session,
      visitorGoals: addUniqueValue(session.visitorGoals, normalizedGoal),
      lastInteraction: this.now(),
    });
  }

  changeConversationStage(
    sessionId: SessionId,
    nextStage: ConversationStageId,
  ) {
    const session = this.requireActiveSession(sessionId);
    const previousStage = session.currentConversationStage;

    if (previousStage === nextStage) {
      return this.touchSession(sessionId);
    }

    const stage = getConversationStage(previousStage);

    if (!stage.allowedTransitions.includes(nextStage)) {
      throw new Error(
        `Conversation stage cannot transition from "${previousStage}" to "${nextStage}".`,
      );
    }

    const updatedSession = this.persist({
      ...session,
      currentConversationStage: nextStage,
      lastInteraction: this.now(),
    });

    this.emit("STAGE_CHANGED", updatedSession, {
      previousStage,
      nextStage,
    });

    return updatedSession;
  }

  changeIntent(
    sessionId: SessionId,
    nextIntent: VisitorIntentId | null,
  ) {
    const session = this.requireActiveSession(sessionId);
    const previousIntent = session.currentIntent;

    if (previousIntent === nextIntent) {
      return this.touchSession(sessionId);
    }

    const updatedSession = this.persist({
      ...session,
      currentIntent: nextIntent,
      lastInteraction: this.now(),
    });

    this.emit("INTENT_CHANGED", updatedSession, {
      previousIntent,
      nextIntent,
    });

    return updatedSession;
  }

  endSession(
    sessionId: SessionId,
    reason: ResetReason = "COMPLETED_INTERACTION",
  ) {
    const session = this.requireSession(sessionId);

    if (session.status === "ended") {
      return session;
    }

    const timestamp = this.now();
    const completedConversation = reason === "COMPLETED_INTERACTION";
    const endedSession = this.persist({
      ...session,
      status: "ended",
      lastInteraction: timestamp,
      completedConversation,
      endedAt: timestamp,
    });

    this.emit("SESSION_ENDED", endedSession, {
      reason,
      completedConversation,
    });

    return endedSession;
  }

  resetSession(
    sessionId: SessionId,
    reason: ResetReason,
  ): SessionResetResult {
    const session = this.requireSession(sessionId);

    this.emit("SESSION_RESET", session, { reason });
    this.store.delete(sessionId);

    return {
      resetReason: reason,
      endedSessionId: sessionId,
      replacementSession: this.createSession(),
    };
  }

  private recordMessage(
    session: VisitorSession,
    role: "visitor" | "assistant",
    input: RecordMessageInput,
  ) {
    const timestamp = this.now();
    const entry = createConversationEntry({
      id: input.messageId ?? this.createId(),
      role,
      content: input.content,
      timestamp,
      conversationStage: session.currentConversationStage,
      intent: session.currentIntent,
    });

    return {
      ...session,
      lastInteraction: timestamp,
      conversationHistory: appendConversationEntry(
        session.conversationHistory,
        entry,
      ),
    };
  }

  private normalizeTextValues(values: readonly string[]) {
    return values.reduce<string[]>((normalizedValues, value) => {
      const normalizedValue = value.trim();

      return normalizedValue
        ? addUniqueValue(normalizedValues, normalizedValue)
        : normalizedValues;
    }, []);
  }

  private requireText(value: string, label: string) {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new Error(`${label} cannot be empty.`);
    }

    return normalizedValue;
  }

  private requireSession(sessionId: SessionId) {
    const session = this.store.read(sessionId);

    if (!session) {
      throw new Error(`Session "${sessionId}" does not exist.`);
    }

    return session;
  }

  private requireActiveSession(sessionId: SessionId) {
    const session = this.requireSession(sessionId);

    if (session.status !== "active") {
      throw new Error(`Session "${sessionId}" has ended.`);
    }

    return session;
  }

  private persist(session: VisitorSession) {
    this.store.update(session);
    return session;
  }

  private emit<TType extends SessionEventType>(
    type: TType,
    session: VisitorSession,
    payload: Extract<SessionEvent, { type: TType }>["payload"],
  ) {
    if (!this.onEvent) {
      return;
    }

    this.onEvent({
      eventId: this.createId(),
      type,
      sessionId: session.sessionId,
      timestamp: this.now(),
      payload,
    } as Extract<SessionEvent, { type: TType }>);
  }

  private now() {
    return this.clock().toISOString();
  }
}

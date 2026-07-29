import type {
  SessionId,
  VisitorSession,
} from "@/lib/session/session-types";

export interface SessionStore {
  create(session: VisitorSession): void;
  read(sessionId: SessionId): VisitorSession | null;
  update(session: VisitorSession): void;
  delete(sessionId: SessionId): boolean;
  list(): readonly VisitorSession[];
  clear(): void;
}

function cloneSession(session: VisitorSession): VisitorSession {
  return {
    ...session,
    discussedTopics: [...session.discussedTopics],
    viewedProducts: [...session.viewedProducts],
    questionsAsked: [...session.questionsAsked],
    visitorGoals: [...session.visitorGoals],
    conversationHistory: session.conversationHistory.map((entry) => ({
      ...entry,
    })),
  };
}

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<SessionId, VisitorSession>();

  create(session: VisitorSession) {
    if (this.sessions.has(session.sessionId)) {
      throw new Error(`Session "${session.sessionId}" already exists.`);
    }

    this.sessions.set(session.sessionId, cloneSession(session));
  }

  read(sessionId: SessionId) {
    const session = this.sessions.get(sessionId);
    return session ? cloneSession(session) : null;
  }

  update(session: VisitorSession) {
    if (!this.sessions.has(session.sessionId)) {
      throw new Error(`Session "${session.sessionId}" does not exist.`);
    }

    this.sessions.set(session.sessionId, cloneSession(session));
  }

  delete(sessionId: SessionId) {
    return this.sessions.delete(sessionId);
  }

  list() {
    return [...this.sessions.values()].map(cloneSession);
  }

  clear() {
    this.sessions.clear();
  }
}

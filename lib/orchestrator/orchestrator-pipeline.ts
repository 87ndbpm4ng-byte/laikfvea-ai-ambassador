import "server-only";

import { generateOpenAIResponse } from "@/lib/ai/openai-response-engine";
import { getExperienceRecommendation } from "@/lib/experience/experience-engine";
import {
  createOrchestratorContext,
} from "@/lib/orchestrator/orchestrator-context";
import {
  AIOrchestratorError,
  InvalidOrchestratorInputError,
  InvalidStrategyError,
  OpenAIFailureError,
  PromptBuildFailedError,
  SessionUnavailableError,
  UnexpectedPipelineFailureError,
} from "@/lib/orchestrator/orchestrator-errors";
import { PromptBuilder } from "@/lib/orchestrator/prompt-builder";
import type {
  OrchestrateMessageInput,
  OrchestratorAIProvider,
  OrchestratorClock,
  OrchestratorIdFactory,
  OrchestratorPrompt,
  OrchestratorResult,
} from "@/lib/orchestrator/orchestrator-types";
import { createResponseContext } from "@/lib/response/response-context";
import { ResponseEngine } from "@/lib/response/response-engine";
import { ResponseStrategyValidationError } from "@/lib/response/response-validator";
import { SessionManager } from "@/lib/session/session-manager";
import type { ConversationHistoryItem } from "@/types/conversation";
import type { Guide } from "@/types/guide";
import path from "node:path";
import {
  createRetrievalContext,
  sanitizeVisitorResponse,
} from "@/lib/retrieval/retrieval-context";
import {
  createSkippedRetrievalResult,
  RetrievalEngine,
} from "@/lib/retrieval/retrieval-engine";
import { ApprovedKnowledgeLoader } from "@/lib/retrieval/retrieval-loader";
import {
  createRetrievalQuery,
  shouldRunRetrieval,
} from "@/lib/retrieval/retrieval-query";
import type { KnowledgeRetriever } from "@/lib/retrieval/retrieval-types";
import { createRetrievalDiagnostics } from "@/lib/retrieval/retrieval-diagnostics";
import { validateGroundedResponse } from "@/lib/retrieval/retrieval-answer-validator";

const INSUFFICIENT_KNOWLEDGE_RESPONSE =
  "The available product documentation does not give me enough information to answer that reliably.";

function defaultIdFactory() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `orchestration-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toOpenAIHistory(
  prompt: OrchestratorPrompt,
): ConversationHistoryItem[] {
  const historyWithoutCurrentMessage =
    prompt.conversationHistory.at(-1)?.role === "visitor" &&
    prompt.conversationHistory.at(-1)?.content === prompt.userMessage
      ? prompt.conversationHistory.slice(0, -1)
      : prompt.conversationHistory;

  return historyWithoutCurrentMessage.map((entry) => ({
    role: entry.role === "assistant" ? "guide" : "visitor",
    content: entry.content,
  }));
}

/**
 * Adapts the current OpenAI response service to the provider-neutral
 * orchestrator contract without changing the existing service.
 */
export class ExistingOpenAIProvider implements OrchestratorAIProvider {
  readonly id = "existing-openai-service";

  constructor(private readonly promptBuilder: PromptBuilder) {}

  async generate(prompt: OrchestratorPrompt, guide: Guide) {
    return generateOpenAIResponse({
      message: this.promptBuilder.renderForExistingService(prompt),
      guide,
      history: toOpenAIHistory(prompt),
    });
  }
}

export type OrchestratorPipelineDependencies = {
  sessionManager: SessionManager;
  responseEngine?: ResponseEngine;
  promptBuilder?: PromptBuilder;
  provider?: OrchestratorAIProvider;
  clock?: OrchestratorClock;
  createId?: OrchestratorIdFactory;
  retrieval?: KnowledgeRetriever;
};

/**
 * Executes the conversation pipeline in a fixed order while delegating every
 * domain decision to the existing specialized modules.
 */
export class OrchestratorPipeline {
  private readonly sessionManager: SessionManager;
  private readonly responseEngine: ResponseEngine;
  private readonly promptBuilder: PromptBuilder;
  private readonly provider: OrchestratorAIProvider;
  private readonly clock: OrchestratorClock;
  private readonly createId: OrchestratorIdFactory;
  private readonly retrieval: KnowledgeRetriever;

  constructor({
    sessionManager,
    responseEngine = new ResponseEngine(),
    promptBuilder = new PromptBuilder(),
    provider,
    clock = () => new Date(),
    createId = defaultIdFactory,
    retrieval = new RetrievalEngine(
      new ApprovedKnowledgeLoader(path.join(process.cwd(), "knowledge")),
    ),
  }: OrchestratorPipelineDependencies) {
    this.sessionManager = sessionManager;
    this.responseEngine = responseEngine;
    this.promptBuilder = promptBuilder;
    this.provider =
      provider ?? new ExistingOpenAIProvider(this.promptBuilder);
    this.clock = clock;
    this.createId = createId;
    this.retrieval = retrieval;
  }

  async execute(
    input: OrchestrateMessageInput,
  ): Promise<OrchestratorResult> {
    const message = this.validateInput(input);

    try {
      const session = this.loadOrCreateSession(input);
      const activeSession = this.updateSession(
        session.sessionId,
        message,
      );
      const experience = getExperienceRecommendation({
        currentStage: activeSession.currentConversationStage,
        visitorIntent: activeSession.currentIntent ?? undefined,
      });
      const responseContext = createResponseContext({
        session: activeSession,
        experience,
      });
      const responseStrategy = this.createStrategy(responseContext);
      const retrievalQuery = createRetrievalQuery({
        message,
        session: activeSession,
      });
      const retrievalResult = shouldRunRetrieval(message)
        ? await this.retrieval.search(retrievalQuery)
        : createSkippedRetrievalResult(retrievalQuery);
      const context = createOrchestratorContext({
        session: activeSession,
        experience,
        responseStrategy,
        userMessage: message,
        metadata: {
          requestId: this.createId(),
          receivedAt: this.clock().toISOString(),
          providerId: this.provider.id,
          guide: input.guide,
        },
        retrievalContext: retrievalResult.skipped
          ? null
          : createRetrievalContext(retrievalResult),
      });
      const prompt = this.buildPrompt(
        context,
        input.supplementalContext,
      );
      const retrievalContext = context.retrievalContext;
      let response = retrievalResult.insufficientKnowledge
        ? INSUFFICIENT_KNOWLEDGE_RESPONSE
        : sanitizeVisitorResponse(
            await this.requestResponse(prompt, input.guide),
          );
      if (!validateGroundedResponse(response, retrievalContext).valid) {
        response = INSUFFICIENT_KNOWLEDGE_RESPONSE;
      }
      const updatedSession = this.sessionManager.recordAssistantMessage(
        activeSession.sessionId,
        { content: response },
      );

      return {
        sessionId: updatedSession.sessionId,
        response,
        responseStrategy,
        session: updatedSession,
        retrieval: retrievalResult,
        diagnostics: createRetrievalDiagnostics(retrievalResult),
      };
    } catch (error) {
      if (error instanceof AIOrchestratorError) {
        throw error;
      }

      throw new UnexpectedPipelineFailureError({ cause: error });
    }
  }

  private validateInput(input: OrchestrateMessageInput) {
    const message = input.message.trim();

    if (!message) {
      throw new InvalidOrchestratorInputError();
    }

    return message;
  }

  private loadOrCreateSession(input: OrchestrateMessageInput) {
    if (!input.sessionId) {
      return this.sessionManager.createSession({
        language: input.language,
      });
    }

    const session = this.sessionManager.readSession(input.sessionId);

    if (!session || session.status !== "active") {
      throw new SessionUnavailableError();
    }

    return session;
  }

  private updateSession(sessionId: string, message: string) {
    try {
      this.sessionManager.touchSession(sessionId);
      return this.sessionManager.recordVisitorMessage(sessionId, {
        content: message,
      });
    } catch (error) {
      throw new SessionUnavailableError({ cause: error });
    }
  }

  private createStrategy(
    context: ReturnType<typeof createResponseContext>,
  ) {
    try {
      return this.responseEngine.createStrategy(context);
    } catch (error) {
      if (error instanceof ResponseStrategyValidationError) {
        throw new InvalidStrategyError({ cause: error });
      }

      throw error;
    }
  }

  private buildPrompt(
    context: Parameters<PromptBuilder["build"]>[0]["context"],
    supplementalContext: OrchestrateMessageInput["supplementalContext"],
  ) {
    try {
      return this.promptBuilder.build({
        context,
        supplementalContext,
      });
    } catch (error) {
      throw new PromptBuildFailedError({ cause: error });
    }
  }

  private async requestResponse(
    prompt: OrchestratorPrompt,
    guide: Guide,
  ) {
    try {
      const response = (await this.provider.generate(prompt, guide)).trim();

      if (!response) {
        throw new Error("The AI provider returned an empty response.");
      }

      return response;
    } catch (error) {
      throw new OpenAIFailureError({ cause: error });
    }
  }
}

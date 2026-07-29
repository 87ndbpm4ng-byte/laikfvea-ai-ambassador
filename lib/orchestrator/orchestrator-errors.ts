export type OrchestratorErrorCode =
  | "INVALID_INPUT"
  | "SESSION_UNAVAILABLE"
  | "PROMPT_BUILD_FAILED"
  | "OPENAI_FAILURE"
  | "INVALID_STRATEGY"
  | "UNEXPECTED_PIPELINE_FAILURE";

export class AIOrchestratorError extends Error {
  readonly code: OrchestratorErrorCode;

  constructor(
    code: OrchestratorErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AIOrchestratorError";
    this.code = code;
  }
}

export class InvalidOrchestratorInputError extends AIOrchestratorError {
  constructor(message = "The conversation request is invalid.") {
    super("INVALID_INPUT", message);
    this.name = "InvalidOrchestratorInputError";
  }
}

export class SessionUnavailableError extends AIOrchestratorError {
  constructor(options?: ErrorOptions) {
    super(
      "SESSION_UNAVAILABLE",
      "The requested session is unavailable.",
      options,
    );
    this.name = "SessionUnavailableError";
  }
}

export class PromptBuildFailedError extends AIOrchestratorError {
  constructor(options?: ErrorOptions) {
    super(
      "PROMPT_BUILD_FAILED",
      "The conversation prompt could not be prepared.",
      options,
    );
    this.name = "PromptBuildFailedError";
  }
}

export class OpenAIFailureError extends AIOrchestratorError {
  constructor(options?: ErrorOptions) {
    super(
      "OPENAI_FAILURE",
      "The AI response provider could not complete the request.",
      options,
    );
    this.name = "OpenAIFailureError";
  }
}

export class InvalidStrategyError extends AIOrchestratorError {
  constructor(options?: ErrorOptions) {
    super(
      "INVALID_STRATEGY",
      "The response strategy is invalid.",
      options,
    );
    this.name = "InvalidStrategyError";
  }
}

export class UnexpectedPipelineFailureError extends AIOrchestratorError {
  constructor(options?: ErrorOptions) {
    super(
      "UNEXPECTED_PIPELINE_FAILURE",
      "The conversation pipeline could not complete.",
      options,
    );
    this.name = "UnexpectedPipelineFailureError";
  }
}

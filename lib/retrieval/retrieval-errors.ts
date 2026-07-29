export class RetrievalError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RetrievalError";
  }
}

export class KnowledgeLoadError extends RetrievalError {
  constructor(options?: ErrorOptions) {
    super("Approved knowledge could not be loaded.", options);
    this.name = "KnowledgeLoadError";
  }
}

export class RetrievalValidationError extends RetrievalError {
  constructor(message: string) {
    super(message);
    this.name = "RetrievalValidationError";
  }
}

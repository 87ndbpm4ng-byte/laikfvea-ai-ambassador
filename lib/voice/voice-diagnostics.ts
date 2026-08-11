type VoiceDiagnosticDetails = Record<
  string,
  string | number | boolean | null | undefined
>;

function safeError(error: unknown) {
  return {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorMessage:
      error instanceof Error ? error.message.slice(0, 240) : "Unknown error",
  };
}

/** Development-only voice-flow logging. Never include credentials or tokens. */
export function logVoiceDiagnostic(
  event: string,
  details: VoiceDiagnosticDetails = {},
) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[voice-flow]", JSON.stringify({ event, ...details }));
}

export function logVoiceDiagnosticError(event: string, error: unknown) {
  logVoiceDiagnostic(event, safeError(error));
}

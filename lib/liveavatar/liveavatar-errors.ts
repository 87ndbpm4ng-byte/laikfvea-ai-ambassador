export type LiveAvatarErrorClassification = {
  code: string;
  retryable: boolean;
  providerFailure: boolean;
};

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 422]);
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503]);
const NON_RETRYABLE_MESSAGES = [
  "session not found",
  "session expired",
  "invalid session",
  "insufficient credit",
  "credits unavailable",
  "out of credits",
];

function readStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as { status?: unknown; statusCode?: unknown };
  const status = candidate.status ?? candidate.statusCode;
  return typeof status === "number" ? status : undefined;
}

/** Classifies provider failures without exposing their raw message to visitors. */
export function classifyLiveAvatarError(
  error: unknown,
): LiveAvatarErrorClassification {
  const status = readStatus(error);
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    (status && NON_RETRYABLE_STATUSES.has(status)) ||
    NON_RETRYABLE_MESSAGES.some((pattern) => message.includes(pattern))
  ) {
    return {
      code: status ? `provider-${status}` : "invalid-session",
      retryable: false,
      providerFailure: true,
    };
  }

  if (status && RETRYABLE_STATUSES.has(status)) {
    return {
      code: `provider-${status}`,
      retryable: true,
      providerFailure: true,
    };
  }

  const providerFailure =
    message.includes("liveavatar") ||
    message.includes("session") ||
    message.includes("webrtc") ||
    message.includes("credit");

  return {
    code: status ? `provider-${status}` : "connection-failure",
    retryable: true,
    providerFailure,
  };
}

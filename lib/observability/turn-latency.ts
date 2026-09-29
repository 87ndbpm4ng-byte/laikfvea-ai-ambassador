type LatencyDetails = Record<string, boolean | number | string | null | undefined>;

const TURN_ID_PATTERN = /^turn-[A-Za-z0-9-]{8,120}$/;

export function createLatencyTurnId() {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `turn-${suffix}`;
}

export function isLatencyTurnId(value: unknown): value is string {
  return typeof value === "string" && TURN_ID_PATTERN.test(value);
}

export function latencyNow() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

export function latencyDuration(startedAt: number) {
  return Math.round(latencyNow() - startedAt);
}

/** Development-only timing log. Details must never include visitor or provider content. */
export function logTurnLatency(
  turnId: string | undefined,
  stage: string,
  details: LatencyDetails = {},
) {
  if (process.env.NODE_ENV !== "development" || !turnId) return;
  console.info(`[latency][${turnId}][${stage}]`, JSON.stringify(details));
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export class SpeechRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  allow(key: string, now = Date.now()) {
    const current = this.entries.get(key);

    if (!current || current.resetAt <= now) {
      this.entries.set(key, {
        count: 1,
        resetAt: now + WINDOW_MS,
      });
      return true;
    }

    if (current.count >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    current.count += 1;
    return true;
  }
}

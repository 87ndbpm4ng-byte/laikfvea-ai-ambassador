type IdleTimerOptions = {
  timeoutSeconds: number;
  warningSeconds?: number;
  onTick: (remainingSeconds: number) => void;
  onWarning: () => void;
  onTimeout: () => void;
  now?: () => number;
  setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setInterval>;
  clearTimer?: (timer: ReturnType<typeof setInterval>) => void;
};

export class LiveAvatarIdleTimer {
  private readonly timeoutSeconds: number;
  private readonly warningSeconds: number;
  private readonly onTick: (remainingSeconds: number) => void;
  private readonly onWarning: () => void;
  private readonly onTimeout: () => void;
  private readonly now: () => number;
  private readonly setTimer: IdleTimerOptions["setTimer"];
  private readonly clearTimer: IdleTimerOptions["clearTimer"];
  private timer: ReturnType<typeof setInterval> | null = null;
  private deadline = 0;
  private warned = false;

  constructor(options: IdleTimerOptions) {
    this.timeoutSeconds = options.timeoutSeconds;
    this.warningSeconds = options.warningSeconds ?? 15;
    this.onTick = options.onTick;
    this.onWarning = options.onWarning;
    this.onTimeout = options.onTimeout;
    this.now = options.now ?? Date.now;
    this.setTimer =
      options.setTimer ??
      ((callback, delay) => globalThis.setInterval(callback, delay));
    this.clearTimer =
      options.clearTimer ??
      ((timer) => globalThis.clearInterval(timer));
  }

  start() {
    this.stop();
    this.reset();
    this.timer = this.setTimer?.(() => this.tick(), 1_000) ?? null;
  }

  reset() {
    this.deadline = this.now() + this.timeoutSeconds * 1_000;
    this.warned = false;
    this.onTick(this.timeoutSeconds);
  }

  stop() {
    if (this.timer) this.clearTimer?.(this.timer);
    this.timer = null;
  }

  tick() {
    const remaining = Math.max(
      0,
      Math.ceil((this.deadline - this.now()) / 1_000),
    );
    this.onTick(remaining);

    if (!this.warned && remaining <= this.warningSeconds && remaining > 0) {
      this.warned = true;
      this.onWarning();
    }

    if (remaining === 0) {
      this.stop();
      this.onTimeout();
    }
  }
}

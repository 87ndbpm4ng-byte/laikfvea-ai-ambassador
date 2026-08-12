"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LiveAvatarIdleTimer } from "@/lib/liveavatar/idle-timeout";
import type {
  DanielAvatarOutput,
  LiveAvatarSnapshot,
} from "@/lib/liveavatar/liveavatar-types";

export function useLiveAvatarIdleTimeout({
  service,
  active = Boolean(service),
  timeoutSeconds = 120,
  systemBusy = false,
  onTimeout,
}: {
  service?: DanielAvatarOutput;
  active?: boolean;
  timeoutSeconds?: number;
  systemBusy?: boolean;
  onTimeout: () => void;
}) {
  const timerRef = useRef<LiveAvatarIdleTimer | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef(onTimeout);
  const configuredTimeoutRef = useRef(timeoutSeconds);

  useEffect(() => {
    timeoutRef.current = onTimeout;
  }, [onTimeout]);

  const recordActivity = useCallback(() => {
    timerRef.current?.reset();
    setShowWarning(false);
  }, []);

  useEffect(() => {
    if (!active || systemBusy) return;

    function startTimer(nextTimeoutSeconds: number) {
      timerRef.current?.stop();
      configuredTimeoutRef.current = nextTimeoutSeconds;
      timerRef.current = new LiveAvatarIdleTimer({
        timeoutSeconds: nextTimeoutSeconds,
        warningSeconds: 15,
        onTick: setRemainingSeconds,
        onWarning: () => setShowWarning(true),
        onTimeout: () => timeoutRef.current(),
      });
      timerRef.current.start();
    }

    startTimer(timeoutSeconds);
    const unsubscribe = service?.subscribe((snapshot: LiveAvatarSnapshot) => {
      if (snapshot.idleTimeoutSeconds !== configuredTimeoutRef.current) {
        startTimer(snapshot.idleTimeoutSeconds);
      }
    });
    const events = ["pointerdown", "keydown", "touchstart", "input"] as const;
    events.forEach((event) =>
      window.addEventListener(event, recordActivity, { passive: true }),
    );
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, recordActivity),
      );
      unsubscribe?.();
      timerRef.current?.stop();
      timerRef.current = null;
      setRemainingSeconds(null);
      setShowWarning(false);
    };
  }, [active, recordActivity, service, systemBusy, timeoutSeconds]);

  return {
    remainingSeconds: systemBusy ? null : remainingSeconds,
    showWarning: systemBusy ? false : showWarning,
    continueSession: recordActivity,
  };
}

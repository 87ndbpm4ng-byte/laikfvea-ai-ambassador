"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LiveAvatarIdleTimer } from "@/lib/liveavatar/idle-timeout";
import type {
  DanielAvatarOutput,
  LiveAvatarSnapshot,
} from "@/lib/liveavatar/liveavatar-types";

export function useLiveAvatarIdleTimeout({
  service,
  onTimeout,
}: {
  service?: DanielAvatarOutput;
  onTimeout: () => void;
}) {
  const timerRef = useRef<LiveAvatarIdleTimer | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef(onTimeout);

  useEffect(() => {
    timeoutRef.current = onTimeout;
  }, [onTimeout]);

  const recordActivity = useCallback(() => {
    timerRef.current?.reset();
    setShowWarning(false);
  }, []);

  useEffect(() => {
    if (!service) return;

    return service.subscribe((snapshot: LiveAvatarSnapshot) => {
      const activeProductionSession =
        snapshot.environment === "production" &&
        snapshot.state !== "disconnected" &&
        snapshot.state !== "connecting";

      if (!activeProductionSession) {
        timerRef.current?.stop();
        timerRef.current = null;
        setRemainingSeconds(null);
        setShowWarning(false);
        return;
      }

      if (!timerRef.current) {
        timerRef.current = new LiveAvatarIdleTimer({
          timeoutSeconds: snapshot.idleTimeoutSeconds,
          warningSeconds: 15,
          onTick: setRemainingSeconds,
          onWarning: () => setShowWarning(true),
          onTimeout: () => timeoutRef.current(),
        });
        timerRef.current.start();
      } else {
        recordActivity();
      }
    });
  }, [recordActivity, service]);

  useEffect(() => {
    if (!service) return;
    const events = ["pointerdown", "keydown", "touchstart", "input"] as const;
    events.forEach((event) =>
      window.addEventListener(event, recordActivity, { passive: true }),
    );
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, recordActivity),
      );
      timerRef.current?.stop();
      timerRef.current = null;
    };
  }, [recordActivity, service]);

  return {
    remainingSeconds,
    showWarning,
    continueSession: recordActivity,
  };
}

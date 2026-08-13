"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserSpeechRecognitionProvider } from "@/lib/voice/browser-speech-recognition";
import { activateVoiceSession } from "@/lib/voice/audio-session";
import { selectPendingGuideSpeech } from "@/lib/voice/conversation-speech";
import { normalizeSpeechText } from "@/lib/voice/speech-text-normalizer";
import { OpenAISpeechSynthesisProvider } from "@/lib/voice/openai-speech-synthesis";
import { logVoiceDiagnostic } from "@/lib/voice/voice-diagnostics";
import type {
  SpeechRecognitionProvider,
  SpeechPlaybackProvider,
  SpeechSynthesisProvider,
  VoiceError,
  VoiceInputState,
  VoiceOutputState,
} from "@/lib/voice/voice-types";
import type { ConversationMessage } from "@/types/conversation";
import type { GuideId } from "@/types/guide";
import type { SupportedLanguage } from "@/types/language";
import { getLanguageConfiguration } from "@/lib/i18n/languages";
import {
  findActiveSpokenSegment,
  getAlignedSegmentStartTimes,
  getSpokenSegmentStartTimes,
  segmentSpokenText,
  type SpokenTextSegment,
} from "@/lib/voice/spoken-highlight";
import type { SpeechPlaybackClock, SpeechTiming } from "@/lib/voice/voice-types";

type VoiceModeOptions = {
  guideId: GuideId;
  language: SupportedLanguage;
  messages: ConversationMessage[];
  isConversationLoading: boolean;
  submitTranscript: (transcript: string) => Promise<boolean>;
  recognitionProvider?: SpeechRecognitionProvider;
  synthesisProvider?: SpeechSynthesisProvider;
  audioActivationProvider?: SpeechSynthesisProvider;
  activationPromise?: Promise<boolean> | null;
  enabledByDefault?: boolean;
};

export function useVoiceMode({
  guideId,
  language,
  messages,
  isConversationLoading,
  submitTranscript,
  recognitionProvider,
  synthesisProvider,
  audioActivationProvider,
  activationPromise,
  enabledByDefault = false,
}: VoiceModeOptions) {
  const recognition = useMemo(
    () =>
      recognitionProvider ??
      new BrowserSpeechRecognitionProvider(
        getLanguageConfiguration(language).speechRecognitionLocale,
      ),
    [language, recognitionProvider],
  );
  const synthesis: SpeechSynthesisProvider = useMemo(
    () => synthesisProvider ?? new OpenAISpeechSynthesisProvider(),
    [synthesisProvider],
  );
  const activationProvider = audioActivationProvider ?? synthesis;
  const [isEnabled, setIsEnabled] = useState(enabledByDefault);
  const [inputState, setInputState] = useState<VoiceInputState>("idle");
  const [outputState, setOutputState] = useState<VoiceOutputState>("idle");
  const [playbackProvider, setPlaybackProvider] =
    useState<SpeechPlaybackProvider | null>(null);
  const [isPlaybackBlocked, setIsPlaybackBlocked] = useState(false);
  const [isAudioSessionActivated, setIsAudioSessionActivated] = useState(
    () => activationProvider.isActivated ?? false,
  );
  const [isPreparingVoice, setIsPreparingVoice] = useState(
    Boolean(activationPromise) && !(activationProvider.isActivated ?? false),
  );
  const [activationFailed, setActivationFailed] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<VoiceError | null>(null);
  const submittedTranscriptRef = useRef(false);
  const lastSpokenMessageRef = useRef<string | null>(null);
  const activationPromiseRef = useRef<Promise<boolean> | null>(
    activationPromise ?? null,
  );
  const [spokenHighlight, setSpokenHighlight] = useState<{
    messageId: string;
    segments: SpokenTextSegment[];
    activeIndex: number;
  } | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingTimingRef = useRef<SpeechTiming | null>(null);

  const clearSpokenHighlight = useCallback(() => {
    if (highlightTimerRef.current) clearInterval(highlightTimerRef.current);
    highlightTimerRef.current = null;
    pendingTimingRef.current = null;
    setSpokenHighlight(null);
  }, []);

  const stopAll = useCallback(() => {
    recognition.abort();
    synthesis.stop();
    setInputState("idle");
    setOutputState("idle");
    setPlaybackProvider(null);
    setIsPlaybackBlocked(false);
    clearSpokenHighlight();
  }, [clearSpokenHighlight, recognition, synthesis]);

  const setEnabled = useCallback(
    (enabled: boolean) => {
      setIsEnabled(enabled);
      setError(null);
      setTranscript("");

      if (!enabled) {
        recognition.abort();
        synthesis.reset?.();
        setInputState("idle");
        setOutputState("idle");
        setPlaybackProvider(null);
        setIsPlaybackBlocked(false);
        setIsAudioSessionActivated(false);
        setActivationFailed(false);
        clearSpokenHighlight();
      } else {
        setIsAudioSessionActivated(activationProvider.isActivated ?? false);
      }
    },
    [activationProvider, clearSpokenHighlight, recognition, synthesis],
  );

  const activateAudioSession = useCallback(() => {
    const activation =
      activationPromiseRef.current ?? activateVoiceSession(activationProvider);
    activationPromiseRef.current = activation;
    setIsPreparingVoice(true);

    void activation.then((activated) => {
      setIsAudioSessionActivated(activated);
      setActivationFailed(!activated);
      setError(null);
      setIsPreparingVoice(false);
      if (!activated) setInputState("idle");
      activationPromiseRef.current = null;
    });
  }, [activationProvider]);

  useEffect(() => {
    if (!activationPromise) return;

    activationPromiseRef.current = activationPromise;
    let active = true;

    void activationPromise.then((activated) => {
      if (!active) return;
      setIsAudioSessionActivated(activated);
      setActivationFailed(!activated);
      setIsPreparingVoice(false);
      if (!activated) setInputState("idle");
      activationPromiseRef.current = null;
    });

    return () => {
      active = false;
    };
  }, [activationPromise]);

  const handleError = useCallback(
    (voiceError: VoiceError) => {
      synthesis.setReady?.();
      setError(voiceError);
      setInputState(
        voiceError.code === "recognition-unavailable" ? "unavailable" : "idle",
      );
      setOutputState(
        voiceError.code === "synthesis-unavailable" ? "unavailable" : "idle",
      );
      clearSpokenHighlight();
    },
    [clearSpokenHighlight, synthesis],
  );

  const startListening = useCallback(() => {
    if (!isEnabled || isConversationLoading) {
      return;
    }

    synthesis.stop();
    clearSpokenHighlight();
    if (!isAudioSessionActivated) {
      // This call begins audio unlock synchronously inside the Talk gesture.
      activateAudioSession();
    }
    synthesis.startListening?.();
    setOutputState("idle");
    setPlaybackProvider(null);
    setIsPlaybackBlocked(false);
    setError(null);
    setTranscript("");
    setInputState("listening");
    submittedTranscriptRef.current = false;

    recognition.start({
      onInterimTranscript: setTranscript,
      onFinalTranscript: async (finalTranscript) => {
        if (submittedTranscriptRef.current) {
          return;
        }

        submittedTranscriptRef.current = true;
        setTranscript(finalTranscript);
        setInputState("processing");
        synthesis.stopListening?.();
        synthesis.setThinking?.();
        try {
          const submitted = await submitTranscript(finalTranscript);
          if (!submitted) setInputState("idle");
        } catch {
          setInputState("idle");
        }
      },
      onEnd: () => {
        if (!submittedTranscriptRef.current) synthesis.setReady?.();
        setInputState((current) =>
          current === "processing" ? current : "idle",
        );
      },
      onError: handleError,
    });
  }, [
    handleError,
    activateAudioSession,
    isConversationLoading,
    isAudioSessionActivated,
    isEnabled,
    recognition,
    submitTranscript,
    synthesis,
    clearSpokenHighlight,
  ]);

  const stopListening = useCallback(() => {
    recognition.stop();
    synthesis.stopListening?.();
  }, [recognition, synthesis]);

  const prepareQuestionSubmission = useCallback(() => {
    if (!isEnabled || isConversationLoading) return false;

    recognition.abort();
    synthesis.stop();
    clearSpokenHighlight();
    if (!isAudioSessionActivated) activateAudioSession();
    synthesis.setThinking?.();
    setTranscript("");
    setError(null);
    setIsPlaybackBlocked(false);
    setPlaybackProvider(null);
    setOutputState("idle");
    setInputState("processing");
    return true;
  }, [
    activateAudioSession,
    isAudioSessionActivated,
    isConversationLoading,
    isEnabled,
    recognition,
    synthesis,
    clearSpokenHighlight,
  ]);

  const cancelQuestionSubmission = useCallback(() => {
    synthesis.setReady?.();
    setInputState("idle");
  }, [synthesis]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const latestGuideMessage = selectPendingGuideSpeech(
      messages,
      lastSpokenMessageRef.current,
    );

    if (!latestGuideMessage) return;

    lastSpokenMessageRef.current = latestGuideMessage.id;
    logVoiceDiagnostic("speech-trigger", {
      questionSource: latestGuideMessage.source ?? "unknown",
      speechTriggerCalled: true,
      audioSessionActivated: isAudioSessionActivated,
    });
    synthesis.speak(normalizeSpeechText(latestGuideMessage.content), guideId, {
      onTiming: (timing) => {
        clearSpokenHighlight();
        pendingTimingRef.current = timing;
      },
      onPlaybackClock: (clock: SpeechPlaybackClock) => {
        const timing = pendingTimingRef.current;
        if (!timing) return;
        const segments = segmentSpokenText(
          latestGuideMessage.content,
          language,
        );
        const alignedStarts = timing.alignment
          ? getAlignedSegmentStartTimes(
              latestGuideMessage.content,
              segments,
              timing.alignment,
            )
          : [];
        const starts = alignedStarts.length
          ? alignedStarts
          : getSpokenSegmentStartTimes(segments, timing.durationMs);
        if (!segments.length || starts.length !== segments.length) return;

        const updateHighlight = () => {
          const activeIndex = findActiveSpokenSegment(
            starts,
            clock.currentTimeMs(),
          );
          if (activeIndex < 0) return;
          setSpokenHighlight((current) =>
            current?.messageId === latestGuideMessage.id &&
            current.activeIndex === activeIndex
              ? current
              : { messageId: latestGuideMessage.id, segments, activeIndex },
          );
        };
        updateHighlight();
        highlightTimerRef.current = setInterval(updateHighlight, 150);
      },
      onProvider: (provider) => {
        logVoiceDiagnostic("provider-selected", { provider });
        setPlaybackProvider(provider);
      },
      onActivationRequired: () => {
        lastSpokenMessageRef.current = null;
        logVoiceDiagnostic("audio-activation-required", {
          questionSource: latestGuideMessage.source ?? "unknown",
        });
        setIsAudioSessionActivated(false);
        setActivationFailed(true);
        setInputState("idle");
      },
      onPlaybackBlocked: () => {
        setIsPlaybackBlocked(true);
        setInputState("idle");
        setOutputState("idle");
        setError(null);
      },
      onStart: () => {
        setIsPlaybackBlocked(false);
        setInputState("idle");
        setOutputState("speaking");
      },
      onEnd: () => {
        setOutputState("idle");
        clearSpokenHighlight();
      },
      onError: handleError,
    });
  }, [
    guideId,
    handleError,
    isAudioSessionActivated,
    isEnabled,
    language,
    messages,
    synthesis,
    clearSpokenHighlight,
  ]);

  useEffect(() => {
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        stopAll();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      recognition.abort();
      synthesis.stop();
      clearSpokenHighlight();
    };
  }, [clearSpokenHighlight, recognition, stopAll, synthesis]);

  return {
    isEnabled,
    isRecognitionSupported: recognition.isSupported,
    isSynthesisSupported: synthesis.isSupported,
    inputState,
    outputState,
    playbackProvider,
    isPlaybackBlocked,
    isAudioSessionActivated,
    isPreparingVoice,
    activationFailed,
    transcript,
    error,
    spokenHighlight,
    setEnabled,
    activateAudioSession,
    prepareQuestionSubmission,
    cancelQuestionSubmission,
    startListening,
    stopListening,
    retryPlayback: async () => {
      setError(null);
      await synthesis.retry?.();
    },
    stopSpeaking: () => {
      synthesis.stop();
      setOutputState("idle");
      setIsPlaybackBlocked(false);
      clearSpokenHighlight();
    },
  };
}

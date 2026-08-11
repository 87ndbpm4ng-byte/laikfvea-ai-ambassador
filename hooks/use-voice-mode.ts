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

type VoiceModeOptions = {
  guideId: GuideId;
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
    () => recognitionProvider ?? new BrowserSpeechRecognitionProvider(),
    [recognitionProvider],
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

  const stopAll = useCallback(() => {
    recognition.abort();
    synthesis.stop();
    setInputState("idle");
    setOutputState("idle");
    setPlaybackProvider(null);
    setIsPlaybackBlocked(false);
  }, [recognition, synthesis]);

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
      } else {
        setIsAudioSessionActivated(activationProvider.isActivated ?? false);
      }
    },
    [activationProvider, recognition, synthesis],
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
    },
    [synthesis],
  );

  const startListening = useCallback(() => {
    if (!isEnabled || isConversationLoading) {
      return;
    }

    synthesis.stop();
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
  ]);

  const stopListening = useCallback(() => {
    recognition.stop();
    synthesis.stopListening?.();
  }, [recognition, synthesis]);

  const prepareQuestionSubmission = useCallback(() => {
    if (!isEnabled || isConversationLoading) return false;

    recognition.abort();
    synthesis.stop();
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
      onEnd: () => setOutputState("idle"),
      onError: handleError,
    });
  }, [
    guideId,
    handleError,
    isAudioSessionActivated,
    isEnabled,
    messages,
    synthesis,
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
    };
  }, [recognition, stopAll, synthesis]);

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
    },
  };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserSpeechRecognitionProvider } from "@/lib/voice/browser-speech-recognition";
import { activateVoiceSession } from "@/lib/voice/audio-session";
import { OpenAISpeechSynthesisProvider } from "@/lib/voice/openai-speech-synthesis";
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
};

export function useVoiceMode({
  guideId,
  messages,
  isConversationLoading,
  submitTranscript,
  recognitionProvider,
  synthesisProvider,
}: VoiceModeOptions) {
  const recognition = useMemo(
    () => recognitionProvider ?? new BrowserSpeechRecognitionProvider(),
    [recognitionProvider],
  );
  const synthesis = useMemo(
    () => synthesisProvider ?? new OpenAISpeechSynthesisProvider(),
    [synthesisProvider],
  );
  const [isEnabled, setIsEnabled] = useState(false);
  const [inputState, setInputState] = useState<VoiceInputState>("idle");
  const [outputState, setOutputState] = useState<VoiceOutputState>("idle");
  const [playbackProvider, setPlaybackProvider] =
    useState<SpeechPlaybackProvider | null>(null);
  const [isPlaybackBlocked, setIsPlaybackBlocked] = useState(false);
  const [isAudioSessionActivated, setIsAudioSessionActivated] = useState(
    () => synthesis.isActivated ?? false,
  );
  const [activationFailed, setActivationFailed] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<VoiceError | null>(null);
  const submittedTranscriptRef = useRef(false);
  const lastSpokenMessageRef = useRef<string | null>(null);

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
        setIsAudioSessionActivated(synthesis.isActivated ?? false);
      }
    },
    [recognition, synthesis],
  );

  const activateAudioSession = useCallback(() => {
    const activation = activateVoiceSession(synthesis);

    void activation.then((activated) => {
      setIsAudioSessionActivated(activated);
      setActivationFailed(!activated);
      setError(null);
    });
  }, [synthesis]);

  const handleError = useCallback((voiceError: VoiceError) => {
    setError(voiceError);
    setInputState(
      voiceError.code === "recognition-unavailable" ? "unavailable" : "idle",
    );
    setOutputState(
      voiceError.code === "synthesis-unavailable" ? "unavailable" : "idle",
    );
  }, []);

  const startListening = useCallback(() => {
    if (
      !isEnabled ||
      !isAudioSessionActivated ||
      isConversationLoading
    ) {
      return;
    }

    synthesis.stop();
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
        try {
          await submitTranscript(finalTranscript);
        } finally {
          setInputState("idle");
        }
      },
      onEnd: () => {
        setInputState((current) =>
          current === "processing" ? current : "idle",
        );
      },
      onError: handleError,
    });
  }, [
    handleError,
    isConversationLoading,
    isAudioSessionActivated,
    isEnabled,
    recognition,
    submitTranscript,
    synthesis,
  ]);

  const stopListening = useCallback(() => {
    recognition.stop();
  }, [recognition]);

  useEffect(() => {
    if (!isEnabled || !isAudioSessionActivated) {
      return;
    }

    const latestGuideMessage = messages.findLast(
      (message) => message.role === "guide",
    );

    if (
      !latestGuideMessage ||
      latestGuideMessage.id === lastSpokenMessageRef.current
    ) {
      return;
    }

    lastSpokenMessageRef.current = latestGuideMessage.id;
    synthesis.speak(latestGuideMessage.content, guideId, {
      onProvider: setPlaybackProvider,
      onActivationRequired: () => {
        setIsAudioSessionActivated(false);
        setActivationFailed(true);
      },
      onPlaybackBlocked: () => {
        setIsPlaybackBlocked(true);
        setOutputState("idle");
        setError(null);
      },
      onStart: () => {
        setIsPlaybackBlocked(false);
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
    activationFailed,
    transcript,
    error,
    setEnabled,
    activateAudioSession,
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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserSpeechRecognitionProvider } from "@/lib/voice/browser-speech-recognition";
import { BrowserSpeechSynthesisProvider } from "@/lib/voice/browser-speech-synthesis";
import type {
  SpeechRecognitionProvider,
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
    () => synthesisProvider ?? new BrowserSpeechSynthesisProvider(),
    [synthesisProvider],
  );
  const [isEnabled, setIsEnabled] = useState(false);
  const [inputState, setInputState] = useState<VoiceInputState>("idle");
  const [outputState, setOutputState] = useState<VoiceOutputState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<VoiceError | null>(null);
  const submittedTranscriptRef = useRef(false);
  const lastSpokenMessageRef = useRef<string | null>(null);

  const stopAll = useCallback(() => {
    recognition.abort();
    synthesis.stop();
    setInputState("idle");
    setOutputState("idle");
  }, [recognition, synthesis]);

  const setEnabled = useCallback(
    (enabled: boolean) => {
      setIsEnabled(enabled);
      setError(null);
      setTranscript("");

      if (!enabled) {
        stopAll();
      }
    },
    [stopAll],
  );

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
    if (!isEnabled || isConversationLoading) {
      return;
    }

    synthesis.stop();
    setOutputState("idle");
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
    isEnabled,
    recognition,
    submitTranscript,
    synthesis,
  ]);

  const stopListening = useCallback(() => {
    recognition.stop();
  }, [recognition]);

  useEffect(() => {
    if (!isEnabled) {
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
      onStart: () => setOutputState("speaking"),
      onEnd: () => setOutputState("idle"),
      onError: handleError,
    });
  }, [guideId, handleError, isEnabled, messages, synthesis]);

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
    transcript,
    error,
    setEnabled,
    startListening,
    stopListening,
    stopSpeaking: () => {
      synthesis.stop();
      setOutputState("idle");
    },
  };
}

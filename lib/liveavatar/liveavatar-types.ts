export type LiveAvatarState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "listening"
  | "thinking"
  | "speaking";

export type LiveAvatarSnapshot = {
  state: LiveAvatarState;
  sessionId: string | null;
  error: string | null;
  reconnectAttemptCount: number;
  outputPath: "liveavatar" | "elevenlabs-fallback";
  environment: "sandbox" | "production" | null;
  idleTimeoutSeconds: number;
};

export type LiveAvatarStateListener = (snapshot: LiveAvatarSnapshot) => void;

export type LiveAvatarSpeechMetadata = {
  diagnosticId?: string;
  onPlaybackStarted?: () => void;
};

export interface DanielAvatarOutput {
  readonly isConnected: boolean;
  readonly supportsStreamingAudio: boolean;
  connect(): Promise<boolean>;
  reconnect(): Promise<boolean>;
  disconnect(): Promise<void>;
  dispose(): Promise<void>;
  attach(element: HTMLVideoElement | null): void;
  startListening(): void;
  stopListening(): void;
  setReady(): void;
  setThinking(): void;
  markFallback(): void;
  speakAudio(
    audioBase64: string,
    metadata?: LiveAvatarSpeechMetadata,
  ): Promise<void>;
  beginAudioStream(
    eventId: string,
    metadata?: LiveAvatarSpeechMetadata,
  ): Promise<void>;
  sendAudioChunk(eventId: string, pcm: Uint8Array): void;
  endAudioStream(eventId: string): void;
  interruptAudioStream(): void;
  interrupt(): void;
  subscribe(listener: LiveAvatarStateListener): () => void;
}

export const ELEVENLABS_TTS_MODEL = "eleven_multilingual_v2";
export const ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128";
export const ELEVENLABS_REQUEST_TIMEOUT_MS = 20_000;

export const ELEVENLABS_DANIEL_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.75,
  style: 0.12,
  use_speaker_boost: true,
  speed: 1,
} as const;

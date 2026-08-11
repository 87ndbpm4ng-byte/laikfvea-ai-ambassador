export function isLiveAvatarStreamingSpeechEnabled(
  environment: Record<string, string | undefined> = process.env,
) {
  // Experimental and fail-closed: missing, malformed, or mixed-case values
  // always retain the stable repeatAudio() production path.
  return environment.LIVEAVATAR_STREAMING_SPEECH?.trim() === "true";
}

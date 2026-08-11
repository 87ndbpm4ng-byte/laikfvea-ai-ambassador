export const LIVEAVATAR_STREAMING_SDK_VERSION = "0.0.18" as const;
export const LIVEAVATAR_STREAMING_MAX_BUFFERED_BYTES = 1_000_000;

type InternalStreamingSocket = Pick<
  WebSocket,
  "bufferedAmount" | "readyState" | "send"
>;

type StreamingSdkInternals = object & {
  _sessionEventSocket?: InternalStreamingSocket | null;
};

function pcmToBase64(pcm: Uint8Array) {
  const blockSize = 32_768;
  let binary = "";
  for (let offset = 0; offset < pcm.byteLength; offset += blockSize) {
    binary += String.fromCharCode(...pcm.subarray(offset, offset + blockSize));
  }
  return btoa(binary);
}

/**
 * Experimental LiveAvatar streaming adapter. Disabled by default because SDK
 * 0.0.18 lacks public backpressure/acknowledgement APIs. Stable production path
 * uses repeatAudio().
 *
 * Narrow adapter over the LITE WebSocket already owned by Web SDK 0.0.18.
 * It deliberately does not create sessions, sockets, LiveKit rooms, or auth.
 *
 * Review this adapter before upgrading @heygen/liveavatar-web-sdk.
 */
export class LiveAvatarStreamingAdapter {
  private activeEventId: string | null = null;

  constructor(private readonly session: object) {
    if (!("_sessionEventSocket" in (session as object))) {
      throw new Error(
        `LiveAvatar SDK internals are incompatible with streaming adapter ${LIVEAVATAR_STREAMING_SDK_VERSION}.`,
      );
    }
  }

  get isStreaming() {
    return this.activeEventId !== null;
  }

  beginAudioStream(eventId: string) {
    if (!eventId || this.activeEventId) {
      throw new Error("A LiveAvatar audio stream is already active.");
    }
    this.requireOpenSocket();
    this.activeEventId = eventId;
  }

  sendAudioChunk(eventId: string, pcm: Uint8Array) {
    this.assertActiveEvent(eventId);
    if (!pcm.byteLength) return;

    const socket = this.requireOpenSocket();
    if (socket.bufferedAmount > LIVEAVATAR_STREAMING_MAX_BUFFERED_BYTES) {
      throw new Error("LiveAvatar streaming socket backpressure limit reached.");
    }
    socket.send(
      JSON.stringify({
        type: "agent.speak",
        event_id: eventId,
        audio: pcmToBase64(pcm),
      }),
    );
  }

  endAudioStream(eventId: string) {
    this.assertActiveEvent(eventId);
    this.requireOpenSocket().send(
      JSON.stringify({ type: "agent.speak_end", event_id: eventId }),
    );
    this.activeEventId = null;
  }

  interruptAudioStream() {
    const eventId = this.activeEventId;
    this.activeEventId = null;
    if (!eventId) return;

    const socket = this.getOpenSocket();
    socket?.send(
      JSON.stringify({ type: "agent.interrupt", event_id: eventId }),
    );
  }

  private assertActiveEvent(eventId: string) {
    if (!this.activeEventId || this.activeEventId !== eventId) {
      throw new Error("LiveAvatar streaming event is stale or inactive.");
    }
  }

  private requireOpenSocket() {
    const socket = this.getOpenSocket();
    if (!socket) {
      throw new Error("LiveAvatar LITE WebSocket is not open.");
    }
    return socket;
  }

  private getOpenSocket() {
    const socket = (this.session as StreamingSdkInternals)._sessionEventSocket;
    return socket?.readyState === 1 ? socket : null;
  }
}

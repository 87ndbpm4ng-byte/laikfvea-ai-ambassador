# LiveAvatar progressive speech adapter

> Experimental LiveAvatar streaming adapter. Disabled by default because SDK
> 0.0.18 lacks public backpressure/acknowledgement APIs. Stable production path
> uses `repeatAudio()`.

The repository-owned adapter in `liveavatar-streaming-adapter.ts` is a narrow
extension of `@heygen/liveavatar-web-sdk@0.0.18`. It uses the session's existing
`_sessionEventSocket` only; session creation, authentication, LiveKit, WebRTC,
reconnection, and cleanup remain owned by the official SDK.

The SDK dependency is intentionally pinned to `0.0.18`. Review and retest this
adapter before upgrading the LiveAvatar SDK. A test verifies both the package
pin and the expected internal transport field so an incompatible upgrade fails
clearly.

The server-only flag defaults to `false` and production should keep it false.
Setting `LIVEAVATAR_STREAMING_SPEECH=true` explicitly forwards direct
ElevenLabs `pcm_24000` progressively. The first packet is approximately 600 ms
(28,800 bytes) and subsequent packets are approximately one second (48,000
bytes). One answer uses one event ID across `agent.speak` packets and its final
`agent.speak_end` packet.

Set the flag to `false` to retain the known-working complete-buffer
`repeatAudio()` path. The flag is reported to the browser only as the selected
safe transport mode; it is not a public environment variable.

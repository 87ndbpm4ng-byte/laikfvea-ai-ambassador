# Exhibition Adversarial Robustness Audit

## Executive summary

**Overall recommendation: NOT READY FOR UNSUPERVISED PUBLIC USE.** The application has strong deterministic grounding, failure containment, speech cleanup, lazy LiveAvatar startup, multilingual UI copy, and a tested inactivity reset. It is suitable for supervised rehearsal and controlled exhibition testing. One reproducible product-context defect can make a follow-up resolve to the wrong product after an Explorer-selected product is replaced by an explicit conversational switch. That must be fixed before unattended use.

This audit evaluated application behavior and robustness, not missing product knowledge. The six approved manuals remain the only approved product evidence; all six product-information supplements remain pending and excluded.

Visual capture could not be completed because the approved in-app browser blocked localhost access under its URL security policy. No workaround or alternate browser was used. Visual, touch, and physical-distance observations are therefore marked **MANUAL QA REQUIRED** rather than presented as observed facts.

### Finding counts

| Priority | Count | Meaning |
|---|---:|---|
| P0 | 1 | Can produce a wrong-product answer in a normal visitor journey |
| P1 | 9 | Material reliability, recovery, privacy, or perceived-performance risk |
| P2 | 7 | Useful hardening or polish |

## Audit baseline and evidence boundaries

- Branch: `feature/liveavatar`
- HEAD: `c6355cd1112bf3dc631458f2b4b77b32ccc443e7`
- Initial working tree: one pre-existing untracked audit, `audits/final-visitor-experience-audit.md`
- Paid model/TTS calls: none
- Real LiveAvatar sessions: none
- Evidence: source inspection, current deterministic suites, mock provider tests, static rendering tests, and local deterministic state simulations
- Screenshot evidence: unavailable because localhost capture was blocked; physical kiosk and visual-flow assertions require manual QA

## Simulated visitor journeys

| Scenario | Current result | Assessment |
|---|---|---|
| One clear supported question | Retrieval and grounded generation path is structurally correct | READY, provider latency aside |
| Extremely short contextual question | Works when server session has a clear active product/topic | READY |
| Vague question without context | Context resolver marks ambiguous references rather than guessing | SAFE |
| “How does it work?” after product selection | Resolves through active product context | READY |
| “What about this one?” without a selected product | Marked ambiguous | SAFE |
| “And the other one?” after GO/PRO comparison | Resolves through comparison order | READY |
| Repeated product switching by typed questions only | Server session follows explicit product names | READY |
| Explorer selects PRO, typed switch to Air Purifier, then “How do I clean it?” | Follow-up is forced back to PRO by stale client context | **P0** |
| GO versus PRO comparison | Explicitly supported multi-source comparison | READY |
| Technical then commercial | Commercial handoff preserves server product context | READY in the selected language |
| Commercial then technical | Product context is preserved | READY in the selected language |
| Mixed-language commercial question | Commercial intent can be missed when query language differs from selected UI language | P1 |
| Unsupported then supported | Boundary response does not destroy the session; supported retry remains possible | READY |
| Same question twice | Two requests and two answers are allowed; no crash or duplicate transport from one submission | ACCEPTABLE |
| Talk during speech | Existing synthesis stop/interruption path clears highlighting | READY in mocks |
| Typed question during speech | Submission stops prior speech/highlighting | READY in mocks |
| Rapid Quick Questions | Loading guard prevents duplicate requests, but a second pre-render click can perturb voice state | P2 |
| Product Explorer during speech | Conversation unmount stops speech/highlighting | READY in source/tests |
| Product Explorer during processing | Request continues off-screen and may become a surprise spoken answer on return | P1 |
| Language change | Available only through session end/reset; this safely clears visitor state | READY |
| End while listening | Recognition is aborted and callbacks invalidated | READY |
| End while processing | Request is aborted and late completion rejected | READY |
| End while speaking | Audio, highlighting, avatar output, and local conversation are reset | READY |
| End during avatar connection | Desired connection is cancelled, but immediate-next-visitor overlap is not directly covered | P1 |
| Visitor walks away | 2-minute idle timeout with 15-second warning resets after inactivity | READY |
| Visitor returns during warning | Any activity or Continue Session resets timer | READY |
| New visitor after automatic reset | Local language, specialist, product, messages, speech, and audio reset | READY in tests |
| Empty/whitespace input | Submit remains disabled or returns false | READY |
| More than 1,000 characters | Client accepts it; server rejects it with generic service-unavailable UX | P1 |
| Emoji/punctuation-only input | Accepted as a model request rather than locally rejected as low-signal | P2 |
| Product spelling mistake | No typo/fuzzy product identity layer was found | P2 |
| Network timeout | 25-second timeout, stale completion invalidation, concise retry response | SAFE but slow |
| Model/invalid response failure | No fabricated answer; session remains retryable | READY |
| Speech failure | Text answer remains; provider details are hidden | READY |
| Microphone denied/unavailable | Typing and Quick Questions remain usable | READY |
| LiveAvatar unavailable | Text and voice fallback remain available; retries are bounded | READY, except connect timeout gap |
| Delayed/stale response | Generation/controller check blocks display after reset | READY |
| Delayed/stale audio | Request sequence/reset protections prevent replay into a new visitor | READY |

## Conversation continuity findings

### P0-1 — stale Explorer product overrides a later conversational product switch

- **Scenario:** Select PRO in Product Explorer, ask or return to conversation, say “Tell me about the Air Purifier,” then ask “How do I clean it?”
- **Observed/current behavior:** `useConversation` keeps `activeProductRef` at `advanced`. The explicit Air Purifier message is correctly recognized by the server for that turn, but the client does not update its ref from the server session/result. The next follow-up again sends `activeProduct: advanced`; `markProductViewed` writes PRO into the server session immediately before reference resolution. A deterministic simulation produced `active product: Advanced Bottle; active topic: cleaning`.
- **Desired behavior:** The explicit product switch becomes the single client/server active product and remains active for subsequent pronouns and Quick Questions.
- **Likely root cause:** Product identity is maintained independently in client ref, rendered message metadata, and server session. The conversation API does not return the resolved active product, and the client response metadata simply echoes the request product.
- **Smallest safe fix:** Return the server-resolved active product in successful conversation responses and update the client active-product ref only from a current-generation response. Do not infer it from answer text.
- **Regression tests:** Explorer selection → typed product switch → ambiguous follow-up for every product pair; stale response cannot overwrite a newer product; Quick Questions and active-product label update from the resolved product.
- **Requires final product knowledge:** No.

### Continuity strengths

- Pure commercial turns preserve product context.
- GO/PRO first/second/other references have explicit deterministic behavior.
- Ambiguous pronouns with no context are marked for clarification.
- End Conversation clears the client session ID, message list, product ref, language, specialist, voice state, and selected screen.
- Retrieval/product isolation remains strongly covered.

## Human interaction state quality

The state model exposes ready, listening, processing, speaking, avatar connection, offline, and inactivity-warning states. Talk changes to Stop while listening. Processing disables Talk, composer submission, and Quick Questions. Speech can be interrupted by Talk, typing, Quick Questions, Escape, navigation unmount, or End Conversation.

### P1-1 — processing is non-cancellable and can look frozen for up to 25 seconds

- **Scenario:** A slow conversation request after the visitor submits a question.
- **Current behavior:** Talk, text submission, and Quick Questions are disabled. The preparing indicator remains until response or the 25-second timeout. End Conversation remains available, and some product-navigation controls may remain available depending on context.
- **Desired behavior:** Clear progress plus a calm “Cancel / ask another question” path after a short threshold.
- **Root cause:** One-request-at-a-time loading guard has no visitor cancellation control.
- **Smallest fix:** Expose the existing request abort through a single localized cancel action after a short delay; return immediately to ready without ending the visitor session.
- **Tests:** Cancel during request, late response ignored, product/session context retained, no speech generated.
- **Final knowledge required:** No.

### P2-1 — low-signal input has no deterministic visitor guidance

Empty input is blocked, but emoji-only, punctuation-only, and random low-signal text can enter the model path. Add conservative local validation only for inputs with no letters/numbers, with localized “Please ask a product question” guidance. Do not reject mixed scripts or legitimate product codes.

## Interruption findings

### What is robust

- Recognition generations invalidate stale interim/final/error callbacks.
- Conversation requests use generation plus AbortController identity.
- Audio providers use request sequence and AbortController checks.
- New submissions stop current speech and highlighting before starting processing.
- LiveAvatar connection calls are deduplicated and reconnect attempts are bounded.
- Reset stops recognition, fallback audio, avatar speech, highlights, and current requests.

### P1-2 — navigation during processing does not cancel or visibly own the request

- **Scenario:** Submit a question, then open Product Explorer while processing.
- **Current behavior:** The conversation component unmounts, but the request belongs to `useConversation` in the page and continues. It can append a response while the visitor is browsing. Returning to conversation remounts voice state with no spoken-message history and can cause the completed response to begin speaking unexpectedly.
- **Desired behavior:** Either keep processing explicitly visible across screens, or cancel it when leaving conversation. No surprise speech on return.
- **Root cause:** Request lifecycle is page-level; speech lifecycle is conversation-component-level.
- **Smallest fix:** Cancel current conversation request on navigation away, or mark off-screen completions as read-only/not eligible for auto-speech.
- **Tests:** Explorer during processing, detail during processing, return after completion, no stale speech/highlight.
- **Final knowledge required:** No.

### P2-2 — rapid Quick Question clicks can perturb presentation state

The synchronous `loadingRef` prevents a second request, but each click calls voice preparation before submission. A second click within the pre-render window can stop/reset presentation and then cancel preparation. Add a synchronous UI submission guard around preparation, not only around the request.

## Kiosk chaos findings

### P1-3 — immediate next-visitor use is not tested against asynchronous avatar teardown

- **Scenario:** End Conversation during connection/speech and immediately select a language/specialist and press Talk.
- **Current behavior:** The UI returns to language selection before asynchronous disconnect promises finish. `resetInProgressRef` guards duplicate resets, but it does not gate a new visitor’s first interaction.
- **Desired behavior:** New visitor may enter immediately, while their first provider interaction waits for or supersedes teardown deterministically.
- **Root cause:** UI reset and provider teardown complete on separate timelines.
- **Smallest fix:** Add a teardown generation/barrier used only by activation, without delaying passive browsing.
- **Tests:** Reset and new Talk at 0, 100, and 500 ms; old disconnect cannot cancel new connect; exactly one fresh session.
- **Final knowledge required:** No.

### P1-4 — server-side kiosk sessions accumulate after client reset

- **Scenario:** Hundreds or thousands of visitors use the kiosk over multiple days.
- **Current behavior:** The browser drops `sessionId`, but no End/Reset API calls `SessionManager.resetSession` or deletes the in-memory server session. Conversation histories remain in the process store until restart.
- **Desired behavior:** End Conversation and inactivity reset delete or expire the associated server session.
- **Root cause:** Reset is entirely client-side; the server store has delete/reset capability but no visitor-reset route or TTL sweep.
- **Smallest fix:** Best-effort session-end request plus short inactivity TTL/periodic eviction on the server. Client reset must never wait on it.
- **Tests:** 25/250 visitor server-store soak, end/timeout eviction, failed cleanup remains non-blocking, no cross-session access.
- **Final knowledge required:** No.

### P2-3 — client conversation DOM grows without a cap

Only the last ten messages are sent as model history, but all messages remain rendered locally until reset. A determined visitor can create a long, increasingly heavy document. Keep a reasonable visible-turn window with an accessible “earlier messages omitted” marker, while preserving current-session context on the server.

## Failure and degraded-mode matrix

| Layer failure | Visitor can continue? | Text preserved? | Typing / Quick Questions / Explorer | Reload required? | Internal details hidden? | Finding |
|---|---|---|---|---|---|---|
| Microphone permission denied | Yes | N/A | Available | No | Yes | Good |
| No/busy microphone | Yes | N/A | Available | No | Yes | Good |
| Recognition unsupported/fails | Yes | N/A | Available | No | Yes | Good |
| Conversation network failure | Yes after failure response | Failure guidance shown | Available | No | Yes | P1: failure response may trigger TTS |
| Conversation timeout | Yes after 25 s | Timeout guidance shown | Available afterward | No | Yes | P1: long locked period |
| Invalid/model response | Yes | Safe boundary shown | Available | No | Yes | Good |
| ElevenLabs failure | Yes | Yes | Available | No | Yes | Good |
| OpenAI TTS failure | Yes | Yes | Available; Emily browser fallback where possible | No | Yes | Good |
| LiveAvatar failure | Yes | Yes | Available | No | Yes | P1: session request lacks a client timeout |
| Browser audio blocked | Yes | Yes | Available; Play response offered | No | Yes | Good |
| `navigator.onLine === false` | Local UI remains | No new product answer | Explorer and existing content available | No | Yes | P1: commercial handoff also unavailable |

### P1-5 — LiveAvatar session creation has no application timeout

- **Scenario:** Session endpoint or network stalls indefinitely without rejecting.
- **Current behavior:** `LiveAvatarService.createConnection()` awaits fetch with no AbortSignal timeout. The voice activation promise and “getting ready” state may remain pending.
- **Desired behavior:** Fail to voice-only/text mode within a bounded interval and allow a later explicit reconnect.
- **Smallest fix:** Abort the session request after a conservative timeout, classify it retryable, retain the current two-retry ceiling.
- **Tests:** never-resolving fetch, timeout fallback, reset abort, late completion ignored.
- **Final knowledge required:** No.

### P1-6 — failure guidance is treated as ordinary speech content

- **Scenario:** Conversation request fails, then the new guide message automatically enters speech synthesis.
- **Current behavior:** The localized failure text is stored as a normal guide answer and selected for speech. During the same network outage, TTS may fail too, adding delay and a second recovery message.
- **Desired behavior:** Show failure guidance immediately as text and do not auto-synthesize it unless audio is already locally available.
- **Smallest fix:** Add non-factual response metadata such as `delivery: text-only-recovery`; keep the content visible but exclude it from pending guide speech.
- **Tests:** network/timeout/invalid failure never starts TTS; next successful answer speaks normally.
- **Final knowledge required:** No.

## Offline-readiness assessment

After the app is loaded, language selection, specialist selection, Product Explorer, product details, existing answers, typing, Quick Questions, and End Conversation are client-rendered. New grounded product answers require the conversation API. Voice and LiveAvatar also require network providers. A hard reload while offline has no explicit service-worker/offline-shell guarantee.

### P1-7 — deterministic commercial handoff is server-resident

The commercial handoff has no commercial facts and is deterministic, but it is executed in the server orchestrator. When connectivity is lost, “What is the MOQ?” receives the network failure instead of the intended staff handoff.

**Smallest useful offline architecture:**

1. Keep the loaded application shell and Product Explorer usable; optionally cache only static shell/assets through a minimal service worker after a dedicated deployment review.
2. Run the already-approved pure-commercial detector and localized handoff locally before calling the conversation API. Do not duplicate commercial facts.
3. When offline, preserve the typed question and show one localized retry message; do not queue questions across visitors.
4. Do not build an offline LLM. If desired later, package a small signed/versioned set of approved Quick Question answers, but only after a separate grounding and update-policy review.

### P2-4 — no verified offline reload shell

Temporary loss after load degrades reasonably; a reload or browser restart during outage may not. This is a deployment/runbook issue before it is an application feature.

## Privacy and next-visitor isolation

### Strong client isolation

- Language and specialist return to unselected.
- Product ref resets.
- Messages, draft (by component unmount), transcript, recognition, error, speech, highlight, audio URL, and activation state clear.
- Pending conversation completion fails the generation/controller test after reset.
- Pending TTS/audio is aborted or sequence-invalidated.
- Both avatar services are disconnected.

### Remaining risk

P1-4 covers server session retention. It is not visible to visitor B through normal UI, but it is unnecessary persistence and an unbounded kiosk-process store. P1-3 covers the untested immediate-next-visitor teardown race.

## Five-language findings

Static UI, recovery copy, Quick Questions, product names, commercial handoff, and retrieval normalization have deterministic coverage in English, Russian, Simplified Chinese, Cantonese, and French. Cantonese strings use Traditional Chinese. Session context is retained in representative non-English flows.

### P1-8 — mixed-language commercial intent is not robust

- **Scenario:** UI is Russian but visitor asks “How much does it cost?”, or UI is English but visitor asks “Сколько это стоит?”
- **Current behavior:** The commercial detector evaluates only patterns for the selected UI language plus universal MOQ/OEM terms. Deterministic probes returned `kind: none` for English-price/Russian-UI, Russian-price/English-UI, Chinese-price/French-UI, and French-price/Chinese-UI.
- **Desired behavior:** Pure commercial intent is recognized across supported languages without changing the answer language.
- **Smallest fix:** Run all five commercial signal sets for detection, but use only the selected language for the handoff response and clause reconstruction. Keep false-positive exclusions.
- **Tests:** 5×5 query-language/UI-language matrix, mixed technical/commercial clauses, existing false positives.
- **Final knowledge required:** No.

### P2-5 — product spelling mistakes lack deterministic tolerance

No typo/fuzzy identity layer was found. Add only a conservative curated typo map for exhibition product names after measuring likely mistakes; do not loosen global retrieval scoring.

### Manual multilingual QA required

- French and Russian recovery-copy wrapping at 390×844
- Chinese/Cantonese line breaking and font fallback
- Naturalness of short recovery messages spoken aloud
- Mixed-script IME composition and Enter behavior on the target Safari/iPadOS version

## Response-presentation findings

Quick/standard/detailed depth rules, safety overrides, unsupported boundaries, enlarged typography, normal document flow, and sentence-level highlighting are protected by tests. New questions interrupt current audio and clear highlighting.

### P2-6 — `aria-live` surrounds the full response history

Appending a turn inside one polite live region may cause assistive technology to re-announce more than the newest response. Restrict live announcement to current status/latest answer while keeping one semantic visible history.

### Manual presentation QA required

- Standing-distance readability at 1440×900 and 1194×834
- Long-answer below-fold discoverability
- Whether scrolling during speech makes the active sentence hard to follow
- Layout stability during avatar connection/fallback transitions
- Touch interruption while the on-screen keyboard is open

## Performance and latency findings

### Likely latency chain

1. Talk gesture and audio-session/avatar activation begin concurrently.
2. Browser speech recognition waits for final transcript.
3. Conversation request performs session update, retrieval, model generation, grounding validation, and possibly a second clarification generation.
4. TTS generation runs after text arrives.
5. LiveAvatar connection and buffered audio handoff precede avatar playback; browser audio is fallback.

### Unavoidable external latency

- Browser recognition finalization
- Model generation
- TTS generation
- WebRTC/avatar session establishment
- Network variability at the venue

### Avoidable application latency or perceived delay

- Up to 25 seconds with no cancellation (P1-1)
- Unbounded LiveAvatar session fetch (P1-5)
- TTS attempt for network-failure text (P1-6)
- Potential second model call after grounding clarification; this is safety-driven and should not be removed merely for speed

### P2-7 — no deterministic slow-stage telemetry suitable for rehearsal

Development diagnostics exist for voice/lip sync, but there is no single non-sensitive local timeline covering submit → response → TTS ready → playback started. Add development-only coarse timing marks, never provider tokens/content, to identify venue bottlenecks. Do not expose them in production UI.

## Recommended fixes in priority order

1. **P0:** Make server-resolved active product authoritative and synchronize it to the client after every current response.
2. **P1:** Add request cancellation/replace behavior and define navigation-away semantics during processing.
3. **P1:** Add best-effort server session deletion plus TTL eviction.
4. **P1:** Bound LiveAvatar session fetch duration and protect immediate-next-visitor activation with teardown generation.
5. **P1:** Mark recovery responses text-only so a network failure does not trigger another network speech request.
6. **P1:** Detect commercial intent across all supported input languages while answering in the selected UI language.
7. **P1:** Add client input-length validation with localized, specific guidance.
8. **P1:** Move pure deterministic commercial handoff ahead of the network boundary for offline resilience.
9. **P2:** Add low-signal input handling and a synchronous rapid-submission guard.
10. **P2:** Cap visible conversation turns and narrow live-region announcements.
11. **P2:** Decide whether an offline shell and curated typo aliases are warranted after venue-device testing.
12. **P2:** Add development-only end-to-end latency markers.

## What can be completed before final knowledge arrives

Every P0 and P1 item above is independent of final product-information supplements. They concern identity synchronization, lifecycle, cancellation, offline handoff, session disposal, failure delivery, and input robustness. They can be fixed and regression-tested without touching approved or pending knowledge.

## What should wait for final knowledge

- New advantage/positioning answers
- New visitor-use recommendations
- Additional product comparisons beyond approved evidence
- Curated offline factual answers beyond the existing approved Quick Question scope
- Any new claim, benefit, FAQ answer, or product-specific demonstration wording

## Final recommendation

Proceed with supervised rehearsal only. Do not use unattended public mode until P0-1 is fixed and regression-tested. Before final exhibition deployment, complete P1-1 through P1-8, run a 250-session deterministic chaos soak that includes immediate reset/re-entry, and perform physical iPad/Safari testing under throttled and interrupted network conditions. Preserve the current grounding, product isolation, concise answer-depth system, commercial semantics, lazy provider startup, and client-side stale response/audio protections.

## Change-control confirmation

- Production files modified: none
- Approved knowledge modified: none
- Pending supplements modified or activated: none
- Retrieval/grounding/prompts/voice/LiveAvatar/environment modified: none
- Paid provider calls: none
- Real LiveAvatar sessions: none
- Commit/push/merge/deployment: none

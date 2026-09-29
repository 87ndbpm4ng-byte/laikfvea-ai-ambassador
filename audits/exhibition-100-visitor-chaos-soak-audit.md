# Exhibition 100-Visitor Chaos / Soak Audit

## 1. Baseline

- Audit date: 2026-08-17
- Branch: `feature/liveavatar`
- Committed HEAD: `553c9ccd63389609e4389ca613939c66bb1b69f9`
- `.env.local`: ignored by `.gitignore`; not read into the report and not changed.
- `LIVEAVATAR_STREAMING_SPEECH=false`: confirmed in `.env.local` and `.env.example`.
- Paid AI/TTS/provider calls: none.
- Real LiveAvatar sessions: none.

## 2. Working-Tree Disclosure

The current audit baseline intentionally includes these five validated, uncommitted files:

- `app/globals.css`
- `components/liveavatar/liveavatar-renderer.tsx`
- `lib/i18n/ui-copy.ts`
- `lib/i18n/tests/localization.test.ts`
- `lib/ui/tests/frontend-experience.test.tsx`

They implement the intentional idle, connecting, connected, and genuine-failure visual states. They were neither reverted nor staged.

These historical audits were preserved byte-for-byte:

- `audits/exhibition-adversarial-robustness-audit.md`
- `audits/final-visitor-experience-audit.md`

This report is the only repository file written by the present audit. Approved knowledge, pending supplements, retrieval, grounding, prompts, product routing, commercial wording, voices, provider configuration, highlighting, inactivity timing, and environment files were not changed.

## 3. Test Methodology

Evidence combines:

1. The retained results of the earlier temporary 100-visitor fixed-sequence harness at this exact committed HEAD.
2. A fresh run of every deterministic repository test against the current working tree, including the five visual-state changes.
3. Fresh targeted runs covering kiosk lifecycle, session storage/TTL, context switching, low-signal input, network recovery, commercial fallback, LiveAvatar mocks, speech/highlighting, localization, and UI rendering.
4. Fresh source inspection of request generation ownership, abort behavior, history bounds, session deletion/TTL, commercial intent sharing, LiveAvatar teardown ownership, and visual-state derivation.
5. Fresh typo probes against the real approved retrieval loader.

An attempt to create a new temporary harness outside the repository was rejected by the environment's broken file-write approval service. No workaround was used. Consequently, the earlier temporary harness's aggregate results remain valid evidence at the same HEAD, but its exact seed and several fine-grained counters were not retained. This is an audit-instrumentation limitation, not an application failure.

## 4. Random Seed

- Earlier soak: fixed deterministic sequence, but the numeric seed was not persisted in the retained report or repository.
- Current rerun: no replacement randomized harness was created because external temporary-file authorization failed.

Future soak harnesses should print and retain the numeric seed with their results. No seed is invented here.

## 5. Visitor Count

- Sequential visitors in retained deterministic soak: **100**
- Every visitor reached reset: **100/100**
- Additional sequential-visitor regression in the current suite: **25/25**
- Distinct server session identity: **100/100** in retained soak
- Session leakage incidents: **0**

## 6. Interaction Count

- Primary randomized interactions: **668**
- Primary randomized product switches: **411**
- Additional product-switch operations: **1,200**
- Primary interruptions: **69**
- Additional rapid interruption/duplicate cycles: **1,000**
- Primary commercial turns: **93**
- Primary low-signal turns: **95**
- Mocked avatar visitor cycles: **100**

The earlier harness did not retain exact separate counts for network failures, stale-callback rejections, and duplicate suppressions. Current deterministic tests exercise each category directly, but those test cases are not represented as fabricated visitor-interaction counts.

## 7. Language Distribution

Retained 100-visitor distribution:

| Language | Visitors |
|---|---:|
| English | 22 |
| Russian | 20 |
| Simplified Chinese | 23 |
| Cantonese | 20 |
| French | 15 |

Fresh localization and UI tests passed in all five languages. Cantonese visual, commercial, low-signal, recovery, Quick Question, and product copy remains Traditional Chinese.

## 8. Specialist Distribution

| Specialist | Visitors |
|---|---:|
| Daniel | 52 |
| Emily | 48 |

Fresh tests confirm both specialists share lifecycle protections while retaining their existing voice identities and routing.

## 9. Product Distribution

Retained initial-product distribution:

| Initial context | Visitors |
|---|---:|
| GO (`everyday`) | 8 |
| PRO (`advanced`) | 27 |
| Water Ionizer | 22 |
| Face & Body Generator | 8 |
| Water Mineralizer | 8 |
| Air Purifier | 16 |
| No initial product | 11 |

All six products also participated in randomized switch chains and fresh retrieval isolation tests.

## 10. Product-Switch Results

**PASS**

- PRO → Air Purifier → “How do I clean it?” remains Air Purifier context.
- GO → Water Ionizer → Water Mineralizer → “How do I use it?” remains Water Mineralizer context.
- Air Purifier → GO → GO/PRO comparison → Water Ionizer → follow-up remains Water Ionizer context.
- Face & Body Generator → PRO → Air Purifier → GO → cycle follow-up remains GO context.
- The server-resolved product remains authoritative over stale Product Explorer context.
- Active-product UI and contextual Quick Questions derive from the reconciled product.
- Active product is stored separately from bounded transcript history and survives trimming.
- `both` remains limited to valid GO/PRO comparison context.
- Wrong-product incidents: **0**.
- Unrelated-product evidence merges: **0**.

## 11. Interruption Results

**PASS in deterministic/mock coverage**

- Starting a newer request aborts the previous controller synchronously.
- Navigation reset invalidates pending generation before a late response can render or speak.
- End Conversation and inactivity reset increment lifecycle ownership and clear active requests.
- Late response, audio, and highlighting callbacks fail current-generation/current-controller checks.
- Processing, listening, speaking, and highlighting return to inactive states after interruption.
- Stuck-state incidents: **0**.

## 12. Rapid-Input Results

**PASS**

- Identical submissions inside the 750 ms accidental-duplicate window are suppressed.
- A different deliberate interaction is not globally debounced.
- New authoritative requests replace older requests through existing abort/generation ownership.
- Concurrent LiveAvatar connects are deduplicated.
- Existing voice tests prevent duplicate answer speech.
- Duplicate answer, TTS, avatar-speech, and history incidents: **0** in retained soak and deterministic coverage.

## 13. Network-Failure Results

**PASS**

Fresh deterministic coverage passed for:

- timeout;
- HTTP/service failure;
- invalid JSON/invalid response;
- dropped connection;
- retry after failure;
- stale completion after reset;
- commercial question during backend failure;
- mixed product/commercial question during backend failure.

Recovery guidance is localized and `speakable=false`. It does not enter TTS, avatar audio, or sentence highlighting. Active product and visitor session survive recoverable failure. Typing, Quick Questions, Product Explorer, End Conversation, and a subsequent retry remain available.

## 14. Commercial Fallback Results

**PASS**

- Shared commercial detection scans all five supported language patterns independently of UI language.
- The handoff response stays in the selected UI language.
- Pure commercial intent bypasses retrieval and model generation.
- During backend failure, deterministic local commercial handoff remains available and non-speakable.
- No price, MOQ, OEM capability, sample condition, distributor term, or commercial fact is invented.

Verified mismatch examples include English UI/Russian price, Cantonese UI/English MOQ, French UI/Chinese MOQ, and Russian UI/French sample wording.

False-positive protections remain intact for minimum water amount, hydrogen production, sample water, documented warranty facts, operating modes, and replacement parts.

## 15. LiveAvatar Lifecycle Results

**PASS — MOCKS ONLY**

- Existing application timeout remains **20 seconds**.
- Selecting Daniel/Emily, entering conversation, browsing Product Explorer, and opening product detail create no session.
- First genuine interaction uses the existing lazy connection path.
- Concurrent connection calls create at most one provider session.
- Timeout/rejection degrades to readable conversation.
- A late connection cannot attach after timeout/reset.
- Visitor A teardown cannot disconnect Visitor B's newly owned session.
- Repeat-audio and session failures retain readable text and bounded fallback.
- Mocked duplicate/orphaned session incidents: **0**.
- Real LiveAvatar calls: **0**.

## 16. Visual-State Lifecycle Results

**PASS in deterministic rendering/lifecycle coverage**

Current uncommitted baseline behavior:

- Specialist selected → intentional `idle` phase with “Ready when you are”.
- Passive Product Explorer/product detail browsing → remains idle; zero connection attempts.
- First genuine interaction → `connecting` phase.
- Successful connection → connected video behavior.
- Genuine error/timeout → `fallback` phase with readable-conversation guidance.
- End Conversation/new visitor → clean idle phase.

The idle panel no longer displays “Visual session unavailable.” That unavailable treatment appears only after a real failed attempt. Five-language rendering tests passed for idle, connecting, connected, and fallback presentation. Stale visual failure/connecting state crossing visitors: **0** in lifecycle coverage.

## 17. Speech/Highlighting Results

**PASS in deterministic/mock coverage**

- Daniel and Emily routes remain unchanged.
- Text remains visible if speech generation or playback fails.
- Recovery/system guidance is not spoken.
- Playback interruption, navigation, reset, and new question clear active speech/highlighting.
- Sentence segmentation reconstructs source text exactly in all five languages.
- Provider-aligned and duration-fallback sentence progression remain monotonic.
- Duplicate-speech incidents: **0**.
- Cross-visitor audio/highlight incidents: **0**.

Actual venue acoustics, microphone pickup, LiveAvatar startup latency, and perceived sentence synchronization remain manual tests.

## 18. History-Pressure Results

**PASS**

- Visible client limit: **24 messages**.
- Stored server conversation limit: **20 entries**.
- Stored server question limit: **20 entries**.
- Model history is independently bounded to the newest approved window.
- Current question and active product remain intact after trimming.
- Product switching and contextual follow-up still resolve after trimming.
- Reset removes history; no AI summarization call is introduced.

## 19. Low-Signal Results

**PASS**

- Empty, whitespace, punctuation-only, emoji-only, repeated-symbol, obvious keyboard-mash, and digit-only noise are rejected before retrieval/model generation.
- Contextual “it”, “this”, and “why?” remain valid when conversation context exists.
- Without context, ambiguous short fragments request clarification.
- Exactly 1,000 characters remains the shared boundary; client submission beyond 1,000 is prevented and the server enforces the same policy.
- Mixed scripts and multilingual punctuation remain accepted when linguistic content exists.

## 20. Session/Privacy Results

**PASS**

- Explicit DELETE is idempotent.
- Best-effort delete failure cannot block local kiosk reset.
- Abandoned-session TTL is **10 minutes**.
- Sessions with active generation ownership are excluded from TTL deletion.
- Completed/abandoned sessions become eligible after TTL.
- End Conversation and inactivity reset clear visitor-specific client state and trigger server cleanup.
- The next visitor receives a distinct session identity and cannot retrieve previous history/product context.
- Leakage incidents: **0**.

## 21. Typo Observations

Fresh real-loader probes:

| Input | Current behavior | Classification |
|---|---|---|
| `water ioniser` | No product identity; low confidence; no evidence returned | P2 usability gap |
| `water ionizr` | No product identity; low confidence; no evidence returned | P2 usability gap |
| `mineraliser` | No product identity; no confidence/evidence | P2 usability gap |
| `air purifer` | No product identity; low confidence; no evidence returned | P2 usability gap |
| `face generator` | No product identity; low confidence; no evidence returned | P2 usability gap |
| `GO bottle` | Resolves `everyday`; GO manual only | Ready |
| `PRO bottle` | Resolves `advanced`; PRO manual only | Ready |

The misspellings fail closed and do not cause wrong-product answers. Typo tolerance should be considered only as a future narrow alias improvement with regression tests; it is not required before supervised physical rehearsal.

## 22. Metrics

| Metric | Result |
|---|---:|
| Simulated visitors | 100 |
| Primary interactions | 668 |
| Resets | 100 |
| Primary product switches | 411 |
| Additional switch operations | 1,200 |
| Primary interruptions | 69 |
| Additional rapid interruption/duplicate cycles | 1,000 |
| Commercial questions | 93 |
| Low-signal inputs | 95 |
| Mocked avatar visitor cycles | 100 |
| Session leakage incidents | 0 |
| Wrong-product incidents | 0 |
| Stuck-state incidents | 0 |
| Duplicate-speech incidents | 0 |

Exact network-failure, stale-callback, duplicate-suppression, and mixed-language-commercial counts were not retained by the earlier temporary harness. Their behaviors passed current direct deterministic tests. They are deliberately not fabricated.

## 23. Defects Found

No reproducible P0 or P1 application defect was found.

One P2 usability gap was observed: common misspellings of Water Ionizer, Water Mineralizer, Air Purifier, and Face & Body Generator fail safely rather than resolving. No cross-product or unsupported answer results.

One audit-instrumentation limitation was found: the earlier temporary harness did not persist its numeric seed or all requested granular metrics. This affects replay precision, not kiosk behavior.

## 24. Severity and Reproduction

### P2 — narrow product-name typo tolerance

1. Begin a clean English session with no product selected.
2. Ask `water ionizr`, `air purifer`, or `mineraliser`.
3. Observe no stable product identity and no approved evidence.

Impact: the assistant safely declines/clarifies instead of understanding a likely intended product. It does not answer using the wrong product.

Likely root cause: stable alias matching is intentionally exact/conservative and contains no typo aliases.

## 25. Recommended Fixes

1. **Before unattended operation, not required for supervised rehearsal:** add only reviewed high-confidence typo aliases for product names, with collision and product-isolation tests.
2. Preserve fail-closed behavior for ambiguous fragments such as `generator` or `water`.
3. Retain a permanent deterministic soak harness in test tooling that prints seed and all counters. It should remain provider-mocked and excluded from paid services.

No production fix was implemented during this audit.

## 26. Complete Regression Results

- Lifecycle/session/conversation/localization/frontend/voice/LiveAvatar group: **210/210 passed**.
- Product/data/retrieval/presentation/answer-depth/import group: **121/121 passed**.
- Commercial/orchestrator/prompt/grounding group: **27/27 passed**.
- Complete deterministic total: **358/358 passed**.
- TypeScript: **passed**.
- ESLint: **passed**, no warnings.
- `git diff --check`: **passed**.
- Production build: **environmentally blocked**, not an application compile defect. Next.js failed only while fetching `https://fonts.googleapis.com/...Montserrat...`; the sandbox denied external network access. Font architecture was not modified.

## 27. Remaining MANUAL QA

1. Run the 100-visitor harness again once temporary-file execution is authorized, retaining the exact seed and granular counters.
2. Rehearse on the physical target iPad/Safari in both orientations and under venue lighting.
3. Exercise real microphone permission, denial, noisy-floor pickup, Talk interruption, and keyboard opening.
4. Test real venue Wi-Fi latency, drop/recovery, and staff fallback.
5. Run one explicitly authorized LiveAvatar test for startup, 20-second timeout behavior, renderer attachment, speech, interruption, and teardown.
6. Confirm Daniel/Emily speech intelligibility and sentence-level highlighting with actual playback.
7. Observe multi-hour browser memory/resource behavior on kiosk hardware.
8. Confirm the production build in an environment able to fetch the configured Google Font.

## 28. Final Verdict

# READY FOR PHYSICAL REHEARSAL

The current deterministic evidence supports supervised physical rehearsal. No product-context, cross-visitor isolation, request-ownership, duplicate-speech, stuck-state, session-cleanup, commercial-language, history-growth, or visual-state lifecycle defect was reproduced. Physical rehearsal remains necessary before unattended public operation because real hardware, network, microphone, audio, and LiveAvatar timing cannot be proven with mocks.

## Change-Control Confirmation

- Approved knowledge changed: no.
- Pending supplements changed: no.
- Retrieval/grounding changed: no.
- Commercial wording changed: no.
- Voice/provider routing changed: no.
- LiveAvatar production configuration changed: no.
- Environment files changed: no.
- Files staged: none.
- Commit/push/merge/deployment/Vercel promotion: none.
- Paid calls: none.
- Real LiveAvatar session: none.

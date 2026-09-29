# Final Exhibition Visitor Experience Audit

## Executive Summary

**Overall rating: NEEDS WORK**

The core exhibition journey is understandable and technically mature: a visitor can choose a language, choose a specialist, explore a clearly grouped six-product portfolio, enter a product-specific conversation, use contextual questions, receive grounded answers, switch context, and end the session. The typography, touch targets, product grouping, multilingual coverage, deterministic commercial handoff, retrieval isolation, and reset protections are strong foundations.

The application is suitable for **supervised exhibition testing**, but not yet for unattended public deployment. The most important issues are: the specialist choice immediately creates a real LiveAvatar session before the visitor asks to use voice; the 390 px French specialist screen visibly clips long localized content; four products have large neutral placeholders instead of recognizable product visuals; and active product/session-exit context is less prominent than it should be in a shared kiosk.

Audit counts:

- P0: 1
- P1: 7
- P2: 7

Evidence was captured from the running application at `1194×834`, `834×1194`, `390×844`, and `1440×900`. The remaining interaction states were checked through implementation inspection and deterministic tests. No microphone permission was accepted and no Talk control was activated.

## Visitor Journey Map

1. **Language selection — healthy.** Five large native-language choices are immediately understandable and comfortably tappable.
2. **Specialist selection — usable with friction.** Daniel and Emily are presented as equal choices, but the reason for choosing between them is more nuanced than a first-time visitor needs, and both visual areas are placeholders.
3. **Conversation entry — clear but busy.** The visitor sees Talk, typing, Quick Questions, Explore Products, the specialist stage, and End Conversation at once. The main prompt is understandable, but there are several competing entry actions.
4. **Quick Questions — strong.** Four optional shortcuts provide immediate direction. Product-specific questions are grounded and update with product context.
5. **Product Explorer — structurally strong.** Functional Water and Clean Air are correctly grouped. GO and PRO are recognizable; four products are not visually identifiable.
6. **Product detail — clear but sparse.** The product name and Ask action are obvious. Missing imagery makes the screen feel unfinished and reduces the value of opening it.
7. **Ask specialist — functional.** The selected product becomes conversation context and contextual Quick Questions appear. The transition may spend several seconds preparing services.
8. **Answer and follow-up — readable.** The enlarged answer presentation, document-flow scrolling, and sentence-level reading highlight are appropriate for standing-distance reading. Grounded follow-ups are protected by session context.
9. **Product switching — technically reliable.** Retrieval/session tests confirm identity changes and isolation. Visually, the active product is communicated mainly through the Quick Questions heading rather than a persistent context marker.
10. **Commercial question — safe and natural.** The assistant bypasses factual generation for a pure commercial request and directs the visitor to stand staff in all five languages.
11. **Unsupported question — safe.** The assistant stays within approved information, although the boundary response can feel less helpful than a suggested supported next question.
12. **End Conversation — technically excellent, visually understated.** Reset clears language, guide, product context, conversation, audio, highlighting, and avatar state. The control is easy to overlook.
13. **Abandonment — protected.** A 120-second inactivity timer, 15-second warning, and reset flow already exist and should be retained.

## What Works Very Well

- The language screen requires no explanation and uses native language names.
- Touch targets are large and separated; the application does not depend on hover.
- The six-product portfolio is easy to scan structurally and avoids ecommerce language.
- Functional Water versus Clean Air is visually understandable without adding product claims.
- Quick Questions solve the empty-chat problem and remain normal grounded questions rather than hard-coded answers.
- Product-specific Quick Questions are supported by approved sources in all five languages.
- Product identity, follow-up context, and cross-product isolation have substantial deterministic coverage.
- The answer area is large, wide, and remains in normal document flow.
- Sentence-level highlighting is calmer and more robust than word-level karaoke behavior.
- Typed input remains available when microphone, speech, or avatar output fails.
- Commercial questions receive a concise staff handoff without invented prices, MOQ, OEM terms, or contacts.
- End Conversation performs a comprehensive reset, and the kiosk soak test confirms 25 sequential visitor sessions do not retain request state.
- Cantonese visitor copy uses Traditional Chinese and natural Cantonese constructions.

## P0 Issues

### P0-1 — Specialist selection starts a real LiveAvatar session immediately

**Visitor impact:** A visitor who only wants to browse products or type a question causes the visual session to connect. They see a large blank stage and “getting ready” state before they have expressed any need for the avatar. In a busy exhibition this can feel like waiting for the interface, consume limited session capacity, and make a temporary provider failure part of the first impression.

**Evidence:** Selecting Daniel caused `POST /api/liveavatar/session` and a real session token request. `selectSpecialist()` explicitly calls `liveAvatarServices[guideId].connect()` immediately. The session was ended immediately during this audit; Talk was not pressed.

**Recommended solution:** Defer real LiveAvatar connection until the visitor explicitly activates Talk or until the first answer actually needs avatar playback. Keep the conversation screen and product browsing immediately available with the static visual state. This solves unnecessary startup cost and removes the initial “preparing” distraction.

## P1 Issues

### P1-1 — French content clips at the 390×844 fallback

**Visitor impact:** The French specialist heading, supporting sentence, cards, and CTA content extend beyond the visible viewport and are clipped. The page reports no horizontal overflow, so the visitor cannot pan to recover the missing content.

**Evidence:** Current-run screenshot `10-french-guide-mobile.png`; viewport and document width both reported 390 px while content was visibly cut off.

**Recommended solution:** Audit narrow-screen `font-size`, fixed/min widths, and overflow rules for the specialist header/cards. Add long-localization visual regression coverage, not only a scroll-width assertion.

### P1-2 — Four of six products are not visually recognizable

**Visitor impact:** Water Ionizer, Face & Body Generator, Water Mineralizer, and Air Purifier use the same large neutral “visual coming soon” treatment. A first-time visitor cannot connect the digital card to the physical object on the stand, and the portfolio feels partially unfinished.

**Evidence:** Current-run Product Explorer and Water Ionizer detail screenshots.

**Recommended solution:** Add approved real product photography for the four missing products before exhibition deployment. Preserve the neutral placeholders until authentic assets exist.

### P1-3 — The specialist decision adds cognitive load before product discovery

**Visitor impact:** A first-time visitor must understand “Wellness Specialist” versus “Technology Specialist” before seeing any product. Both specialists provide the same grounded product facts, while the descriptive distinction may make visitors worry they chose the wrong person.

**Evidence:** Specialist screen presents two equally dominant cards and different role descriptions before conversation entry.

**Recommended solution:** Keep both characters, but make the consequence explicit and low-risk: both answer product questions; the choice changes presentation style. Do not imply separate factual domains.

### P1-4 — The empty conversation presents too many competing actions

**Visitor impact:** Talk, four Quick Questions, two Explore Products entry points, typing, and End Conversation are visible simultaneously. Visitors who touch before reading may hesitate between Talk, Explore Products, and the Explore Products Quick Question.

**Evidence:** Current-run conversation screenshot shows both an “Explore products” shortcut and a separate “Explore products →” action.

**Recommended solution:** Keep one visually primary path and remove the duplicate Explore Products presentation. This solves choice competition without reducing capability.

### P1-5 — Active product context is not persistent enough

**Visitor impact:** After several turns or a product switch, spectators and returning visitors may not know which product “it” refers to. The context is visible in the latest visitor question and the Quick Questions heading, but not as a stable conversation label.

**Evidence:** Session logic changes active product correctly; the visible conversation header remains only “Conversation with Daniel/Emily.”

**Recommended solution:** Add a small, non-claim context label such as “Discussing: Air Purifier” near the conversation heading, updated from active product. This solves reference ambiguity without changing session architecture.

### P1-6 — End Conversation is visually understated

**Visitor impact:** The essential privacy/reset action appears as quiet text beneath the left-side voice panel, separated from the main task area. Visitors may walk away rather than ending the session.

**Evidence:** Current-run conversation screenshot; the reset control has substantially less emphasis than Talk, Quick Questions, and Send.

**Recommended solution:** Keep it secondary but make it a clearly bounded utility action in a consistent header/edge position. It must remain separate from ordinary navigation to avoid accidental taps.

### P1-7 — Generic product introductions may retrieve a narrow feature first

**Visitor impact:** “Tell me about the Water Ionizer” produced a concise answer focused on hydrogen mode and `up to 300 ppb`, rather than first establishing that the product offers multiple ionized-water modes. The answer was grounded, but it could create an incomplete first mental model.

**Evidence:** Current-run answer: “The Water Ionizer is a household appliance that processes drinking water using electrolysis…” followed immediately by hydrogen-mode specifications.

**Recommended solution:** Add deterministic overview intent coverage per product so a generic introduction prioritizes product identity, purpose, and major documented modes before secondary specifications. Do not change facts or thresholds.

## P2 Improvements

### P2-1 — The language screen lacks a one-line purpose cue

The next action is obvious, but a bystander cannot tell what the kiosk does until after choosing a language. A short neutral product-information cue could increase confidence without naming products early.

### P2-2 — The fifth language creates an orphan tile

French sits alone in a two-column grid at tablet sizes. It remains usable, but the composition looks unfinished. A balanced final-row treatment would improve polish.

### P2-3 — Clean Air and portfolio actions start below the first landscape viewport

At `1194×834`, Functional Water fills the visible region and Clean Air is not initially visible. Normal page scrolling works, but some visitors may conclude the portfolio is water-only.

### P2-4 — Missing-image detail pages devote too much space to absence

The neutral placeholder is safe, but it occupies about half the Water Ionizer detail screen. Until approved imagery exists, a more compact omission would put the Ask action and product identity first.

### P2-5 — Some Quick Questions are expert-oriented

“Hydrogen concentration,” “pH level,” and “pre-filter replacement” are valid and grounded, but one simpler “What does it do?” option per product would better serve casual visitors. This should replace, not expand, the current four-question limit.

### P2-6 — Commercial handoff gives no visual directional cue

The localized wording is natural and safe, but “a member of our team at the stand” assumes the visitor can identify staff. If exhibition operations define a visible staff point, an approved non-personal direction could help. Do not invent one.

### P2-7 — Large-display vertical fit is slightly imperfect

At `1440×900`, the specialist page measured 926 px tall, requiring a small scroll. It does not block the CTA, but a kiosk-focused first screen should ideally fit without incidental scrolling at the target height.

## Screen-by-Screen Review

### Language selection

Strong hierarchy, native language names, large targets, and fast comprehension. Cantonese is correctly shown as `廣東話`. At tablet sizes the layout is calm; on mobile it stacks cleanly. The screen is intentionally neutral and does not prematurely introduce product names.

### Daniel / Emily selection

Both choices are prominent and their roles are described. The page works well at `1194×834` and `834×1194`. The lack of real character imagery weakens confidence, and long French copy is broken at 390 px. The role distinction could be interpreted as different factual expertise even though both use the same knowledge.

### Conversation entry

The answer column receives appropriate visual priority. Talk is large and readable, typing is obvious, and Quick Questions remove blank-chat anxiety. The duplicate Explore Products path and understated End Conversation action weaken hierarchy. The large visual stage is empty while the connection prepares.

### Product Explorer

The two-category structure is clear and accurately reflects the portfolio. Product names are readable, cards are large, and no ecommerce cues appear. GO and PRO visuals help recognition. The four identical placeholders are the largest portfolio weakness.

### Product detail

Back to portfolio, product name, category, question guidance, and Ask specialist form a simple path. The action is clear. Without imagery or approved supplementary content, four detail pages feel like navigation interstitials rather than useful product moments.

### GO/PRO comparison

The relationship is structurally limited to GO and PRO, which is correct. Deterministic tests protect both-source retrieval and inhalation/mineralisation isolation. The comparison remains a supported special case rather than a general six-product ranking tool.

## Conversation UX

The enlarged answer typography and width are appropriate for an arm’s-length or slightly farther viewing distance. Visitor questions are visually subordinate to specialist answers without becoming unreadable. Long answers remain in page flow, avoiding nested scroll traps and overlap with Quick Questions.

The assistant should continue leading with a short direct answer, then structured detail. The observed Water Ionizer answer was concise and readable, but the most visitor-important overview information was not necessarily first. Numbered instructions and specifications have existing rendering support; manual testing with the on-screen keyboard remains required.

## Voice / Avatar UX

The Talk control uses clear ready, listening, thinking, and speaking states. Error copy consistently points back to typing. Mocks cover interruption, stale speech, buffered PCM, fallback MP3, playback blocking, reset, and avatar failure.

The main weakness is connection timing: selecting a specialist starts the visual session before Talk. This creates the initial blank “getting ready” period and makes a paid dependency part of product browsing. No microphone permission or real spoken test was performed during this audit.

Sentence-level highlighting is an appropriate guided-reading treatment. It updates infrequently, preserves semantic text, clears on reset/interruption, and does not require word-perfect lip-sync.

## Product Explorer UX

The Explorer communicates “portfolio at this stand,” not “online shop.” Functional Water and Clean Air are first-class sections; Air Purifier is not incorrectly compared with water products. The single Clean Air card feels intentional once reached, but it starts below the fold at the landscape audit size.

Real approved visuals for all products are the highest-value content improvement. They solve recognition, trust, and physical-stand mapping simultaneously.

## Quick Questions UX

The general set gives four good entry paths: explore, compare bottles, operate the ionizer, and learn about the purifier. Every product has four contextual questions grounded in approved manuals and localized statically in five languages. Tests confirm all 120 product/language shortcuts retrieve the intended approved source.

Suggestions change with explicit product switches and stale questions disappear. The only UX concern is question sophistication: casual visitors may benefit from one simple overview question in every product set.

## Multilingual UX

English, Russian, Simplified Chinese, Cantonese, and French have localized navigation, product names, Quick Questions, error states, reset copy, and commercial handoffs. Cantonese uses Traditional Chinese and Cantonese forms.

Tablet layouts handled English and Cantonese without horizontal overflow. French mobile rendering is a concrete failure despite passing structural CSS tests. Russian and French long-copy mobile screens require equivalent visual regression checks. Translation naturalness beyond the obvious Cantonese forms remains a native-speaker manual QA item.

## Commercial Handoff UX

The handoff is short, safe, and actionable: visitors are told to speak with stand staff. Pure commercial questions bypass retrieval and model generation; mixed questions preserve the supported product portion and append the handoff. Active product survives the commercial turn. No prices, MOQ, OEM capabilities, contacts, or promises are invented.

## Unsupported Question UX

The grounding policy correctly refuses unsupported health, competitor, suitability, and missing-specification claims. The response is safe and does not expose source IDs or internal metadata. For exhibition warmth, future boundary responses should offer one nearby supported question when possible, but must not expand the factual scope.

## Session Reset / Next Visitor

End Conversation clears language, specialist, selected product, typed draft through component teardown, conversation history, speech synthesis, audio fallback, highlighting generation state, and both avatar sessions. The 25-session deterministic soak test found no stale request/generation state.

An inactivity reset is **already implemented and recommended**. It uses a two-minute timer, pauses while the system is busy, shows a 15-second warning, accepts pointer/keyboard/touch/input activity, and returns to language selection. This is appropriate for abandoned exhibition sessions. Manual timed verification on the final kiosk hardware remains required.

## Exhibition Tablet UX

- `1440×900`: strong two-card specialist layout; minor 26 px vertical overflow.
- `1194×834`: strong primary tablet landscape experience; Product Explorer requires scrolling to reach Clean Air and final actions.
- `834×1194`: English/Cantonese language and specialist screens fit without horizontal overflow; large cards remain touch friendly.
- `390×844`: language selection works; French specialist selection visibly clips and is not acceptable as a fallback.

Keyboard-open behavior, orientation changes during an active answer, safe-area behavior on the final physical device, and focus order with an external keyboard remain manual QA requirements.

## Failure / Recovery UX

Network, timeout, malformed response, and missing-service failures use localized visitor-safe messages. Provider names, keys, stack traces, raw response bodies, and internal source IDs are not exposed. Microphone denial explicitly preserves typed input. Speech failure preserves text. Avatar failure preserves voice/audio fallback, and playback blocking offers a replay action.

The offline message says the visitor can end or retry after connection returns. There is no dedicated visible retry button for a failed factual response; the visitor must resubmit or choose another question. This is acceptable but not ideal for a hurried kiosk user.

## Performance / Perceived Speed

Language, guide, portfolio, and detail transitions are immediate. The local application builds and renders quickly. Model response latency remains several seconds and is covered by “preparing response” state. Avatar startup is the largest perceived delay because it begins before the visitor requests voice and occupies a prominent blank region.

## Recommended Changes

Implementation order is based on concrete visitor impact:

1. **Defer real LiveAvatar connection until explicit voice use or first avatar playback.** Prevents unnecessary waiting and paid-session consumption.
2. **Fix long-localization mobile clipping and add screenshot-based 390 px tests.** Makes the fallback usable for French and protects other long languages.
3. **Add approved real visuals for Water Ionizer, Face & Body Generator, Water Mineralizer, and Air Purifier.** Lets visitors connect the kiosk portfolio to physical stand products.
4. **Make End Conversation a clearly bounded utility control.** Improves privacy and next-visitor readiness.
5. **Add a persistent active-product context label.** Removes ambiguity during product switching and follow-ups.
6. **Remove the duplicate Explore Products entry on the empty conversation screen.** Clarifies the first action.
7. **Strengthen deterministic overview intent for each product.** Ensures “Tell me about…” begins with identity/purpose before secondary specifications.
8. **Clarify that Daniel and Emily share product knowledge and differ in explanation style.** Reduces specialist-choice anxiety.
9. **Replace one advanced Quick Question per product with a simple overview question where useful.** Helps casual visitors without increasing choice count.
10. **Visually verify timed inactivity warning/reset and keyboard behavior on final hardware.** Confirms public-session safety beyond mocks.

## Things NOT to Change

- The native-language-first entry screen and five supported languages.
- Stable six-product IDs and Functional Water/Clean Air grouping.
- GO/PRO as the only configured comparison relationship.
- Registry-driven product identity and contextual Quick Questions.
- Four-question maximum and large touch targets.
- Approved-manual grounding and withheld-claim boundaries.
- Deterministic commercial staff handoff.
- Enlarged answer typography, reading width, and normal document flow.
- Sentence-level guided highlighting.
- Typed fallback when voice/avatar fails.
- Comprehensive End Conversation reset and inactivity protection.
- Cantonese Traditional Chinese text and approved voice routing.

## Final Exhibition Readiness

| Area | Rating | Rationale |
| --- | --- | --- |
| Visual UX | ACCEPTABLE | Premium typography and spacing; missing product/guide visuals and mobile clipping reduce finish. |
| Navigation | GOOD | Journey is linear and reversible; End Conversation is understated. |
| Product discovery | ACCEPTABLE | Strong grouping and names; four missing visuals impair recognition. |
| Conversation | GOOD | Guided entry, readable answers, normal flow, and useful follow-ups. |
| Product knowledge | GOOD | Six approved sources, strong isolation, and safe boundaries; overview ordering needs review. |
| Multilingual experience | ACCEPTABLE | Strong static localization; French mobile clipping requires correction. |
| Voice | GOOD | Clear states and resilient typed fallback; live microphone still needs controlled hardware QA. |
| Avatar | NEEDS WORK | Robust mocks, but connection starts too early and presents a blank preparation state. |
| Session safety | EXCELLENT | Canonical reset, stale-state protections, warning, inactivity reset, and soak coverage. |
| Exhibition suitability | ACCEPTABLE | Suitable for supervised testing; fix P0 and high-impact P1s before unattended operation. |

## Recommended Next Milestone

The smallest coherent next milestone is **exhibition entry and session-control hardening**:

1. Defer LiveAvatar session creation to explicit voice/avatar need.
2. Fix 390 px long-language clipping.
3. Improve End Conversation discoverability.
4. Add a persistent active-product label.
5. Add deterministic and visual regression coverage for those changes.

Product photography should follow as a separate asset-completion milestone because it depends on approved real images rather than code invention.

## Evidence and Limits

Current-run screenshots were saved outside the repository under `/tmp/ai-ambassador-final-audit/`:

- `01-language.png`
- `02-guide.png`
- `03-conversation-empty.png`
- `04-portfolio.png`
- `05-water-ionizer-detail.png`
- `07-language-portrait.png`
- `08-cantonese-guide-portrait.png`
- `09-language-mobile.png`
- `10-french-guide-mobile.png`
- `11-language-large.png`

The live specialist path unexpectedly initiated one LiveAvatar session and one product-answer request before the risk was visible. The session was ended immediately, and no further live provider interactions were performed. Voice, interruption, sentence highlighting, commercial/unsupported answers, and failure paths were then assessed through deterministic tests and implementation inspection. Final native-speaker translation review, physical microphone testing, on-screen keyboard testing, timed inactivity observation, and real-device orientation testing remain manual QA requirements.

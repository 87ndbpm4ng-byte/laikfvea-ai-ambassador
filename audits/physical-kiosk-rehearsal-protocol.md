# Controlled Physical Kiosk Rehearsal Protocol

## Purpose and scope

Use this protocol on the actual exhibition tablet or touchscreen before public use. It validates physical interaction, browser behavior, real audio/video quality, real connectivity, and reset behavior that deterministic tests cannot prove.

This is a rehearsal procedure, not a deployment checklist. Do not change application code, knowledge, configuration, prompts, or provider settings while running it. Record defects in the companion results template and classify them; do not fix them during the rehearsal.

## Guardrails

- Run the passive and local checks first. They must create **zero** LiveAvatar sessions and no paid provider calls.
- Use the eight live interactions below only after the device, browser, microphone, and network have passed their passive checks.
- Keep a tally of live interactions. Stop live testing if a P0 fault, unexpected repeated session creation, or cross-visitor state is observed.
- Do not enter personal data, commercial terms, or unsupported health questions beyond the bounded tests in this document.
- Use only the approved manual-backed product questions supplied here.

## Actual journey under test

| Stage | What the tester should see or do | Expected behavior |
| --- | --- | --- |
| Language | Select English, Russian, Simplified Chinese, Cantonese, or French. | Native language label opens specialist selection. |
| Specialist | Select Daniel or Emily. | Conversation screen opens; no visual session is created yet. |
| Visual idle | Observe the visual panel before asking a question. | Intentional “Ready when you are” presentation, not an unavailable/failure message. |
| Product discovery | Use Explore Products, a product card, a detail view, Back, and comparison. | Browsing stays in visual idle; no microphone permission or avatar connection is requested. |
| First interaction | Use Talk, type and submit, tap a Quick Question, use a product-detail Ask action, or use comparison Ask. | The assistant may prepare voice/avatar output; the panel becomes Preparing and then connected or a readable fallback. |
| Conversation | Read an answer, listen where live testing is enabled, ask a follow-up, or switch product. | Answer history stays readable; the active-product indicator and contextual Quick Questions reflect the current product. |
| Commercial boundary | Ask a commercial question. | A concise staff handoff in the selected UI language; no commercial fact is supplied. |
| Recovery | Simulate a connection problem. | A localized non-technical recovery message; typing, product browsing, Quick Questions, and End Conversation remain usable. |
| Reset | Use End Conversation or allow inactivity timeout. | Returns to language selection with no previous visitor state. |

## Setup and evidence

1. Record device, OS, browser/version, screen size, orientation, network, tester, and time in the results template.
2. Use the intended kiosk URL, not a development-only mock UI.
3. Start in the intended display mode. Record whether browser chrome is visible and whether true kiosk/full-screen mode is available.
4. Set display brightness, system volume, screen sleep, and auto-lock to the intended exhibition configuration. Record their values.
5. Confirm no previous session is visible: language selection only, no product context, no answer, no visual failure, no active microphone state.

## Physical test set: 34 test cases

Mark each as PASS, PASS WITH NOTE, FAIL, or NOT TESTED in the template.

### A. Device, display, and readability (8)

1. **Landscape shell:** open the kiosk in landscape; verify no horizontal overflow, clipped CTA, or inaccessible conversation control.
2. **Portrait shell (if supported):** rotate to portrait and verify normal vertical scrolling, no horizontal overflow, and a usable Product Explorer.
3. **Kiosk/browser chrome:** check address bar, navigation chrome, safe areas, and browser back/forward behavior; record the operational mode that will be used at the stand.
4. **Keyboard:** focus the text field; verify keyboard appearance does not obscure the composer, Send, Talk, End Conversation, or the latest answer beyond recoverable page scrolling.
5. **Arm’s-length readability (~0.5 m):** check headings, response text, Quick Questions, product names, active-product label, recovery copy, End Conversation, and inactivity warning.
6. **One-metre readability:** repeat the same reading check standing normally.
7. **1.5-metre readability:** check the primary orientation cues, current product, answer start, Talk, Explore Products, and End Conversation.
8. **Safe physical behavior:** test accidental pinch zoom, text selection, long press, and swipe navigation. Record whether any can take the kiosk out of a usable state.

### B. Touch and navigation (8)

For each control, test a deliberate single tap, rapid double tap, repeated tap, and a nearby accidental tap where meaningful. Do not intentionally submit duplicate paid questions during the live phase; use passive navigation controls for repeated-tap checks.

9. Language buttons in all five languages.
10. Daniel and Emily specialist cards.
11. Talk, text input, Send, and keyboard Enter.
12. General and product-specific Quick Questions.
13. Explore Products, category navigation, Back to Portfolio, and all six product cards.
14. Product-detail Ask Daniel/Ask Emily action and GO/PRO comparison action.
15. End Conversation and the inactivity-warning Continue action.
16. Rapid navigation: conversation → Product Explorer → product detail → Back → conversation, including a tap immediately after a page transition.

### C. Passive visual lifecycle: no paid/live use (4)

17. Select Daniel, enter conversation, and wait 15 seconds without asking. Confirm the visual panel is intentionally idle and does not say it is unavailable.
18. From Daniel idle, browse Product Explorer, open two detail pages, return to conversation, and verify it remains idle. Repeat once for Emily.
19. Verify that passive browsing never requests microphone permission.
20. End Conversation from idle, immediately choose a new language and specialist, and confirm the new visitor has a clean idle state with no stale error or prior specialist/video.

### D. Microphone and voice input (5)

Use one controlled live question only after the first two microphone checks. Do not test Talk while another person is already actively speaking to the device.

21. **First Talk permission:** on a device/browser state where permission has not been granted, press Talk. Permission must be requested only now, not on page load, language selection, specialist selection, or browsing.
22. **Permission accepted:** ask a short approved question aloud. Confirm a clear listening state, final transcript, processing transition, and correct submitted question.
23. **Permission denied:** deny on a controlled browser profile or after resetting permission. Confirm calm localized guidance and that typing, Quick Questions, Product Explorer, and End Conversation still work.
24. **No speech / unavailable microphone:** start Talk and remain silent until the browser ends recognition, or use a controlled unavailable device condition. Confirm a recoverable state rather than a stuck listening state.
25. **Noise and position:** repeat one short approved spoken question in quiet conditions, normal exhibition-like background noise, close to the tablet, normal standing distance, and slightly off-axis. Record observed recognition reliability rather than a pass/fail acoustic claim.

### E. Product context and deterministic boundaries (5)

26. **Server-authoritative switch:** select PRO, ask about Air Purifier, then ask “How do I clean it?” Confirm Air Purifier remains the displayed and answered context.
27. **Multi-switch sequence:** GO → Water Ionizer → Water Mineralizer → “How do I use it?” Confirm Water Mineralizer is current.
28. **Curated alias:** type “Tell me about the air purifer.” Confirm the active-product indicator and answer are for Air Purifier; do not correct the visible visitor text.
29. **Commercial handoff:** run the four commercial questions below. Confirm selected UI language, concise staff handoff, no commercial fact, and no text-to-speech/highlight for the handoff if the current non-speakable route is active.
30. **Recovery boundary:** while offline or with a controlled backend failure, ask one product question; confirm a concise recovery message and continued access to Product Explorer, typing, Quick Questions, and End Conversation.

### F. Reset, inactivity, and next visitor (4)

31. Run ten short visitor cycles: language → specialist → one question → answer → End Conversation → next visitor. Vary language and product. After every reset, verify no answer, product, highlight, error, microphone/listening state, or avatar/video persists.
32. Start a live interaction, End Conversation as soon as an answer is speaking or the avatar is preparing, then immediately start a new visitor with the other specialist. Verify no old speech/video/callback is visible or audible.
33. Measure inactivity: wait for the two-minute timeout and final 15-second warning. Use Continue once, then repeat and allow reset. Record observed timing.
34. During separate listening, processing, and speaking moments, verify inactivity does not reset the session. Record whether the timer resumes correctly after each state ends.

## Minimal live-provider matrix: eight interactions

Run these after passive, display, touch, and microphone readiness checks. Each interaction is a single controlled question; record timings from submit to text, text to speech, and first interaction to visual availability as applicable. This is the minimum recommended paid/live set.

| # | Specialist | UI language | Product | Exact question | Primary verification |
| --- | --- | --- | --- | --- | --- |
| 1 | Daniel | English | GO | “How long is the GO cycle?” | Daniel English route; concise quick fact; GO context. |
| 2 | Daniel | Russian | PRO | “Какие режимы есть у PRO?” | Daniel Russian speech and PRO modes. |
| 3 | Daniel | Simplified Chinese | Water Ionizer | “水离子机可以制备哪些类型的水？” | Daniel Simplified Chinese route; product answer. |
| 4 | Daniel | Cantonese | Face & Body Generator | “面部及身體用氫水生成器一次噴霧循環幾耐？” | Daniel Cantonese/OpenAI route; 55-second cycle. |
| 5 | Daniel | French | Water Mineralizer | “Quels minéraux contient le minéralisateur d’eau ?” | Daniel French route; composition answer. |
| 6 | Emily | English | Air Purifier | “What room size is the Air Purifier designed for?” | Emily English route; coverage answer. |
| 7 | Emily | Russian | GO | “Как очистить бутылку GO?” | Emily non-English route; cleaning instruction. |
| 8 | Emily | French | Water Ionizer | “Comment sélectionner un niveau de pH ?” | Emily French route; pH-selection instruction. |

Coverage: Daniel in all five supported languages; Emily in English plus two non-English languages; all six products; Daniel Cantonese/OpenAI behavior; Daniel ElevenLabs language routes where configured; Emily/OpenAI route.

### Live lifecycle checks embedded in the matrix

- Before interaction 1, choose Daniel and browse a product detail. Confirm idle visual state and zero visual session before the question.
- On interactions 1 and 6, observe idle → Preparing → connected or calm fallback. Measure perceived connection time and note layout movement, video smoothness, lip-sync, and first speech timing.
- After interaction 6, End Conversation and immediately start interaction 7 as a new visitor with Emily. Verify no previous avatar/video/speech remains.
- Force one controlled visual failure or use an available non-production failure condition only if it does not create extra paid usage. Verify readable text conversation remains available and the visual panel gives calm fallback guidance.

## Speech, highlighting, and volume observation

For each live interaction, rate:

- intelligibility at normal standing distance;
- speaker volume over representative room noise;
- pace and naturalness;
- time from visible text to speech start;
- whether the active sentence highlight is visible and synchronized enough to follow;
- whether completed/upcoming sentence styling aids reading or distracts from the visual specialist;
- whether interrupting speech with Talk, a typed question, a Quick Question, Product Explorer, or End Conversation works without old speech continuing.

Record Daniel ElevenLabs routes, Daniel Cantonese/OpenAI route, and Emily/OpenAI route separately. The text answer is the source of truth: a TTS or visual failure must not remove it.

## Venue-like network rehearsal

Use browser/device network controls, a controlled access point, or a safe manual disconnect. Do not modify application configuration.

| Scenario | Procedure | Expected observation |
| --- | --- | --- |
| Normal Wi-Fi | Run one interaction from the live matrix. | Establish baseline timing. |
| Slow/throttled | Apply moderate throttling, then ask one short product question. | Processing feedback remains clear; no frozen state. |
| Disconnect before asking | Disconnect, submit an approved product question. | Localized recovery guidance; no stuck processing; browsing remains available. |
| Disconnect while processing | Submit, then disconnect before answer arrives. | Late answer/speech does not appear; recovery is readable. |
| Disconnect while preparing visual | Start a first interaction, then disconnect while Preparing. | Visual fallback/readable conversation remains usable. |
| Reconnect | Restore connectivity and submit a new approved question. | New request works without full reload where expected; product context is retained. |

While backend connectivity is unavailable, also run a clearly commercial question in the selected language. Confirm the local deterministic staff handoff is available without commercial facts, retrieval, model answer, or speech.

## Commercial handoff checks

Run after an existing live session is established, so these checks do not create additional first-session setup. Confirm the handoff is in the UI language, not necessarily the input language.

| UI language | Visitor question | Expected |
| --- | --- | --- |
| English | “How much does the PRO bottle cost?” | English staff handoff; no price. |
| Russian | “Какой минимальный заказ?” | Russian staff handoff; no MOQ. |
| Cantonese | “What is your MOQ?” | Traditional-Chinese Cantonese staff handoff; no MOQ. |
| French | “Можно заказать образец?” | French staff handoff; no sample commitment. |

## Safari/iPadOS checklist

If Safari on iPadOS is the target browser, record each item explicitly:

- autoplay and audio-unlock behavior after Talk, typed submit, and Quick Question;
- microphone permission prompt, persistence, and reset procedure;
- keyboard viewport resizing, input visibility, and scroll-to-latest-answer behavior;
- browser/address bars, full-screen/kiosk mode, orientation change, safe areas, and screen sleep;
- accidental pinch zoom, text selection, long press, swipe navigation, page refresh, and browser back gesture;
- recovery after app/browser backgrounding and return;
- speaker route, volume buttons, Bluetooth/audio-device behavior if any will be present at the stand.

## Performance rating method

Measure approximately; a phone stopwatch is sufficient. For each live interaction record:

- Talk tap → listening indication;
- submit → visible processing;
- submit → text answer;
- first genuine interaction → visual specialist ready or fallback;
- text answer → speech start;
- End Conversation → language-selection screen.

Classify each result:

- **FAST** — feels immediate for a trade-show visitor.
- **ACCEPTABLE** — clearly working, with tolerable wait feedback.
- **NOTICEABLE** — wait is obvious but the state remains understandable.
- **TOO SLOW** — likely to make a visitor abandon or assume failure.

## Severity and stop criteria

| Severity | Meaning | Required response |
| --- | --- | --- |
| P0 | Blocks public use or risks another visitor’s state, speech, or context appearing. | Stop the affected rehearsal path; document exact reproduction. |
| P1 | Materially damages reliability, usability, or comprehension. | Complete evidence collection; schedule a focused fix before public use. |
| P2 | Polish or minor usability issue with a clear workaround. | Record for prioritization after rehearsal. |

Stop live testing and escalate before public use if any P0 is found, including wrong-product context, cross-visitor answer/audio/video, inability to end/reset, permanently stuck listening/processing/speaking, or loss of readable answers after a provider failure.

## Completion criteria

The controlled rehearsal is complete when:

- all 34 physical cases are marked PASS, PASS WITH NOTE, FAIL, or NOT TESTED;
- eight live interactions are recorded, or each unrun one has a reason;
- all five languages, both specialists, and all six products have the planned coverage;
- ten manual next-visitor cycles and one automatic inactivity reset are recorded;
- network and commercial-boundary scenarios have evidence;
- all P0/P1 findings have exact reproduction and ownership for follow-up.

# Physical Kiosk Rehearsal Results Template

## Session information

| Field | Value |
| --- | --- |
| Date / time | |
| Venue / room | |
| Tester | |
| Device / model | |
| Screen size / resolution | |
| OS / version | |
| Browser / version | |
| Browser mode (kiosk/full-screen/browser chrome) | |
| Orientation | |
| Network / access point | |
| Signal / bandwidth observation | |
| Display brightness | |
| System volume / output route | |
| App URL / build identifier | |

## Status legend

- **PASS** — expected behavior observed.
- **PASS WITH NOTE** — usable, with a documented observation.
- **FAIL** — behavior diverges materially; include reproduction.
- **NOT TESTED** — not run; state why.

Severity: **P0** public-use blocker, **P1** significant visitor-experience/reliability issue, **P2** polish.

## Device, display, and readability

| ID | Test | Result | Observed latency / distance | Issue / severity | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Landscape shell: overflow, clipping, controls | | | | |
| 2 | Portrait shell, if supported | | | | |
| 3 | Browser chrome, safe areas, kiosk/full-screen | | | | |
| 4 | Keyboard: composer, Send, Talk, End Conversation visibility | | | | |
| 5 | Readability at arm’s length (~0.5 m) | | | | |
| 6 | Readability at 1 m | | | | |
| 7 | Readability at 1.5 m | | | | |
| 8 | Pinch, selection, long press, swipe navigation | | | | |

## Touch and navigation

| ID | Test | Single / double / repeated / nearby tap observations | Result | Issue / severity | Notes |
| --- | --- | --- | --- | --- | --- |
| 9 | Language buttons | | | | |
| 10 | Daniel and Emily selection | | | | |
| 11 | Talk, text input, Send, Enter | | | | |
| 12 | General and product Quick Questions | | | | |
| 13 | Explorer, categories, all six cards, Back | | | | |
| 14 | Product-detail Ask and comparison Ask | | | | |
| 15 | End Conversation and Continue Session | | | | |
| 16 | Rapid navigation sequence | | | | |

## Passive visual lifecycle

| ID | Test | Result | Avatar/session observation | Issue / severity | Notes |
| --- | --- | --- | --- | --- | --- |
| 17 | Daniel idle state after specialist selection | | | | |
| 18 | Idle Product Explorer/detail browsing; repeat Emily | | | | |
| 19 | No microphone permission before Talk | | | | |
| 20 | Idle reset and immediate new visitor | | | | |

## Microphone and voice input

| ID | Test | Language | Result | Recognition / latency observation | Issue / severity | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 21 | First Talk permission timing | | | | | |
| 22 | Permission accepted: listening → transcript → processing | | | | | |
| 23 | Permission denied: typed/Quick Questions remain usable | | | | | |
| 24 | No speech / microphone unavailable recovery | | | | | |
| 25 | Quiet/noisy, near/standing/off-axis recognition | | | | | |

## Product context, commercial boundary, and recovery

| ID | Test | Result | Expected current product / language | Issue / severity | Notes |
| --- | --- | --- | --- | --- | --- |
| 26 | PRO → Air Purifier → “How do I clean it?” | | Air Purifier | | |
| 27 | GO → Water Ionizer → Water Mineralizer → “How do I use it?” | | Water Mineralizer | | |
| 28 | “Tell me about the air purifer.” | | Air Purifier | | |
| 29 | Four commercial handoff questions | | Selected UI language; no terms | | |
| 30 | Offline/backend recovery | | Product context retained | | |

## Reset and inactivity

| ID | Test | Result | Measured timing | Issue / severity | Notes |
| --- | --- | --- | --- | --- | --- |
| 31 | Ten End Conversation / next-visitor cycles | | | | |
| 32 | End during speaking/preparing; immediate new visitor | | | | |
| 33 | Inactivity: 2 min + 15 sec warning + Continue/reset | | | | |
| 34 | Inactivity pauses during listening/processing/speaking | | | | |

## Live-provider interaction matrix

| # | Specialist | UI language | Product | Exact question | Text latency | Visual-ready/fallback latency | Speech-start latency | Voice / highlight / lip-sync result | Result | Issue / severity | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Daniel | English | GO | How long is the GO cycle? | | | | | | | |
| 2 | Daniel | Russian | PRO | Какие режимы есть у PRO? | | | | | | | |
| 3 | Daniel | Simplified Chinese | Water Ionizer | 水离子机可以制备哪些类型的水？ | | | | | | | |
| 4 | Daniel | Cantonese | Face & Body Generator | 面部及身體用氫水生成器一次噴霧循環幾耐？ | | | | | | | |
| 5 | Daniel | French | Water Mineralizer | Quels minéraux contient le minéralisateur d’eau ? | | | | | | | |
| 6 | Emily | English | Air Purifier | What room size is the Air Purifier designed for? | | | | | | | |
| 7 | Emily | Russian | GO | Как очистить бутылку GO? | | | | | | | |
| 8 | Emily | French | Water Ionizer | Comment sélectionner un niveau de pH ? | | | | | | | |

## Network scenarios

| Scenario | Procedure | Result | Recovery / retry observation | Issue / severity | Notes |
| --- | --- | --- | --- | --- | --- |
| Normal Wi-Fi | Baseline live interaction | | | | |
| Slow/throttled | Short product question | | | | |
| Disconnected before asking | Submit approved product question | | | | |
| Disconnect while processing | Disconnect after submit | | | | |
| Disconnect while Preparing | Disconnect during first visual activation | | | | |
| Reconnect | Restore network; ask another question | | | | |
| Offline commercial handoff | Clearly commercial question | | | | |

## Commercial handoff observations

| UI language | Visitor question | Handoff language | No commercial fact? | Speak/highlight observed? | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| English | How much does the PRO bottle cost? | | | | | |
| Russian | Какой минимальный заказ? | | | | | |
| Cantonese | What is your MOQ? | | | | | |
| French | Можно заказать образец? | | | | | |

## Safari/iPadOS observations

| Check | Result | Issue / severity | Notes |
| --- | --- | --- | --- |
| Autoplay/audio unlock | | | |
| Microphone permission persistence | | | |
| Keyboard viewport resizing | | | |
| Address bars / full-screen | | | |
| Orientation / safe areas | | | |
| Screen sleep / background return | | | |
| Pinch, long press, text selection, swipe | | | |
| Refresh / browser-back recovery | | | |

## Issue log

| Issue ID | Severity | Exact reproduction | Expected behavior | Actual behavior | Screenshot/video reference | Owner / next step |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

## Final scorecard

| Category | PASS / PASS WITH NOTE / FAIL / NOT TESTED | Notes |
| --- | --- | --- |
| Language selection | | |
| Specialist selection | | |
| Idle avatar state | | |
| Product Explorer | | |
| Product context | | |
| Quick Questions | | |
| Typing | | |
| Microphone | | |
| Daniel visual avatar | | |
| Emily visual avatar | | |
| Speech | | |
| Sentence highlighting | | |
| Commercial handoff | | |
| Network recovery | | |
| End Conversation | | |
| Inactivity reset | | |
| Next-visitor isolation | | |
| Standing-distance readability | | |
| Touch usability | | |
| Overall perceived quality | | |

## Rehearsal conclusion

- P0 count:
- P1 count:
- P2 count:
- Live interactions used: / 8
- Ten reset cycles completed: yes / no
- Inactivity reset completed: yes / no
- Recommended status: READY FOR PUBLIC EXHIBITION / NEEDS FIXES BEFORE PUBLIC EXHIBITION
- Sign-off tester and date:

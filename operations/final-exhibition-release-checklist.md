# Final Exhibition Release / Deployment Checklist

Use this checklist before any production release. A checkbox means verified with evidence, not assumed.

## Gate 1 — Code

- [ ] Working tree reviewed and intended changes identified.
- [ ] Validated local milestones committed.
- [ ] `feature/liveavatar` pushed.
- [ ] GitHub SHA confirmed.
- [ ] Vercel Preview generated.
- [ ] Preview smoke test passed.
- [ ] No secrets or environment files committed.
- [ ] Environment configuration reviewed without exposing secret values.

## Gate 2 — Final knowledge

Complete every item for GO, PRO, Water Ionizer, Face & Body Generator, Water Mineralizer, and Air Purifier.

| Product | Manual approved | Supplement complete | Advantages approved | Intended use approved | Functional result approved | Restrictions approved | FAQs approved | Comparison wording approved | Must Not Say approved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GO | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| PRO | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Water Ionizer | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Face & Body Generator | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Water Mineralizer | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Air Purifier | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Gate 3 — Knowledge integration

- [ ] A supplement changes from pending only after explicit approval.
- [ ] Approved source metadata is correct.
- [ ] Retrieval integration is complete.
- [ ] Product isolation is verified.
- [ ] No cross-product evidence leakage is found.
- [ ] Five-language query routing is verified.
- [ ] Health/medical boundary regression passes.
- [ ] Commercial-handoff regression passes.

## Gate 4 — Final acceptance bank

Reference: `audits/final-exhibition-acceptance-question-bank.md`.

- [ ] All 150 acceptance cases executed.
- [ ] 100% P0 cases pass.
- [ ] Zero wrong-product answers.
- [ ] Zero cross-product evidence leaks.
- [ ] Zero unsupported commercial claims.
- [ ] Zero unsupported health/medical/cosmetic claims.
- [ ] 100% mandatory product-switch, reset, language, and commercial gates pass.
- [ ] P1 pass rate is at least 98%.
- [ ] P2 pass rate is at least 90%.

## Gate 5 — Physical rehearsal

Reference: `audits/physical-kiosk-rehearsal-protocol.md`.

- [ ] Actual device tested.
- [ ] Safari/browser behavior tested.
- [ ] Microphone permission tested.
- [ ] Speaker volume tested.
- [ ] Standing-distance readability tested.
- [ ] Orientation tested.
- [ ] Network interruption tested.
- [ ] Ten visitor reset cycles tested.
- [ ] Inactivity reset physically timed.
- [ ] Daniel tested.
- [ ] Emily tested.
- [ ] Cantonese tested.
- [ ] Speech highlighting reviewed.
- [ ] Avatar lip-sync and perceived quality reviewed.

## Gate 6 — Production environment

Do not enter secret values in this document.

- [ ] Production URL confirmed.
- [ ] API configuration confirmed.
- [ ] OpenAI configuration confirmed.
- [ ] ElevenLabs configuration confirmed.
- [ ] LiveAvatar configuration confirmed.
- [ ] Intended Cantonese feature flag confirmed.
- [ ] `LIVEAVATAR_STREAMING_SPEECH=false` confirmed.
- [ ] Emily avatar configuration confirmed, if applicable.
- [ ] No development-only keys are present.
- [ ] No accidental debug mode is visible.

## Gate 7 — Vercel release

Workflow: `feature/liveavatar` → Preview → smoke test → approved merge/release path → Production deployment → production smoke test.

- [ ] Feature-branch Preview smoke test passed.
- [ ] **CONFIRM PRODUCTION BRANCH:** ______________________________
- [ ] Approved merge/release path confirmed.
- [ ] Production deployment approved.
- [ ] Production smoke test passed.
- [ ] No manual Vercel promotion performed outside the approved path.

## Gate 8 — Day-before check

- [ ] Device charged or powered.
- [ ] Cables and power supply present.
- [ ] Primary network tested.
- [ ] Backup network available.
- [ ] Browser/kiosk settings applied.
- [ ] Screen sleep disabled where appropriate.
- [ ] Sound level checked.
- [ ] Physical stand placement checked.
- [ ] QR/materials available if applicable.
- [ ] Operator Guide available.
- [ ] Quick Recovery card available.

## Gate 9 — Morning-of-show: five-minute smoke test

- [ ] Language selection.
- [ ] Daniel and Emily selection.
- [ ] Product Explorer.
- [ ] One Quick Question.
- [ ] One Talk question.
- [ ] One commercial handoff.
- [ ] End Conversation.
- [ ] Clean next visitor state.

## Gate 10 — Release decision

### GO

- [ ] All mandatory gates above pass.
- [ ] Stand manager approves opening.
- [ ] Technical owner approves opening.

### NO-GO

Do not open the kiosk for unattended public use if any of the following is present:

- wrong-product routing or cross-product evidence;
- cross-visitor leakage;
- repeated stuck listening, processing, or speaking state;
- unsupported health/medical claims;
- broken reset behavior;
- unusable microphone and text path;
- production configuration failure.

| Decision | Date / time | Stand manager | Technical owner | Notes |
| --- | --- | --- | --- | --- |
| GO / NO-GO | | | | |

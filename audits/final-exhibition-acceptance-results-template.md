# Final Exhibition Acceptance Results Template

Internal test record only. Do not place completed results or answers in production retrieval.

## Run metadata

| Field | Value |
| --- | --- |
| Test run ID | |
| Date / time | |
| Tester | |
| Build / commit | |
| Knowledge release ID | |
| Approved supplement IDs included | |
| Device / browser | |
| Provider mode (mock/live) | |
| Notes | |

## Status and severity

- Status: **PASS**, **FAIL**, **BLOCKED**, **NOT RUN**.
- Severity: **P0**, **P1**, **P2**, or **n/a**.
- Dependency result: **READY-NOW**, **FINAL-KB**, or **BOUNDARY**.

## Case results

| Test ID | Priority | Language | Visitor message / journey turn | Expected product | Actual resolved product | Expected source domain | Retrieved source IDs | Expected depth | Actual depth | Actual answer (verbatim or safe excerpt) | Status | Severity | Issue / reproduction | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Q001 | | | | | | | | | | | | | | |
| Q002 | | | | | | | | | | | | | | |
| Q003 | | | | | | | | | | | | | | |
| … | | | | | | | | | | | | | | |

## Source-isolation evidence

| Test ID | Expected manual/supplement source(s) | Actual source(s) | Any wrong-product source? | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| | | | yes / no | | |

## Commercial and boundary verification

| Test ID | Selected UI language | Input language | Boundary expected | Commercial/health fact invented? | TTS/highlight suppressed where required? | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | yes / no | yes / no | | |

## Product-switch and reset verification

| Journey / test | Turn | Server-resolved product | Client indicator | Quick Questions context | Retrieved source domain | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| J02 | | | | | | | |
| J07 | | | | | | | |
| J12 | | | | | | | |
| J15 | | | | | | | |

## Issue register

| Issue ID | Test IDs | Severity | Exact reproduction | Expected behavior | Actual behavior | Root-cause hypothesis | Owner | Retest status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | | |

## Release-gate summary

| Gate | Target | Actual | PASS / FAIL | Evidence / issue IDs |
| --- | --- | --- | --- | --- |
| Wrong-product answers | 0 | | | |
| Cross-product evidence leakage | 0 | | | |
| Unsupported commercial facts | 0 | | | |
| Unsupported health/medical/cosmetic claims | 0 | | | |
| Commercial handoff | 100% | | | |
| P0 product switching | 100% | | | |
| Visitor-reset isolation | 100% | | | |
| Supported-language routing | 100% | | | |
| Ambiguous aliases mapped incorrectly | 0 | | | |
| FINAL-KB answers invented without approved evidence | 0 | | | |
| P1 pass rate | >=98% | | | |
| P2 pass rate | >=90% | | | |

## Final decision

- Total cases run: / 150
- READY-NOW: pass / fail / blocked
- FINAL-KB: pass / fail / blocked
- BOUNDARY: pass / fail / blocked
- P0: pass / fail
- P1 pass rate:
- P2 pass rate:
- Recommendation: **ACCEPT FOR EXHIBITION / FIX AND RETEST / BLOCKED BY UNAPPROVED KNOWLEDGE**
- Sign-off:

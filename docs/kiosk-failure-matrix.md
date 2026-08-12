# Exhibition kiosk failure matrix

This matrix documents visitor-visible recovery behavior. It contains no provider credentials and does not authorize paid avatar tests.

| Failure | Expected visitor behavior | Recovery | Regression coverage |
| --- | --- | --- | --- |
| Microphone denied | Localized message; text remains available | Talk may be retried after permission changes | Voice and frontend tests |
| Recognition unsupported | Localized unsupported message; composer remains enabled | Continue by text | Voice and frontend tests |
| Conversation API failure | Localized short error answer; controls unlock | Submit another question or end conversation | Conversation tests |
| TTS failure | Text answer remains visible; speaking state returns to ready | Next question remains available | Voice tests |
| Avatar unavailable | Calm visual fallback; text and supported voice remain usable | Voice-only fallback | LiveAvatar tests |
| Avatar speech failure | No overlapping playback | Current-answer fallback where safe | LiveAvatar speech tests |
| Connection loss | No raw provider error; controls and End Conversation remain usable | Retry normal interaction after reconnection | Conversation and LiveAvatar tests |
| Reset during generation | Old request is aborted and its result is ignored | Clean language-selection screen | Visitor lifecycle tests |
| Reset during speech | Recognition, TTS and avatar speech stop | Clean language-selection screen | Voice and LiveAvatar tests |
| Inactivity timeout | Localized warning, then full reset | Continue button postpones reset | Idle-timeout tests |
| Rapid duplicate tap | Only one question/request is accepted while busy | Controls unlock after completion/failure | Conversation and lifecycle tests |
| Browser reload | React state is reconstructed without visitor content | Language-selection screen | Frontend journey test |

## Manual device checks

- Safari and Chrome microphone permission prompts.
- On-screen keyboard resize in portrait and landscape.
- Full-screen kiosk browser recovery after a real network transition.
- Long-answer scrolling and timeout behavior on the target exhibition tablet.

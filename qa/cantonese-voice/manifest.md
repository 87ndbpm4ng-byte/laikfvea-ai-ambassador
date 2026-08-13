# Daniel Cantonese voice QA samples

Provider: OpenAI

Model: `gpt-4o-mini-tts`

Voice: `cedar`

Language: Hong Kong Cantonese (`zh-HK`)

Output: voice-only MP3

Quality status: Approved for exhibition QA by a native Hong Kong Cantonese speaker.

Approval scope: pronunciation and natural Cantonese delivery across these five controlled samples.

## Completed QA

- Automated provider, PCM, fallback, interruption, and reset coverage: passed
- Controlled MP3 playback review: passed
- Native Hong Kong Cantonese speaker pronunciation review: passed
- Controlled real Daniel LiveAvatar test: passed
  - Cantonese audio was audible and remained Cantonese rather than Mandarin
  - Buffered avatar playback and mouth movement worked
  - Follow-up speech and interruption worked without duplicate or lingering audio
  - End Conversation released the active audio/session state

## 1. 01-introduction.mp3

- Cantonese text: 你好，我係 Daniel，科技專家。我可以同你簡單講解氫水技術、產品操作同充電方法。你想由邊一方面開始？
- English meaning: Hello, I’m Daniel, the technology specialist. I can briefly explain hydrogen-water technology, product operation, and charging. Where would you like to start?
- Provider: OpenAI
- Model: `gpt-4o-mini-tts`
- Voice: `cedar`

## 2. 02-hydrogen-water.mp3

- Cantonese text: 裝置會用電解過程喺飲用水入面產生氫氣。你可以揀三分鐘或者十八分鐘模式；運作期間，顯示屏會顯示計時、氫氣濃度同 ORP 數值。
- English meaning: The device uses electrolysis to generate hydrogen in drinking water. You can choose a three-minute or eighteen-minute mode; during operation, the display shows the timer, hydrogen concentration, and ORP value.
- Provider: OpenAI
- Model: `gpt-4o-mini-tts`
- Voice: `cedar`

## 3. 03-charging.mp3

- Cantonese text: 打開後蓋，就可以用隨附嘅充電線同火牛連接 Type-C 充電口。裝置亦支援最高五 W 嘅兼容無線充電。唔好用快速充電器，充電期間亦唔好啟動製氫功能。
- English meaning: Open the rear cover and connect the supplied cable and adapter to the Type-C charging port. The device also supports compatible wireless charging up to 5 W. Do not use a fast charger or run hydrogen generation while charging.
- Provider: OpenAI
- Model: `gpt-4o-mini-tts`
- Voice: `cedar`

## 4. 04-technical-terms.mp3

- Cantonese text: 技術資料會見到 USB-C、PEM/SPE、H₂、ppb 同 ORP 呢幾個標示。顯示屏會顯示氫氣濃度嘅 ppb 數值，同埋 ORP 數值。
- English meaning: The technical information includes the labels USB-C, PEM/SPE, H₂, ppb, and ORP. The display shows the hydrogen concentration in ppb and the ORP value.
- Provider: OpenAI
- Model: `gpt-4o-mini-tts`
- Voice: `cedar`

## 5. 05-follow-up.mp3

- Cantonese text: 可以，我再講詳細少少。你想了解實際操作步驟，定係想由技術角度睇吓個製備過程？
- English meaning: Certainly, I can explain a little more. Would you like the practical operating steps, or would you prefer to look at the preparation process from a technical perspective?
- Provider: OpenAI
- Model: `gpt-4o-mini-tts`
- Voice: `cedar`

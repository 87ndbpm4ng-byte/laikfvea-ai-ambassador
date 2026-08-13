import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generateGuideSpeech } from "@/lib/voice/guide-speech-service";

const outputDirectory = resolve("qa/cantonese-voice");

const samples = [
  {
    filename: "01-introduction.mp3",
    text: "你好，我係 Daniel，科技專家。我可以同你簡單講解氫水技術、產品操作同充電方法。你想由邊一方面開始？",
    english:
      "Hello, I’m Daniel, the technology specialist. I can briefly explain hydrogen-water technology, product operation, and charging. Where would you like to start?",
  },
  {
    filename: "02-hydrogen-water.mp3",
    text: "裝置會用電解過程喺飲用水入面產生氫氣。你可以揀三分鐘或者十八分鐘模式；運作期間，顯示屏會顯示計時、氫氣濃度同 ORP 數值。",
    english:
      "The device uses electrolysis to generate hydrogen in drinking water. You can choose a three-minute or eighteen-minute mode; during operation, the display shows the timer, hydrogen concentration, and ORP value.",
  },
  {
    filename: "03-charging.mp3",
    text: "打開後蓋，就可以用隨附嘅充電線同火牛連接 Type-C 充電口。裝置亦支援最高五 W 嘅兼容無線充電。唔好用快速充電器，充電期間亦唔好啟動製氫功能。",
    english:
      "Open the rear cover and connect the supplied cable and adapter to the Type-C charging port. The device also supports compatible wireless charging up to 5 W. Do not use a fast charger or run hydrogen generation while charging.",
  },
  {
    filename: "04-technical-terms.mp3",
    text: "技術資料會見到 USB-C、PEM/SPE、H₂、ppb 同 ORP 呢幾個標示。顯示屏會顯示氫氣濃度嘅 ppb 數值，同埋 ORP 數值。",
    english:
      "The technical information includes the labels USB-C, PEM/SPE, H₂, ppb, and ORP. The display shows the hydrogen concentration in ppb and the ORP value.",
  },
  {
    filename: "05-follow-up.mp3",
    text: "可以，我再講詳細少少。你想了解實際操作步驟，定係想由技術角度睇吓個製備過程？",
    english:
      "Certainly, I can explain a little more. Would you like the practical operating steps, or would you prefer to look at the preparation process from a technical perspective?",
  },
] as const;

function loadEnvironmentFile(contents: string) {
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  loadEnvironmentFile(await readFile(resolve(".env.local"), "utf8"));

  const previousFlag = process.env.DANIEL_CANTONESE_SPEECH;
  process.env.DANIEL_CANTONESE_SPEECH = "true";

  try {
  for (const sample of samples) {
    const result = await generateGuideSpeech({
      text: sample.text,
      guideId: "daniel",
      language: "zh-HK",
    });
    if (result.provider !== "openai" || result.audio.byteLength === 0) {
      throw new Error(`Unexpected speech result for ${sample.filename}.`);
    }
    await writeFile(resolve(outputDirectory, sample.filename), Buffer.from(result.audio));
  }
  } finally {
    if (previousFlag === undefined) delete process.env.DANIEL_CANTONESE_SPEECH;
    else process.env.DANIEL_CANTONESE_SPEECH = previousFlag;
  }

const manifest = [
  "# Daniel Cantonese voice QA samples",
  "",
  "Provider: OpenAI  ",
  "Model: `gpt-4o-mini-tts`  ",
  "Voice: `cedar`  ",
  "Language: Hong Kong Cantonese (`zh-HK`)  ",
  "Output: voice-only MP3",
  "",
  ...samples.flatMap((sample, index) => [
    `## ${index + 1}. ${sample.filename}`,
    "",
    `- Cantonese text: ${sample.text}`,
    `- English meaning: ${sample.english}`,
    "- Provider: OpenAI",
    "- Model: `gpt-4o-mini-tts`",
    "- Voice: `cedar`",
    "",
  ]),
].join("\n");

  await writeFile(resolve(outputDirectory, "manifest.md"), manifest, "utf8");
}

void main();

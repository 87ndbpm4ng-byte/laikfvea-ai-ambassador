import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSpeechText } from "@/lib/voice/speech-text-normalizer";

test("speech normalization removes presentation-only Markdown", () => {
  assert.equal(
    normalizeSpeechText(
      "### Charging\n\n**Important:**\n- Use the supplied cable\n- Do not generate hydrogen while charging",
    ),
    "Charging Important: Use the supplied cable. Do not generate hydrogen while charging.",
  );
});

test("speech normalization preserves wording, units and warnings", () => {
  const text = "Maximum wireless charging power is 5 W.\n\nImportant: do not run hydrogen generation while charging.";
  assert.equal(
    normalizeSpeechText(text),
    "Maximum wireless charging power is 5 W. Important: do not run hydrogen generation while charging.",
  );
});

test("speech normalization preserves Russian Cyrillic and units", () => {
  assert.equal(
    normalizeSpeechText(
      "### Важно\n- Не используйте устройство при зарядке USB-C\n- Объём 500 mL",
    ),
    "Важно Не используйте устройство при зарядке USB-C. Объём 500 mL.",
  );
});

test("speech normalization preserves Chinese characters, product names and units", () => {
  assert.equal(
    normalizeSpeechText("### 充电说明\n- 使用 USB-C 充电\n- 容量为 500 mL\n- 功率为 5 W"),
    "充电说明 使用 USB-C 充电. 容量为 500 mL. 功率为 5 W.",
  );
});

test("speech normalization preserves Traditional Chinese Cantonese wording", () => {
  const source = "呢款水樽用 **USB-C** 充電，容量係 350 mL。";
  const normalized = normalizeSpeechText(source);
  assert.equal(normalized, "呢款水樽用 USB-C 充電，容量係 350 mL。");
});

test("speech normalization preserves French diacritics and technical notation", () => {
  const source = "L’eau **hydrogénée** utilise un port USB-C à 5 W, sans altérer la sécurité.";
  const normalized = normalizeSpeechText(source);
  assert.equal(normalized, "L’eau hydrogénée utilise un port USB-C à 5 W, sans altérer la sécurité.");
});

test("Russian speech normalization expands technical units without changing display text", () => {
  assert.equal(
    normalizeSpeechText("pH 7.2, объём 1 L и 250 mL, UV-C 365 nm, 5 W, 12 V, 60 Hz, 20 m², 22 °C, 500 ppb, H₂.", "ru"),
    "пэ-аш 7.2, объём 1 литр и 250 миллилитров, ультрафиолет 365 нанометров, 5 ватт, 12 вольт, 60 герц, 20 квадратных метров, 22 градусов Цельсия, 500 частей на миллиард, водород.",
  );
});

test("Russian pronunciation normalization does not alter product names or non-Russian speech", () => {
  assert.equal(normalizeSpeechText("Capsula M Size, pH and 500 mL", "en"), "Capsula M Size, pH and 500 mL");
  assert.equal(normalizeSpeechText("Air Purifier", "ru"), "Air Purifier");
});

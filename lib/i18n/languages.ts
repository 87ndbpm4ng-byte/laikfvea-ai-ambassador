import type {
  LanguageConfiguration,
  SupportedLanguage,
} from "@/types/language";

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export const LANGUAGE_CONFIG: Record<
  SupportedLanguage,
  LanguageConfiguration
> = {
  en: {
    code: "en",
    displayName: "English",
    nativeName: "English",
    locale: "en-GB",
    speechRecognitionLocale: "en-GB",
    ttsLanguageCode: "en",
  },
  ru: {
    code: "ru",
    displayName: "Russian",
    nativeName: "Русский",
    locale: "ru-RU",
    speechRecognitionLocale: "ru-RU",
    ttsLanguageCode: "ru",
  },
  zh: {
    code: "zh",
    displayName: "Simplified Chinese",
    nativeName: "中文（简体）",
    locale: "zh-CN",
    speechRecognitionLocale: "zh-CN",
    ttsLanguageCode: "zh",
  },
  yue: {
    code: "yue",
    displayName: "Cantonese",
    nativeName: "廣東話",
    locale: "zh-HK",
    speechRecognitionLocale: "zh-HK",
    // ElevenLabs Multilingual v2 documents Chinese (`zh`), not Cantonese
    // (`yue`). Keep this null rather than silently producing Mandarin.
    ttsLanguageCode: null,
  },
};

export const SUPPORTED_LANGUAGES = Object.values(LANGUAGE_CONFIG);

export function isSupportedLanguage(
  value: unknown,
): value is SupportedLanguage {
  return value === "en" || value === "ru" || value === "zh" || value === "yue";
}

export function getLanguageConfiguration(
  language: SupportedLanguage = DEFAULT_LANGUAGE,
) {
  return LANGUAGE_CONFIG[language];
}

export function resolveSupportedLanguage(
  value: string | null | undefined,
): SupportedLanguage {
  if (isSupportedLanguage(value)) return value;
  const normalized = value?.toLocaleLowerCase();
  if (normalized?.startsWith("ru")) return "ru";
  if (normalized === "yue" || normalized?.startsWith("zh-hk")) return "yue";
  if (normalized?.startsWith("zh")) return "zh";
  return DEFAULT_LANGUAGE;
}

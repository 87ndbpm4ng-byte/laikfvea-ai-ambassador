export type SupportedLanguage = "en" | "ru" | "zh" | "yue";

export type LanguageConfiguration = {
  code: SupportedLanguage;
  displayName: string;
  nativeName: string;
  locale: "en-GB" | "ru-RU" | "zh-CN" | "zh-HK";
  speechRecognitionLocale: "en-GB" | "ru-RU" | "zh-CN" | "zh-HK";
  ttsLanguageCode: "en" | "ru" | "zh" | null;
};

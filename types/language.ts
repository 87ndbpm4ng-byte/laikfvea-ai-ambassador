export type SupportedLanguage = "en" | "ru" | "zh" | "yue" | "fr";

export type LanguageConfiguration = {
  code: SupportedLanguage;
  displayName: string;
  nativeName: string;
  locale: "en-GB" | "ru-RU" | "zh-CN" | "zh-HK" | "fr-FR";
  speechRecognitionLocale: "en-GB" | "ru-RU" | "zh-CN" | "zh-HK" | "fr-FR";
  ttsLanguageCode: "en" | "ru" | "zh" | "fr" | null;
};

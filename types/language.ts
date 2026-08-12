export type SupportedLanguage = "en" | "ru" | "zh";

export type LanguageConfiguration = {
  code: SupportedLanguage;
  displayName: string;
  nativeName: string;
  locale: "en-GB" | "ru-RU" | "zh-CN";
  speechRecognitionLocale: "en-GB" | "ru-RU" | "zh-CN";
  ttsLanguageCode: "en" | "ru" | "zh";
};

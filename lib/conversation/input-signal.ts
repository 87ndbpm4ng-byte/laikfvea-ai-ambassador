import { resolveSupportedLanguage } from "@/lib/i18n/languages";
import type { SupportedLanguage } from "@/types/language";

export type InputSignalKind = "valid" | "empty" | "non-linguistic" | "uninterpretable";

const ASK_A_QUESTION: Record<SupportedLanguage, string> = {
  en: "Please ask a product question, or choose a Quick Question.",
  ru: "Задайте вопрос о продукте или выберите быстрый вопрос.",
  zh: "请输入产品问题，或选择一个快捷问题。",
  yue: "請問一個產品問題，或者揀一條快速問題。",
  fr: "Posez une question sur un produit ou choisissez une question rapide.",
};

const CLARIFY_QUESTION: Record<SupportedLanguage, string> = {
  en: "I didn’t understand that. Please rephrase your product question.",
  ru: "Я не понял вопрос. Пожалуйста, сформулируйте вопрос о продукте иначе.",
  zh: "我没有理解您的问题。请换一种方式提问产品问题。",
  yue: "我未明白你嘅問題，請換個方式再問產品問題。",
  fr: "Je n’ai pas compris. Veuillez reformuler votre question sur le produit.",
};

const CONTEXTUAL_SHORT_INPUTS = new Set([
  "it", "this", "that", "why", "why?",
  "это", "этот", "эта", "почему", "почему?",
  "这个", "這個", "为什么", "為什麼", "點解", "佢",
  "ceci", "cela", "ça", "pourquoi", "pourquoi?",
]);

export function classifyInputSignal(input: string, hasContext: boolean): InputSignalKind {
  const value = input.trim();
  if (!value) return "empty";
  if (!/[\p{L}\p{N}]/u.test(value)) return "non-linguistic";

  const normalized = value.toLocaleLowerCase();
  if (CONTEXTUAL_SHORT_INPUTS.has(normalized)) {
    return hasContext ? "valid" : "uninterpretable";
  }

  if (
    /^\d+$/.test(normalized) ||
    /^(?:asdfgh|asdf|qwerty|zxcvbn|zxcv|hjkl|[a-z])$/iu.test(normalized) ||
    /^(.)\1{3,}$/u.test(normalized)
  ) {
    return "uninterpretable";
  }

  return "valid";
}

export function getInputSignalMessage(kind: Exclude<InputSignalKind, "valid">, language?: string | null) {
  const locale = resolveSupportedLanguage(language);
  return kind === "uninterpretable" ? CLARIFY_QUESTION[locale] : ASK_A_QUESTION[locale];
}

export type RecentSubmission = { key: string; at: number } | null;

export function isAccidentalDuplicateSubmission(
  previous: RecentSubmission,
  key: string,
  now: number,
  windowMs = 750,
) {
  return Boolean(previous?.key === key && now - previous.at < windowMs);
}

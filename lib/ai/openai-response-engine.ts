import "server-only";

import OpenAI from "openai";
import {
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_MODEL,
} from "@/lib/ai/model-config";
import { createSystemPrompt } from "@/lib/ai/system-prompt";
import type { ConversationHistoryItem } from "@/types/conversation";
import type { Guide } from "@/types/guide";

export const MAX_OPENAI_HISTORY_MESSAGES = 10;

export class MissingOpenAIKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured.");
    this.name = "MissingOpenAIKeyError";
  }
}

export class EmptyOpenAIResponseError extends Error {
  constructor() {
    super("OpenAI returned an empty response.");
    this.name = "EmptyOpenAIResponseError";
  }
}

type OpenAIResponseRequest = {
  message: string;
  guide: Guide;
  history: ConversationHistoryItem[];
};

export async function generateOpenAIResponse({
  message,
  guide,
  history,
}: OpenAIResponseRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new MissingOpenAIKeyError();
  }

  const client = new OpenAI({ apiKey });
  const recentHistory = history.slice(-MAX_OPENAI_HISTORY_MESSAGES);
  const input = [
    ...recentHistory.map((item) => ({
      role: item.role === "guide" ? ("assistant" as const) : ("user" as const),
      content: item.content,
    })),
    { role: "user" as const, content: message },
  ];

  const response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions: createSystemPrompt(guide),
    input,
    max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
  });
  const responseText = response.output_text.trim();

  if (!responseText) {
    throw new EmptyOpenAIResponseError();
  }

  return responseText;
}

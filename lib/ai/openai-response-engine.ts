import "server-only";

import OpenAI from "openai";
import {
  OPENAI_MAX_OUTPUT_TOKENS,
  OPENAI_MODEL,
  OPENAI_REQUEST_TIMEOUT_MS,
} from "@/lib/ai/model-config";
import { createSystemPrompt } from "@/lib/ai/system-prompt";
import type { ConversationHistoryItem } from "@/types/conversation";
import type { Guide } from "@/types/guide";
import type { SupportedLanguage } from "@/types/language";
import {
  latencyDuration,
  latencyNow,
  logTurnLatency,
} from "@/lib/observability/turn-latency";

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
  language?: SupportedLanguage;
  turnId?: string;
  attempt?: number;
};

export async function generateOpenAIResponse({
  message,
  guide,
  history,
  language = "en",
  turnId,
  attempt = 1,
}: OpenAIResponseRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new MissingOpenAIKeyError();
  }

  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: OPENAI_REQUEST_TIMEOUT_MS,
  });
  const recentHistory = history.slice(-MAX_OPENAI_HISTORY_MESSAGES);
  const systemPrompt = createSystemPrompt(guide, language);
  const input = [
    {
      role: "developer" as const,
      content: [
        {
          type: "input_text" as const,
          text: systemPrompt,
          prompt_cache_breakpoint: { mode: "explicit" as const },
        },
      ],
    },
    ...recentHistory.map((item) => ({
      role: item.role === "guide" ? ("assistant" as const) : ("user" as const),
      content: item.content,
    })),
    { role: "user" as const, content: message },
  ];

  const startedAt = latencyNow();
  logTurnLatency(turnId, "openai.start", { attempt });
  let response;
  try {
    response = await client.responses.create({
      model: OPENAI_MODEL,
      input,
      prompt_cache_options: { mode: "explicit" },
      max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
    });
  } catch (error) {
    logTurnLatency(turnId, "openai.end", {
      attempt,
      durationMs: latencyDuration(startedAt),
      outcome: "error",
    });
    throw error;
  }
  logTurnLatency(turnId, "openai.end", {
    attempt,
    durationMs: latencyDuration(startedAt),
    outcome: "success",
  });
  // Temporary diagnostic: log OpenAI usage object
  console.info("[openai-usage]", JSON.stringify(response.usage, null, 2));
  const responseText = response.output_text.trim();

  if (!responseText) {
    throw new EmptyOpenAIResponseError();
  }

  return responseText;
}

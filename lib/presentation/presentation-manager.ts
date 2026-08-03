import { presentationRules } from "@/lib/presentation/presentation-rules";
import type {
  Presentation,
  PresentationConversationState,
} from "@/lib/presentation/presentation-types";

function latestConversationTurn(
  state: PresentationConversationState,
): PresentationConversationState["messages"] {
  const latestVisitorIndex = state.messages.findLastIndex(
    (message) => message.role === "visitor",
  );

  if (latestVisitorIndex < 0) {
    return [];
  }

  return state.messages.slice(latestVisitorIndex).filter(
    (message) => message.role === "visitor" || message.role === "guide",
  );
}

/**
 * Converts current conversation state into one optional visual presentation.
 * It does not generate content and has no dependency on an AI provider.
 */
export class PresentationManager {
  resolve(state: PresentationConversationState): Presentation | null {
    const currentTurn = latestConversationTurn(state);

    if (currentTurn.length === 0) {
      return null;
    }

    const content = currentTurn.map((message) => message.content).join("\n");
    const matchedRule = presentationRules.find((candidate) =>
      candidate.matches.some((pattern) => pattern.test(content)),
    );

    if (matchedRule) {
      return { type: matchedRule.type, asset: matchedRule.asset };
    }

    const relatedProduct = currentTurn.findLast(
      (message) => message.relatedProduct,
    )?.relatedProduct;

    if (relatedProduct === "everyday") {
      return { type: "product", asset: "go-bottle" };
    }

    if (relatedProduct === "advanced") {
      return { type: "product", asset: "pro-bottle" };
    }

    return null;
  }
}

export const presentationManager = new PresentationManager();

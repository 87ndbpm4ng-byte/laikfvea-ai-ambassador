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

    // Presentation selection is driven by the visitor's current request and
    // its server-resolved product context. Guide answers are deliberately not
    // scanned for keywords: a Water Ionizer answer may mention hydrogen while
    // explaining several available modes, which must not silently select the
    // hydrogen-process visual for a general-use question.
    const visitorMessage = currentTurn.findLast((message) => message.role === "visitor");
    const content = visitorMessage?.content ?? "";
    const relatedProduct = currentTurn.findLast(
      (message) => message.relatedProduct,
    )?.relatedProduct;
    const matchedRule = presentationRules.find((candidate) =>
      (!candidate.products || !relatedProduct || candidate.products.includes(relatedProduct)) &&
      candidate.matches.some((pattern) => pattern.test(content)),
    );

    if (matchedRule) {
      return {
        type: matchedRule.type,
        asset: matchedRule.asset,
        placement: matchedRule.placement,
        duration: matchedRule.duration,
      };
    }

    if (relatedProduct === "everyday") {
      return {
        type: "product",
        asset: "go-bottle",
        placement: "conversation-support",
        duration: "until-topic-change",
      };
    }

    if (relatedProduct === "advanced") {
      return {
        type: "product",
        asset: "pro-bottle",
        placement: "conversation-support",
        duration: "until-topic-change",
      };
    }

    return null;
  }
}

export const presentationManager = new PresentationManager();

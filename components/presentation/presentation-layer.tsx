import { PresentationPanel } from "@/components/presentation/presentation-panel";
import { presentationManager } from "@/lib/presentation/presentation-manager";
import type { PresentationConversationState } from "@/lib/presentation/presentation-types";

type PresentationLayerProps = {
  conversationState: PresentationConversationState;
};

/** The single presentation boundary consumed by the conversation interface. */
export function PresentationLayer({
  conversationState,
}: PresentationLayerProps) {
  const presentation = presentationManager.resolve(conversationState);

  return <PresentationPanel presentation={presentation} />;
}

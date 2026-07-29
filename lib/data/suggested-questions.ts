import type { SuggestedQuestion } from "@/types/conversation";

export const suggestedQuestions: readonly SuggestedQuestion[] = [
  {
    id: "hydrogen-water-overview",
    label: "How does hydrogen water work?",
    category: "technology",
    responseKey: "hydrogen-water-overview",
  },
  {
    id: "product-comparison",
    label: "Compare the available products",
    category: "products",
    responseKey: "product-comparison",
  },
  {
    id: "product-guidance",
    label: "Which product is right for me?",
    category: "guidance",
    responseKey: "product-guidance",
  },
  {
    id: "hydrogen-inhalation",
    label: "Explain hydrogen inhalation",
    category: "technology",
    responseKey: "hydrogen-inhalation",
    relatedProduct: "advanced",
  },
];

export function getSuggestedQuestion(id: string) {
  return suggestedQuestions.find((question) => question.id === id);
}

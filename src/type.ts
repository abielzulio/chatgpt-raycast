export interface Answer {
  id: string;
  question: string;
  answer: string;
  conversationId: string;
  createdAt: string;
  savedAt?: string;
}

export interface ChatAnswer extends Answer {
  partialAnswer: string;
  done: boolean;
}

export type ConversationItem = {
  from: "human" | "gpt";
  value: string;
};

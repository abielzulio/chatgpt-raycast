export interface ChatAnswer {
  id: string;
  question: string;
  answer: string;
  partialAnswer: string;
  done: boolean;
  conversationId: string;
  createdAt: string;
}

export interface Answer {
  id: string;
  question: string;
  answer: string;
  conversationId: string;
  createdAt?: string;
  savedAt?: string;
}

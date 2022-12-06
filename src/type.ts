export interface ChatAnswer {
  id: string;
  question: string;
  answer: string;
  partialAnswer: string;
  done: boolean;
  conversationId: string;
}

export interface Answer {
  id: string;
  question: string;
  answer: string;
  conversationId: string;
  created_at?: string;
}

import type { ChatCompletionRequestMessage } from "openai";

export type Set<T> = React.Dispatch<React.SetStateAction<T>>;

export type Message = ChatCompletionRequestMessage;

export interface Question {
  id: string;
  question: string;
  created_at: string;
}

export interface Chat extends Question {
  answer: string;
}

export interface SavedChat extends Chat {
  saved_at: string;
}
type PromiseFunctionWithArg<T> = (arg: T) => Promise<void>;
type PromiseFunctionNoArg = () => Promise<void>;

interface BaseFunctionHook<T> {
  add: PromiseFunctionWithArg<T>;
  remove: PromiseFunctionWithArg<T>;
  clear: PromiseFunctionNoArg;
}

interface BaseHook<T> {
  data: T[];
  isLoading: boolean;
}

export type HistoryHook = BaseHook<Chat> & BaseFunctionHook<Chat>;

export type SavedChatHook = BaseHook<SavedChat> & BaseFunctionHook<Chat>;

export type RecentQuestionHook = BaseHook<Question> & {
  add: PromiseFunctionWithArg<Question>;
  clear: PromiseFunctionNoArg;
};
export interface ChatHook {
  data: Chat[];
  isLoading: boolean;
  setLoading: Set<boolean>;
  selectedChatId: string | null;
  setSelectedChatId: Set<string | null>;
  getAnswer: PromiseFunctionWithArg<string>;
  clear: PromiseFunctionNoArg;
}

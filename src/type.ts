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
  saved_at?: string;
}

export interface Conversation {
  id: string;
  chats: Chat[];
  updated_at: string;
  created_at: string;
  pinned: boolean;
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

type Hook<T> = BaseHook<T> & BaseFunctionHook<T>;

export type HistoryHook = Hook<Chat>;

export type SavedChatHook = Hook<SavedChat>;

export type ConversationsHook = Hook<Conversation> & { setData: Set<Conversation[]> };

export interface ChatHook {
  data: Chat[];
  setData: Set<Chat[]>;
  isLoading: boolean;
  setLoading: Set<boolean>;
  selectedChatId: string | null;
  setSelectedChatId: Set<string | null>;
  getAnswer: PromiseFunctionWithArg<string>;
  clear: PromiseFunctionNoArg;
}

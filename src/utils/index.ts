import { Chat, Message } from "../type";

export function chatTransfomer(chat: Chat[]): Message[] {
  const messages: Message[] = [{ role: "system", content: "You are a helpful assistant." }];
  chat.forEach(({ question, answer }) => {
    messages.push({ role: "user", content: question });
    messages.push({
      role: "assistant",
      content: answer,
    });
  });
  return messages;
}

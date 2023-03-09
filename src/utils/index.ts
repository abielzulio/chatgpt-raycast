import { AxiosProxyConfig } from "axios";
import { OpenAIApi } from "openai";
import { Stream } from "stream";
import { Chat, Message, Model } from "../type";

export function chatsTransfomer(chat: Chat[], prompt: string): Message[] {
  const messages: Message[] = [{ role: "system", content: prompt }];
  chat.forEach(({ question, answer }) => {
    messages.push({ role: "user", content: question });
    messages.push({
      role: "assistant",
      content: answer,
    });
  });
  return messages;
}

export async function getAnswer(
  api: OpenAIApi,
  model: Model,
  question: string,
  chats: Chat[],
  proxy: false | AxiosProxyConfig | undefined
): Promise<any> {
  const res = await api.createChatCompletion(
    {
      model: model.option,
      temperature: model.temperature,
      stream: true,
      messages: [...chatsTransfomer(chats, model.prompt), { role: "user", content: question }],
    },
    {
      responseType: "stream",
      proxy,
    }
  );

  const chat = { role: "assistant", content: "" };

  return new Promise<Message>((res) => {
    (res.data as unknown as Stream).on("data", (data) => {
      const lines = data
        .toString()
        .split("\n")
        .filter((line: string) => line.trim() !== "");
      for (const line of lines) {
        const message = line.replace(/^data: /, "");
        if (message === "[DONE]") {
          return; // Stream finished
        }

        const parsed = JSON.parse(message);
        const delta = parsed.choices[0].delta.content;
        if (delta) {
          message.content += delta;
        }
      }
    });
  });
}

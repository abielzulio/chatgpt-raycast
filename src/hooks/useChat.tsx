import { clearSearchBar, getPreferenceValues, showToast, Toast } from "@raycast/api";
import { Configuration, OpenAIApi } from "openai";
import { useCallback, useState } from "react";
import say from "say";
import { v4 as uuidv4 } from "uuid";
import { Chat, ChatHook, Question } from "../type";
import { chatTransfomer } from "../utils";
import { useAutoTTS } from "./useAutoTTS";
import { useHistory } from "./useHistory";

export function useChat<T extends Chat>(props: T[]): ChatHook {
  const [data, setData] = useState<Chat[]>(props);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);

  const history = useHistory();
  const isAutoTTS = useAutoTTS();

  const [chatGPT] = useState(() => {
    const apiKey = getPreferenceValues<{
      api: string;
    }>().api;

    const config = new Configuration({ apiKey });

    return new OpenAIApi(config);
  });

  async function getAnswer(question: string) {
    setLoading(true);
    const toast = await showToast({
      title: "Getting your answer...",
      style: Toast.Style.Animated,
    });

    let chat: Chat = {
      id: uuidv4(),
      question,
      answer: "",
      created_at: new Date().toISOString(),
    };

    setData((prev) => {
      return [...prev, chat];
    });

    setTimeout(async () => {
      setSelectedChatId(chat.id);
    }, 30);

    await chatGPT
      .createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [...chatTransfomer(data), { role: "user", content: question }],
      })
      .then((res) => {
        chat = { ...chat, answer: res.data.choices.map((x) => x.message)[0]?.content ?? "" };
        if (typeof chat.answer === "string") {
          setLoading(false);
          clearSearchBar();

          toast.title = "Got your answer!";
          toast.style = Toast.Style.Success;

          if (isAutoTTS) {
            say.stop();
            say.speak(chat.answer);
          }

          setData((prev) => {
            return prev.map((a) => {
              if (a.id === chat.id) {
                return chat;
              }
              return a;
            });
          });

          history.add(chat);
        }
      })
      .catch((err) => {
        toast.title = "Error";
        if (err instanceof Error) {
          console.log(err);
          toast.message = err?.message;
        }
        toast.style = Toast.Style.Failure;
      });
  }

  const clear = useCallback(async () => {
    setData([]);
  }, [setData]);

  return { data, setData, isLoading, setLoading, selectedChatId, setSelectedChatId, getAnswer, clear };
}

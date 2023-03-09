import { clearSearchBar, showToast, Toast } from "@raycast/api";
import { useCallback, useState } from "react";
import { Stream } from "stream";
import { v4 as uuidv4 } from "uuid";
import { Chat, ChatHook, Model } from "../type";
import { chatsTransfomer } from "../utils";
import { useAutoTTS } from "./useAutoTTS";
import { useChatGPT } from "./useChatGPT";
import { useHistory } from "./useHistory";
import { useProxy } from "./useProxy";

export function useChat<T extends Chat>(props: T[]): ChatHook {
  const [data, setData] = useState<Chat[]>(props);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);

  const api = useChatGPT();

  const history = useHistory();
  const isAutoTTS = useAutoTTS();
  const proxy = useProxy();

  async function getAnswer(question: string, model: Model) {
    setLoading(true);
    const toast = await showToast({
      title: "Getting your answer...",
      style: Toast.Style.Animated,
    });

    const chat: Chat = {
      id: uuidv4(),
      question,
      done: false,
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
      .createChatCompletion(
        {
          model: model.option,
          temperature: model.temperature,
          stream: true,
          messages: [...chatTransfomer(data, model.prompt), { role: "user", content: question }],
        },
        {
          responseType: "stream",
          proxy,
        }
      )
      .then((res) => {
        (res.data as unknown as Stream).on("data", (data) => {
          const lines = data
            .toString()
            .split("\n")
            .filter((line: string) => line.trim() !== "");

          setData((prev) => {
            return prev.map((a) => {
              if (a.id === chat.id) {
                return { ...chat, done: false };
              }
              return a;
            });
          });
          for (const line of lines) {
            const message = line.replace(/^data: /, "");
            if (message === "[DONE]") {
              setData((prev) => {
                return prev.map((a) => {
                  if (a.id === chat.id) {
                    return { ...chat, done: true };
                  }
                  return a;
                });
              });

              setLoading(false);
              clearSearchBar();

              toast.title = "Got your answer!";
              toast.style = Toast.Style.Success;

              history.add(chat);

              return; // Stream finished
            }
            try {
              const parsed = JSON.parse(message);
              const partialAnswer = parsed.choices[0].delta.content;
            } catch (error) {
              toast.title = "Error!";
              (toast.message = "Could not JSON parse stream message"), message, error;
              toast.style = Toast.Style.Failure;
            }
          }
        });
      })
      .catch((err) => {
        toast.title = "Error";
        if (err instanceof Error) {
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

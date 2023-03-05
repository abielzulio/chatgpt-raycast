import { LocalStorage, showToast, Toast } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { Chat } from "../type";

export function useHistory() {
  const [history, setHistory] = useState<Chat[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const storedHistory = await LocalStorage.getItem<string>("history");

      if (!storedHistory) {
        setHistory([]);
      } else {
        setHistory((previous) => [...previous, ...JSON.parse(storedHistory)]);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    LocalStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const addHistory = useCallback(
    async (chat: Chat) => {
      setHistory([...history, chat]);
    },
    [setHistory, history]
  );

  const deleteHistory = useCallback(
    async (answer: Chat) => {
      const toast = await showToast({
        title: "Removing answer...",
        style: Toast.Style.Animated,
      });
      const newHistory = history.filter((item) => item.id !== answer.id);
      setHistory(newHistory);
      toast.title = "Answer removed!";
      toast.style = Toast.Style.Success;
    },
    [setHistory, history]
  );

  const clearHistory = useCallback(async () => {
    const toast = await showToast({
      title: "Clearing history...",
      style: Toast.Style.Animated,
    });
    setHistory([]);
    toast.title = "History cleared!";
    toast.style = Toast.Style.Success;
  }, [setHistory]);

  return { history, isLoading, addHistory, deleteHistory, clearHistory } as const;
}

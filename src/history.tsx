import { ActionPanel, List, LocalStorage, Action, Icon, showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { Answer } from "./type";
import say from "say";
import { AnswerDetailView } from "./answer-detail";

export default function History() {
  const [history, setHistory] = useState<Answer[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const storedHistory = await LocalStorage.getItem<string>("history");

      if (!storedHistory) {
        setHistory([]);
      } else {
        const answers: Answer[] = JSON.parse(storedHistory);
        setHistory((previous) => [...previous, ...answers]);
      }
    })();
  }, []);

  useEffect(() => {
    LocalStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const handleRemoveAnswer = useCallback(
    async (answer: Answer) => {
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

  const handleClearHistory = useCallback(async () => {
    const toast = await showToast({
      title: "Clearing history...",
      style: Toast.Style.Animated,
    });
    setHistory([]);
    toast.title = "History cleared!";
    toast.style = Toast.Style.Success;
  }, [setHistory]);

  const getActionPanel = (answer: Answer) => (
    <ActionPanel>
      <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy Answer" content={answer.answer} />
      <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy Question" content={answer.question} />
      <Action.CreateSnippet
        icon={Icon.Snippets}
        title="Save as a Snippet"
        snippet={{ text: answer.answer, name: answer.question }}
        shortcut={{ modifiers: ["cmd"], key: "n" }}
      />
      <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy ID" content={answer.id} />
      <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy Conversation ID" content={answer.conversationId} />

      <Action
        icon={Icon.SpeechBubble}
        title="Speak"
        onAction={() => {
          say.stop();
          say.speak(answer.answer);
        }}
        shortcut={{ modifiers: ["cmd"], key: "p" }}
      />
      <Action
        style={Action.Style.Destructive}
        icon={Icon.Trash}
        title="Remove Answer"
        onAction={async () => {
          await confirmAlert({
            title: "Are you sure you want to remove this answer from your history?",
            message: "This action cannot be undone.",
            icon: Icon.Trash,
            primaryAction: {
              title: "Remove",
              style: Alert.ActionStyle.Destructive,
              onAction: () => {
                handleRemoveAnswer(answer);
              },
            },
          });
        }}
        shortcut={{ modifiers: ["cmd"], key: "s" }}
      />
      <Action
        style={Action.Style.Destructive}
        icon={Icon.Trash}
        title="Clear History"
        onAction={async () => {
          await confirmAlert({
            title: "Are you sure you want to clear your history?",
            message: "This action cannot be undone.",
            icon: Icon.Trash,
            primaryAction: {
              title: "Remove",
              style: Alert.ActionStyle.Destructive,
              onAction: () => {
                handleClearHistory();
              },
            },
          });
        }}
        shortcut={{ modifiers: ["cmd"], key: "s" }}
      />
    </ActionPanel>
  );

  const filteredHistory = history.filter((answer) => {
    if (searchText === "") {
      return true;
    }
    return (
      answer.question.toLowerCase().includes(searchText.toLowerCase()) ||
      answer.answer.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  return (
    <List
      isShowingDetail={filteredHistory.length === 0 ? false : true}
      filtering={false}
      throttle={false}
      navigationTitle={"Saved Answers"}
      selectedItemId={selectedAnswerId || undefined}
      onSelectionChange={(id) => {
        if (id !== selectedAnswerId) {
          setSelectedAnswerId(id);
        }
      }}
      searchBarPlaceholder="Search history..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
    >
      {history.length === 0 ? (
        <List.EmptyView title="No history" icon={Icon.Stars} />
      ) : (
        <List.Section title="Recent" subtitle={filteredHistory.length.toLocaleString()}>
          {filteredHistory
            .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
            .map((answer) => (
              <List.Item
                id={answer.id}
                key={answer.id}
                title={answer.question}
                accessories={[{ text: new Date(answer.createdAt ?? 0).toLocaleDateString() }]}
                detail={<AnswerDetailView answer={answer} />}
                actions={answer && selectedAnswerId === answer.id ? getActionPanel(answer) : undefined}
              />
            ))}
        </List.Section>
      )}
    </List>
  );
}

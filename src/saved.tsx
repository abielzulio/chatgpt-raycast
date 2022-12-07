import { ActionPanel, List, LocalStorage, Action, Icon, showToast, Toast } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { Answer } from "./type";

export default function SavedAnswer() {
  const [savedAnswers, setSavedAnswers] = useState<Answer[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const storedSavedAnswers = await LocalStorage.getItem<string>("savedAnswers");

      if (!storedSavedAnswers) {
        setSavedAnswers([]);
      } else {
        const answers: Answer[] = JSON.parse(storedSavedAnswers);
        setSavedAnswers((previous) => [...previous, ...answers]);
      }
    })();
  }, []);

  useEffect(() => {
    LocalStorage.setItem("savedAnswers", JSON.stringify(savedAnswers));
  }, [savedAnswers]);

  const handleUnsaveAnswer = useCallback(
    async (answer: Answer) => {
      const toast = await showToast({
        title: "Unsaving your answer...",
        style: Toast.Style.Animated,
      });
      const newSavedAnswer = savedAnswers.filter((savedAnswer) => savedAnswer.id !== answer.id);
      setSavedAnswers(newSavedAnswer);
      toast.title = "Answer unsaved!";
      toast.style = Toast.Style.Success;
    },
    [setSavedAnswers, savedAnswers]
  );

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
        style={Action.Style.Destructive}
        icon={Icon.Star}
        title="Unsave Answer"
        onAction={() => handleUnsaveAnswer(answer)}
        shortcut={{ modifiers: ["cmd"], key: "s" }}
      />
    </ActionPanel>
  );

  return (
    <List
      isShowingDetail={savedAnswers.length === 0 ? false : true}
      filtering={false}
      throttle={false}
      navigationTitle={"Saved Answers"}
      selectedItemId={selectedAnswerId || undefined}
      onSelectionChange={(id) => {
        if (id !== selectedAnswerId) {
          setSelectedAnswerId(id);
        }
      }}
      searchBarPlaceholder="Search saved answers/question..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
    >
      {savedAnswers.length === 0 ? (
        <List.EmptyView title="No saved answers" icon={Icon.Stars} />
      ) : (
        savedAnswers
          .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
          .filter((answer) => {
            if (searchText === "") {
              return true;
            }
            return (
              answer.question.toLowerCase().includes(searchText.toLowerCase()) ||
              answer.answer.toLowerCase().includes(searchText.toLowerCase())
            );
          })
          .map((answer) => (
            <List.Item
              id={answer.id}
              key={answer.id}
              title={answer.question}
              accessories={[{ text: new Date(answer.createdAt).toLocaleDateString() }]}
              detail={
                <List.Item.Detail
                  markdown={answer.answer}
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label title="Question" text={answer.question} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label
                        title="Date"
                        text={new Date(answer.createdAt).toLocaleString()}
                      />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label title="ID" text={answer.id} />
                      <List.Item.Detail.Metadata.Label title="Conversation ID" text={answer.conversationId} />
                    </List.Item.Detail.Metadata>
                  }
                />
              }
              actions={answer && selectedAnswerId === answer.id ? getActionPanel(answer) : undefined}
            />
          ))
      )}
    </List>
  );
}

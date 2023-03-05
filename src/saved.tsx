import { ActionPanel, Icon, List } from "@raycast/api";
import { useState } from "react";
import { DestructiveAction, SaveAsSnippetAction, TextToSpeechAction } from "./actions";
import { CopyActionSection } from "./actions/copy";
import { PreferencesActionSection } from "./actions/preferences";
import { useSavedChat } from "./hooks/useSavedChat";
import { Chat } from "./type";
import { AnswerDetailView } from "./views/answer-detail";

export default function SavedAnswer() {
  const { data: savedChats, isLoading, remove: unsaveChat, clear: clearSavedChat } = useSavedChat();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  const getActionPanel = (chat: Chat) => (
    <ActionPanel>
      <CopyActionSection answer={chat.answer} question={chat.question} />
      <SaveAsSnippetAction text={chat.answer} name={chat.question} />
      <ActionPanel.Section title="Output">
        <TextToSpeechAction content={chat.answer} />
      </ActionPanel.Section>
      <ActionPanel.Section title="Delete">
        <DestructiveAction
          title="Unsave"
          dialog={{
            title: "Are you sure you want to unsave this answer from your collection?",
          }}
          onAction={() => unsaveChat(chat)}
        />
        <DestructiveAction
          title="Clear All"
          dialog={{
            title: "Are you sure you want to clear all your saved answer from your collection?",
          }}
          onAction={() => clearSavedChat()}
          shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
        />
      </ActionPanel.Section>
      <PreferencesActionSection />
    </ActionPanel>
  );

  const sortedAnswers = savedChats.sort(
    (a, b) => new Date(b.saved_at ?? 0).getTime() - new Date(a.saved_at ?? 0).getTime()
  );

  const filteredAnswers = sortedAnswers
    .filter((value, index, self) => index === self.findIndex((answer) => answer.id === value.id))
    .filter((answer) => {
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
      isShowingDetail={filteredAnswers.length === 0 ? false : true}
      isLoading={isLoading}
      filtering={false}
      throttle={false}
      navigationTitle={"Saved Answers"}
      selectedItemId={selectedAnswerId || undefined}
      onSelectionChange={(id) => {
        if (id !== selectedAnswerId) {
          setSelectedAnswerId(id);
        }
      }}
      searchBarPlaceholder="Search saved answers/questions..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
    >
      {savedChats.length === 0 ? (
        <List.EmptyView
          title="No saved answers"
          description="Save generated question with ⌘ + S shortcut"
          icon={Icon.Stars}
        />
      ) : (
        <List.Section title="Saved" subtitle={filteredAnswers.length.toLocaleString()}>
          {filteredAnswers.map((answer) => (
            <List.Item
              id={answer.id}
              key={answer.id}
              title={answer.question}
              accessories={[{ text: new Date(answer.created_at ?? 0).toLocaleDateString() }]}
              detail={<AnswerDetailView chat={answer} />}
              actions={answer && selectedAnswerId === answer.id ? getActionPanel(answer) : undefined}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

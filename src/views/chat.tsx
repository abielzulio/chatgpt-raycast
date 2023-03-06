import { Action, ActionPanel, clearSearchBar, Icon, List, useNavigation } from "@raycast/api";
import { v4 as uuidv4 } from "uuid";
import { DestructiveAction, PrimaryAction, TextToSpeechAction } from "../actions";
import { CopyActionSection } from "../actions/copy";
import { PreferencesActionSection } from "../actions/preferences";
import { SaveActionSection } from "../actions/save";
import { FullTextInput } from "../components/FullTextInput";
import { useSavedChat } from "../hooks/useSavedChat";
import { Chat, ChatHook, Conversation, Set } from "../type";
import { AnswerDetailView } from "./answer-detail";
import { EmptyView } from "./empty";

export const ChatView = ({
  data,
  question,
  setConversation,
  use,
}: {
  data: Chat[];
  question: string;
  setConversation: Set<Conversation>;
  use: { chat: ChatHook };
}) => {
  const { pop, push } = useNavigation();

  const savedChat = useSavedChat();

  const sortedChats = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getActionPanel = (selectedChat: Chat) => (
    <ActionPanel>
      {question.length > 0 ? (
        <PrimaryAction title="Get Answer" onAction={() => use.chat.getAnswer(question)} />
      ) : selectedChat.answer && use.chat.selectedChatId === selectedChat.id ? (
        <>
          <CopyActionSection answer={selectedChat.answer} question={selectedChat.question} />
          <SaveActionSection
            onSaveAnswerAction={() => savedChat.add(selectedChat)}
            snippet={{ text: selectedChat.answer, name: selectedChat.question }}
          />
          <ActionPanel.Section title="Output">
            <TextToSpeechAction content={selectedChat.answer} />
          </ActionPanel.Section>
        </>
      ) : null}
      <ActionPanel.Section title="Input">
        <Action
          title="Full Text Input"
          shortcut={{ modifiers: ["cmd"], key: "t" }}
          icon={Icon.Text}
          onAction={() => {
            push(
              <FullTextInput
                onSubmit={(text) => {
                  use.chat.getAnswer(text);
                  pop();
                }}
              />
            );
          }}
        />
      </ActionPanel.Section>
      {use.chat.data.length > 0 && (
        <ActionPanel.Section title="Restart">
          <DestructiveAction
            title="Start New Conversation"
            icon={Icon.RotateAntiClockwise}
            dialog={{
              title: "Are you sure you want to start a new conversation?",
              primaryButton: "Start New",
            }}
            onAction={() => {
              setConversation({ id: uuidv4(), chats: [], pinned: false, created_at: new Date().toISOString() });
              use.chat.clear();
              clearSearchBar();
              use.chat.setLoading(false);
            }}
            shortcut={{ modifiers: ["cmd", "shift"], key: "n" }}
          />
        </ActionPanel.Section>
      )}
      <PreferencesActionSection />
    </ActionPanel>
  );

  return sortedChats.length === 0 ? (
    <EmptyView />
  ) : (
    <List.Section title="Results" subtitle={data.length.toLocaleString()}>
      {sortedChats.map((sortedChat, i) => {
        const markdown = `**${sortedChat.question}**\n\n${sortedChat.answer}`;
        return (
          <List.Item
            id={sortedChat.id}
            key={sortedChat.id}
            accessories={[{ text: `#${use.chat.data.length - i}` }]}
            title={sortedChat.question}
            detail={sortedChat.answer && <AnswerDetailView chat={sortedChat} markdown={markdown} />}
            actions={use.chat.isLoading ? undefined : getActionPanel(sortedChat)}
          />
        );
      })}
    </List.Section>
  );
};

import { ActionPanel, Icon, List, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { DestructiveAction, PrimaryAction } from "./actions";
import { PreferencesActionSection } from "./actions/preferences";
import Ask from "./ask";
import { useConversations } from "./hooks/useConversations";
import { Conversation } from "./type";

export default function Conversation() {
  const conversations = useConversations();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const { push } = useNavigation();

  const [conversation, setConversation] = useState<Conversation | null>();

  useEffect(() => {
    setConversation(conversations.data.find((x) => x.id === selectedConversationId));
  }, [selectedConversationId]);

  useEffect(() => {
    console.log(conversations.data);
  }, []);

  const getActionPanel = (conversation: Conversation) => (
    <ActionPanel>
      <PrimaryAction title="Continue Ask" onAction={() => push(<Ask conversation={conversation} />)} />
      <PrimaryAction title="Continue Ask" onAction={() => push(<Ask conversation={conversation} />)} />
      <ActionPanel.Section title="Delete">
        <DestructiveAction
          title="Remove"
          dialog={{
            title: "Are you sure you want to remove this conversation from your history?",
          }}
          onAction={() => conversations.remove(conversation)}
        />
        <DestructiveAction
          title="Clear History"
          dialog={{
            title: "Are you sure you want to clear your conversations?",
          }}
          onAction={() => conversations.clear()}
          shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
        />
      </ActionPanel.Section>
      <PreferencesActionSection />
    </ActionPanel>
  );

  const sortedConversations = conversations.data.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <List
      isShowingDetail={false}
      isLoading={conversations.isLoading}
      filtering={true}
      throttle={false}
      navigationTitle={"Conversations"}
      selectedItemId={selectedConversationId || undefined}
      onSelectionChange={(id) => {
        if (id !== selectedConversationId) {
          setSelectedConversationId(id);
        }
      }}
      searchBarPlaceholder="Search conversation..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
    >
      {sortedConversations.length === 0 ? (
        <List.EmptyView
          title="No Conversation"
          description="Your recent conversation will be showed up here"
          icon={Icon.Stars}
        />
      ) : (
        <List.Section title="Recent" subtitle={sortedConversations.length.toLocaleString()}>
          {sortedConversations.map((conversation) => (
            <List.Item
              id={conversation.id}
              key={conversation.id}
              title={conversation.chats[conversation.chats.length - 1].question}
              accessories={[{ text: new Date(conversation.created_at ?? 0).toLocaleDateString() }]}
              actions={
                conversation && selectedConversationId === conversation.id ? getActionPanel(conversation) : undefined
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

import { ActionPanel, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { PrimaryAction } from "./actions";
import { PreferencesActionSection } from "./actions/preferences";
import { useChat } from "./hooks/useChat";
import { useConversations } from "./hooks/useConversations";
import { Chat, Conversation } from "./type";
import { ChatView } from "./views/chat";

export default function Ask(props: { conversation?: Conversation }) {
  const conversations = useConversations();
  const chat = useChat<Chat>(props.conversation?.chats ?? []);

  const [conversation, setConversation] = useState<Conversation>(
    props.conversation ?? {
      id: uuidv4(),
      chats: [],
      pinned: false,
      updated_at: "",
      created_at: new Date().toISOString(),
    }
  );
  const [question, setQuestion] = useState<string>("");

  useEffect(() => {
    if (props.conversation) {
      setConversation(props.conversation);
    } else {
      conversations.add(conversation);
    }
  }, []);

  useEffect(() => {
    conversations.setData((prev) => {
      return prev.map((a) => {
        if (a.id === conversation.id) {
          return { ...conversation, updated_at: new Date().toISOString() };
        }
        return a;
      });
    });
  }, [conversation]);

  useEffect(() => {
    if (chat.data.length > 0) {
      setConversation({ ...conversation, chats: chat.data });
    }
  }, [chat.data]);

  const getActionPanel = (question: string) => (
    <ActionPanel>
      <PrimaryAction title="Get Answer" onAction={() => chat.getAnswer(question)} />
      <PreferencesActionSection />
    </ActionPanel>
  );

  return (
    <List
      isShowingDetail={chat.data.length > 0 ? true : false}
      filtering={false}
      isLoading={chat.isLoading}
      onSearchTextChange={setQuestion}
      throttle={false}
      navigationTitle={"Ask"}
      actions={question.length > 0 ? getActionPanel(question) : null}
      selectedItemId={chat.selectedChatId || undefined}
      onSelectionChange={(id) => {
        if (id !== chat.selectedChatId) {
          chat.setSelectedChatId(id);
        }
      }}
      searchBarPlaceholder={chat.data.length > 0 ? "Ask another question..." : "Ask a question..."}
    >
      <ChatView data={chat.data} question={question} setConversation={setConversation} use={{ chat }} />
    </List>
  );
}

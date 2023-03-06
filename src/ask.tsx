import { ActionPanel, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { PrimaryAction } from "./actions";
import { useChat } from "./hooks/useChat";
import { useConversations } from "./hooks/useConversations";
import { useRecentQuestion } from "./hooks/useRecentQuestion";
import { Conversation } from "./type";
import { ChatView } from "./views/chat";
import { RecentQuestionListView } from "./views/recent-question-list";

export default function ask() {
  const recentQuestion = useRecentQuestion();
  const conversations = useConversations();
  const chat = useChat();

  const [conversation, setConversation] = useState<Conversation>({
    id: uuidv4(),
    chats: [],
    pinned: false,
    created_at: new Date().toISOString(),
  });
  const [question, setQuestion] = useState<string>("");

  useEffect(() => {
    conversations.add(conversation);
  }, []);

  useEffect(() => {
    console.log(conversations.data);
    conversations.setData((prev) => {
      return prev.map((a) => {
        if (a.id === conversation.id) {
          return conversation;
        }
        return a;
      });
    });
  }, [conversation]);

  useEffect(() => {
    console.log(conversation);
    if (chat.data.length > 0) {
      setConversation({ ...conversation, chats: chat.data });
    }
  }, [chat.data]);

  const getActionPanel = (question: string) => (
    <ActionPanel>
      <PrimaryAction title="Get Answer" onAction={() => chat.getAnswer(question)} />;
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
      actions={chat.data.length > 0 ? (question.length > 0 ? getActionPanel(question) : null) : null}
      selectedItemId={chat.selectedChatId || undefined}
      onSelectionChange={(id) => {
        if (id !== chat.selectedChatId) {
          chat.setSelectedChatId(id);
        }
      }}
      searchBarPlaceholder={chat.data.length > 0 ? "Ask another question..." : "Ask a question..."}
    >
      {question.length === 0 && chat.data.length === 0 ? (
        <RecentQuestionListView data={recentQuestion.data} use={{ chat, recentQuestion }} />
      ) : (
        <ChatView data={chat.data} question={question} setConversation={setConversation} use={{ chat }} />
      )}
    </List>
  );
}

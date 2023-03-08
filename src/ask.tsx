import { ActionPanel, getSelectedText, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { PrimaryAction } from "./actions";
import { FormInputActionSection } from "./actions/form-input";
import { PreferencesActionSection } from "./actions/preferences";
import { useChat } from "./hooks/useChat";
import { useConversations } from "./hooks/useConversations";
import { DEFAULT_MODEL, useModel } from "./hooks/useModel";
import { useQuestion } from "./hooks/useQuestion";
import { Chat, Conversation, Model } from "./type";
import { ChatView } from "./views/chat";
import PromptListItem from "./views/prompt-item";

export default function Ask(props: { conversation?: Conversation }) {
  const conversations = useConversations();
  const models = useModel();

  const chats = useChat<Chat>(props.conversation ? props.conversation.chats : []);
  const question = useQuestion({
    initialQuestion: "",
    disableAutoLoad: props.conversation ? true : false,
  });

  const [conversation, setConversation] = useState<Conversation>(
    props.conversation ?? {
      id: uuidv4(),
      chats: [],
      model: DEFAULT_MODEL,
      pinned: false,
      updated_at: "",
      created_at: new Date().toISOString(),
    }
  );

  const [selectedText, setSelectedText] = useState("");

  const USER_MODELS = models.data;

  useEffect(() => {
    getSelectedText()
      .then((text) => {
        if (text) {
          setSelectedText(text);
        }
      })
      .catch(() => {
        setSelectedText("");
      });
  }, []);

  const filteredModels = USER_MODELS.filter((item) => {
    return item.name.toLowerCase().includes(question.data.toLowerCase());
  });

  useEffect(() => {
    if (props.conversation?.id !== conversation.id || conversations.data.length === 0) {
      conversations.add(conversation);
    }
  }, []);

  useEffect(() => {
    conversations.update(conversation);
  }, [conversation]);

  useEffect(() => {
    if (models.data && conversation.chats.length === 0) {
      const defaultUserModel = models.data.find((x) => x.id === DEFAULT_MODEL.id) ?? conversation.model;
      setConversation({ ...conversation, model: defaultUserModel, updated_at: new Date().toISOString() });
    }
  }, [models.data]);

  useEffect(() => {
    const updatedConversation = { ...conversation, chats: chats.data, updated_at: new Date().toISOString() };
    setConversation(updatedConversation);
  }, [chats.data]);

  const getActionPanel = (question: string, model: Model) => (
    <ActionPanel>
      <PrimaryAction title="Get Answer" onAction={() => chats.getAnswer(question, model)} />
      <FormInputActionSection initialQuestion={question} onSubmit={(question) => chats.getAnswer(question, model)} />
      <PreferencesActionSection />
    </ActionPanel>
  );

  return (
    <List
      searchText={question.data}
      isShowingDetail={true}
      filtering={false}
      isLoading={question.isLoading ? question.isLoading : chats.isLoading}
      onSearchTextChange={question.update}
      throttle={false}
      navigationTitle={"Ask"}
      actions={question.data.length > 0 ? getActionPanel(question.data, conversation.model) : null}
      selectedItemId={chats.selectedChatId || undefined}
      onSelectionChange={(id) => {
        if (id !== chats.selectedChatId) {
          chats.setSelectedChatId(id);
        }
      }}
      searchBarPlaceholder={chats.data.length > 0 ? "Ask another question..." : "Search prompt or directly ask..."}
    >
      {chats.data.length === 0 && filteredModels.length === 0 && (
        <>
          <PromptListItem
            title="Ask Question Directly"
            subtitle=""
            text={question.data}
            actions={getActionPanel(question.data, DEFAULT_MODEL)}
          />
          {USER_MODELS.map((model) => {
            return (
              <PromptListItem
                key={model.name}
                title={model.name}
                subtitle=""
                text={`${model.prompt} \n\n ${question.data}`}
                actions={getActionPanel(`${model.prompt} \n\n ${question.data}`, model)}
              />
            );
          })}
        </>
      )}
      {chats.data.length === 0 &&
        filteredModels.map((model) => {
          return (
            <PromptListItem
              key={model.name}
              title={model.name}
              subtitle={""}
              text={`${model.prompt} \n\n ${selectedText}`}
              actions={getActionPanel(`${model.prompt} \n\n ${selectedText}`, model)}
            />
          );
        })}
      <ChatView
        data={chats.data}
        question={question.data}
        setConversation={setConversation}
        use={{ chats }}
        model={conversation.model}
      />
    </List>
  );
}

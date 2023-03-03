import {
  Action,
  ActionPanel,
  clearSearchBar,
  Form,
  getPreferenceValues,
  Icon,
  List,
  LocalStorage,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import type { ChatCompletionRequestMessage } from "openai";
import { Configuration, OpenAIApi } from "openai";
import { useCallback, useEffect, useState } from "react";
import say from "say";
import { v4 as uuidv4 } from "uuid";
import { DestructiveAction, GetAnswerAction, TextToSpeechAction } from "./actions";
import { CopyActionSection } from "./actions/copy";
import { PreferencesActionSection } from "./actions/preferences";
import { SaveActionSection } from "./actions/save";
import { Chat, Question, SavedChat } from "./type";
import { FullTextInput } from "./components/FullTextInput";
import { AnswerDetailView } from "./views/answer-detail";
import { EmptyView } from "./views/empty";

export default function ChatGPT() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [initialQuestions, setInitialQuestions] = useState<Question[]>([]);
  const [history, setHistory] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const [chatGPT] = useState(() => {
    const apiKey = getPreferenceValues<{
      api: string;
    }>().api;

    const config = new Configuration({ apiKey });

    return new OpenAIApi(config);
  });

  const [isAutoTTS] = useState(() => {
    const autoTTS = getPreferenceValues<{
      isAutoTTS: boolean;
    }>().isAutoTTS;

    return autoTTS;
  });

  const { pop, push } = useNavigation();

  useEffect(() => {
    (async () => {
      const storedSavedChats = await LocalStorage.getItem<string>("savedChats");

      if (!storedSavedChats) {
        setSavedChats([]);
      } else {
        setSavedChats((previous) => [...previous, ...JSON.parse(storedSavedChats)]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const storedInitialQuestions = await LocalStorage.getItem<string>("initialQuestions");

      if (!storedInitialQuestions) {
        setInitialQuestions([]);
      } else {
        setInitialQuestions([...JSON.parse(storedInitialQuestions)]);
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const storedHistory = await LocalStorage.getItem<string>("history");

      if (!storedHistory) {
        setHistory([]);
      } else {
        setHistory((previous) => [...previous, ...JSON.parse(storedHistory)]);
      }
    })();
  }, []);

  useEffect(() => {
    LocalStorage.setItem("savedChats", JSON.stringify(savedChats));
  }, [savedChats]);

  useEffect(() => {
    LocalStorage.setItem("initialQuestions", JSON.stringify(initialQuestions));
  }, [initialQuestions]);

  useEffect(() => {
    LocalStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const handleSaveChat = useCallback(
    async (chat: Chat) => {
      const toast = await showToast({
        title: "Saving your answer...",
        style: Toast.Style.Animated,
      });
      const newSavedChat: SavedChat = { ...chat, saved_at: new Date().toISOString() };
      setSavedChats([...savedChats, newSavedChat]);
      toast.title = "Answer saved!";
      toast.style = Toast.Style.Success;
    },
    [setSavedChats, savedChats]
  );

  const handleUpdateHistory = useCallback(
    async (chat: Chat) => {
      setHistory([...history, chat]);
    },
    [setHistory, history]
  );

  const handleUpdateInitialQuestions = useCallback(
    async (question: Question) => {
      setInitialQuestions([...initialQuestions, question]);
    },
    [setInitialQuestions, initialQuestions]
  );

  async function getAnswer(question: string) {
    setIsLoading(true);

    const toast = await showToast({
      title: "Getting your answer...",
      style: Toast.Style.Animated,
    });

    let chat: Chat = {
      id: uuidv4(),
      question,
      answer: "",
      created_at: new Date().toISOString(),
    };

    if (chats.length === 0) {
      const initialQuestion: Question = {
        id: uuidv4(),
        question: chat.question,
        created_at: chat.created_at,
      };
      handleUpdateInitialQuestions(initialQuestion);
    }

    // Add new answer
    setChats((prev) => {
      return [...prev, chat];
    });

    // Weird selection glitch workaround
    setTimeout(async () => {
      setSelectedChatId(chat.id);
    }, 50);

    await chatGPT
      .createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [...messages, { role: "user", content: question }],
      })
      .then((res) => {
        chat = { ...chat, answer: res.data.choices.map((x) => x.message)[0]?.content ?? "" };
        if (typeof chat.answer === "string") {
          if (isAutoTTS) {
            say.stop();
            say.speak(chat.answer);
          }
          setMessages((prev) => {
            return [...prev, { role: "assistant", content: chat.answer }];
          });
          setChats((prev) => {
            return prev.map((a) => {
              if (a.id === chat.id) {
                return chat;
              }
              return a;
            });
          });
          handleUpdateHistory(chat);
        }
      })
      .then(() => {
        clearSearchBar();
        setIsLoading(false);
        toast.title = "Got your answer!";
        toast.style = Toast.Style.Success;
      })
      .catch((err) => {
        toast.title = "Error";
        if (err instanceof Error) {
          toast.message = err?.message;
        }
        toast.style = Toast.Style.Failure;
      });
  }

  const getActionPanel = (chat?: Chat) => (
    <ActionPanel>
      {searchText.length > 0 ? (
        <>
          <GetAnswerAction onAction={() => getAnswer(searchText)} />
        </>
      ) : chat?.answer && selectedChatId === chat.id ? (
        <>
          <CopyActionSection answer={chat.answer} question={chat.question} />
          <SaveActionSection
            onSaveAnswerAction={() => handleSaveChat(chat)}
            snippet={{ text: chat.answer, name: chat.question }}
          />
          <ActionPanel.Section title="Output">
            <TextToSpeechAction content={chat.answer} />
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
                  getAnswer(text);
                  pop();
                }}
              />
            );
          }}
        />
      </ActionPanel.Section>
      {chats.length > 0 && (
        <ActionPanel.Section title="Restart">
          <DestructiveAction
            title="Start New Conversation"
            icon={Icon.RotateAntiClockwise}
            dialog={{
              title: "Are you sure you want to start a new conversation?",
              primaryButton: "Start New",
            }}
            onAction={() => {
              setChats([]);
              clearSearchBar();
              setIsLoading(false);
            }}
            shortcut={{ modifiers: ["cmd", "shift"], key: "n" }}
          />
        </ActionPanel.Section>
      )}
      <PreferencesActionSection />
    </ActionPanel>
  );

  const sortedInitialQuestions = initialQuestions.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const unduplicatedInitialQuestions = sortedInitialQuestions.filter(
    (value, index, self) => index === self.findIndex((answer) => answer.question === value.question)
  );

  const sortedChats = chats.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <List
      isShowingDetail={chats.length > 0 ? true : false}
      filtering={false}
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      throttle={false}
      navigationTitle={"ChatGPT"}
      actions={getActionPanel()}
      selectedItemId={selectedChatId || undefined}
      onSelectionChange={(id) => {
        if (id !== selectedChatId) {
          setSelectedChatId(id);
        }
      }}
      searchBarPlaceholder={chats.length > 0 ? "Ask another question..." : "Ask a question..."}
    >
      {searchText.length === 0 && chats.length === 0 ? (
        initialQuestions.length > 0 ? (
          <List.Section title="Recent questions" subtitle={initialQuestions.length.toLocaleString()}>
            {unduplicatedInitialQuestions.map((question) => {
              return (
                <List.Item
                  id={question.id}
                  key={question.id}
                  accessories={[{ text: new Date(question.created_at ?? 0).toLocaleString() }]}
                  title={question.question}
                  actions={
                    <ActionPanel>
                      <ActionPanel.Section title="Ask">
                        <GetAnswerAction onAction={() => getAnswer(question.question)} />
                      </ActionPanel.Section>
                      <ActionPanel.Section title="Remove">
                        <DestructiveAction
                          title="Clear History"
                          dialog={{ title: "Are you sure you to clear your recent question?" }}
                          onAction={() => setInitialQuestions([])}
                        />
                      </ActionPanel.Section>
                      <PreferencesActionSection />
                    </ActionPanel>
                  }
                />
              );
            })}
          </List.Section>
        ) : (
          <EmptyView />
        )
      ) : chats.length === 0 ? (
        <EmptyView />
      ) : (
        <List.Section title="Results" subtitle={chats.length.toLocaleString()}>
          {sortedChats.map((answer, i) => {
            const markdown = `**${answer.question}**\n\n${answer.answer}`;
            return (
              <List.Item
                id={answer.id}
                key={answer.id}
                accessories={[{ text: `#${chats.length - i}` }]}
                title={answer.question}
                detail={answer.answer && <AnswerDetailView chat={answer} markdown={markdown} />}
                actions={isLoading ? undefined : getActionPanel(answer)}
              />
            );
          })}
        </List.Section>
      )}
    </List>
  );
}

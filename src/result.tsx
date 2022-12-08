import {
  Action,
  ActionPanel,
  Alert,
  clearSearchBar,
  Clipboard,
  confirmAlert,
  Form,
  getPreferenceValues,
  Icon,
  List,
  LocalStorage,
  openExtensionPreferences,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { ChatGPTAPI, ChatGPTConversation } from "chatgpt";
import { useEffect, useState } from "react";
import say from "say";
import { v4 as uuidv4 } from "uuid";
import { AnswerDetailView } from "./answer-detail";
import { defaultProfileImage } from "./profile-image";
import { shareConversation } from "./share-gpt";
import { Answer, ChatAnswer, ConversationItem } from "./type";

const FullTextInput = ({ onSubmit }: { onSubmit: (text: string) => void }) => {
  const [text, setText] = useState<string>("");
  return (
    <Form
      actions={
        <ActionPanel>
          <Action
            title="Submit"
            icon={Icon.Checkmark}
            onAction={() => {
              onSubmit(text);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea id="question" title="Question" placeholder="Type your question here" onChange={setText} />
    </Form>
  );
};

export default function ChatGPT() {
  const [conversationId, setConversationId] = useState<string>(uuidv4());
  const [conversation, setConversation] = useState<ChatGPTConversation>();
  const [answers, setAnswers] = useState<ChatAnswer[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAnswerId, setSelectedAnswer] = useState<string | null>(null);

  const savedAnswers = usePromise(async () => {
    const storedSavedAnswers = await LocalStorage.getItem<string>("savedAnswers");
    const savedAnswers = storedSavedAnswers ? JSON.parse(storedSavedAnswers) : [];
    return savedAnswers as Answer[];
  });
  const history = usePromise(async () => {
    const storedHistory = await LocalStorage.getItem<string>("history");
    const history = storedHistory ? JSON.parse(storedHistory) : [];
    return history as Answer[];
  });
  useEffect(() => {
    (async () => {
      const initConversation = await chatGPT.getConversation();
      setConversation(initConversation);
    })();
  }, []);

  const saveAnswer = async (answer: Answer) => {
    const toast = await showToast({
      title: "Saving your answer...",
      style: Toast.Style.Animated,
    });
    answer.savedAt = new Date().toISOString();
    await LocalStorage.setItem("savedAnswers", JSON.stringify([...(savedAnswers.data || []), answer]));
    toast.title = "Answer saved!";
    toast.style = Toast.Style.Success;
  };

  const [chatGPT] = useState(() => {
    const sessionToken = getPreferenceValues<{
      sessionToken: string;
    }>().sessionToken;

    return new ChatGPTAPI({ sessionToken });
  });

  async function getAnswer(question: string) {
    const toast = await showToast({
      title: "Getting your answer...",
      style: Toast.Style.Animated,
    });

    const isAuthenticated: boolean = await chatGPT.getIsAuthenticated();

    if (!isAuthenticated) {
      toast.title = "Your session token is invalid!";
      toast.style = Toast.Style.Failure;
      openExtensionPreferences();
      setIsLoading(false);
    }

    const answerId = uuidv4();
    setIsLoading(true);
    const baseAnswer: ChatAnswer = {
      id: answerId,
      answer: "",
      partialAnswer: "",
      done: false,
      question: question,
      conversationId: conversationId,
      createdAt: new Date().toISOString(),
    };

    // Add new answer
    setAnswers((prev) => {
      return [...prev, baseAnswer];
    });

    // Weird selection glitch workaround
    setTimeout(async () => {
      setSelectedAnswer(answerId);
    }, 50);

    conversation &&
      (await conversation
        .sendMessage(question, {
          timeoutMs: 2 * 60 * 1000,
          onProgress: (progress) => {
            setAnswers((prev) => {
              const newAnswers = prev.map((a) => {
                if (a.id === answerId) {
                  return {
                    ...a,
                    partialAnswer: progress,
                  };
                }
                return a;
              });
              return newAnswers;
            });
          },
        })
        .then((data) => {
          const newAnswer: ChatAnswer = {
            ...baseAnswer,
            answer: data,
            partialAnswer: data,
            done: true,
          };
          setAnswers((prev) => {
            return prev.map((a) => {
              if (a.id === answerId) {
                return newAnswer;
              }
              return a;
            });
          });
          LocalStorage.setItem("history", JSON.stringify([newAnswer, ...(history.data || [])]));
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
        }));
  }

  const SearchActions = () => {
    return (
      <>
        {searchText.length > 0 && (
          <Action
            title="Get answer"
            icon={Icon.ArrowRight}
            onAction={() => {
              getAnswer(searchText);
            }}
          />
        )}
        <Action
          title="Full text input"
          shortcut={{ modifiers: ["cmd"], key: "t" }}
          icon={Icon.Text}
          onAction={() => {
            const { pop, push } = useNavigation();

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
      </>
    );
  };
  const AnswerActions = (props: { answer: Answer }) => (
    <>
      <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy Answer" content={props.answer.answer} />
      <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy Question" content={props.answer.question} />
      <Action
        icon={Icon.Star}
        title="Save Answer"
        onAction={() => saveAnswer(props.answer)}
        shortcut={{ modifiers: ["cmd"], key: "s" }}
      />
      <Action
        icon={Icon.SpeechBubble}
        title="Speak"
        onAction={() => {
          say.stop();
          say.speak(props.answer.answer);
        }}
        shortcut={{ modifiers: ["cmd"], key: "p" }}
      />
      <Action.CreateSnippet
        icon={Icon.Snippets}
        title="Save as a Snippet"
        snippet={{ text: props.answer.answer, name: props.answer.question }}
        shortcut={{ modifiers: ["cmd"], key: "n" }}
      />
      <Action
        title="Share to shareg.pt"
        shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
        icon={Icon.Upload}
        onAction={async () => {
          if (props.answer) {
            const toast = await showToast({
              title: "Sharing your conversation...",
              style: Toast.Style.Animated,
            });
            await shareConversation({
              avatarUrl: defaultProfileImage,
              items: answers.flatMap((a): ConversationItem[] => [
                {
                  value: a.question,
                  from: "human",
                },
                {
                  value: a.answer,
                  from: "gpt",
                },
              ]),
            })
              .then(({ url }) => {
                Clipboard.copy(url);
                toast.title = `Copied link to clipboard!`;
                toast.style = Toast.Style.Success;
              })
              .catch(() => {
                toast.title = "Error while sharing conversation";
                toast.style = Toast.Style.Failure;
              });
          }
        }}
      />
    </>
  );

  return (
    <List
      isShowingDetail
      filtering={false}
      isLoading={isLoading && history.isLoading && savedAnswers.isLoading}
      onSearchTextChange={setSearchText}
      throttle={false}
      navigationTitle={"ChatGPT"}
      selectedItemId={selectedAnswerId || undefined}
      onSelectionChange={(id) => {
        if (id !== selectedAnswerId) {
          setSelectedAnswer(id);
        }
      }}
      searchBarPlaceholder={
        answers.length > 0 ? "Ask another question..." : isLoading ? "Generating your answer..." : "Ask a question..."
      }
    >
      <List.EmptyView
        title="Ask anything!"
        description={
          isLoading
            ? "Hang on tight! This might require some time. You may redo your search if it takes longer"
            : "Type your question or prompt from the search bar and hit the enter key"
        }
        icon={Icon.QuestionMark}
        actions={
          <ActionPanel>
            <SearchActions />
          </ActionPanel>
        }
      />
      <List.Section title="Answers">
        {answers
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((answer, i) => {
            const currentAnswer = answer.done ? answer.answer : answer.partialAnswer;
            const markdown = `${currentAnswer}`;
            return (
              <List.Item
                id={answer.id}
                key={answer.id}
                accessories={[{ text: `#${answers.length - i}` }]}
                title={answer.question}
                detail={<AnswerDetailView answer={answer} markdown={markdown} />}
                actions={
                  <ActionPanel>
                    <SearchActions />
                    <AnswerActions answer={answer} />
                    {answers.length > 0 && (
                      <Action
                        style={Action.Style.Destructive}
                        title="Start new conversation"
                        shortcut={{ modifiers: ["cmd", "shift"], key: "n" }}
                        icon={Icon.RotateAntiClockwise}
                        onAction={async () => {
                          await confirmAlert({
                            title: "Are you sure you want to start a new conversation?",
                            message: "This action cannot be undone.",
                            icon: Icon.RotateAntiClockwise,
                            primaryAction: {
                              title: "Start New",
                              style: Alert.ActionStyle.Destructive,
                              onAction: () => {
                                setAnswers([]);
                                clearSearchBar();
                                setConversationId(uuidv4());
                                setIsLoading(false);
                              },
                            },
                          });
                        }}
                      />
                    )}
                  </ActionPanel>
                }
              />
            );
          })}
      </List.Section>
      <List.Section title="Past Answers">
        {history.data
          ?.filter((answer) => !answers.find((a) => a.id === answer.id)) // Filter out answers that are already in the answers list
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((answer) => {
            return (
              <List.Item
                id={answer.id}
                key={answer.id}
                title={answer.question}
                detail={<AnswerDetailView answer={answer} markdown={answer.answer} />}
                actions={
                  <ActionPanel>
                    <SearchActions />
                    <AnswerActions answer={answer} />
                    <Action
                      title="Clear History"
                      onAction={async () => {
                        await history.mutate(LocalStorage.removeItem("history"), {
                          optimisticUpdate() {
                            return [];
                          },
                        });
                      }}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
      </List.Section>
    </List>
  );
}

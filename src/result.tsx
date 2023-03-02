import {
  Action,
  ActionPanel,
  clearSearchBar,
  Clipboard,
  Form,
  getPreferenceValues,
  Icon,
  List,
  LocalStorage,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import fetch from "node-fetch";
import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from "chatgpt";
import { useCallback, useEffect, useState } from "react";
import say from "say";
import { v4 as uuidv4 } from "uuid";
import { DestructiveAction, GetAnswerAction, TextToSpeechAction } from "./actions";
import { CopyActionSection } from "./actions/copy";
import { PreferencesActionSection } from "./actions/preferences";
import { SaveActionSection } from "./actions/save";
import { defaultProfileImage } from "./libs/profile-image";
import { shareConversation } from "./libs/share-gpt";
import { Answer, ChatAnswer, ConversationItem, Question } from "./type";
import { AnswerDetailView } from "./views/answer-detail";
import { EmptyView } from "./views/empty";

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
  const [parentMessageId, setParentMessagId] = useState<string>("");
  const [conversation, setConversation] = useState<string[]>([]);
  const [answers, setAnswers] = useState<ChatAnswer[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<Answer[]>([]);
  const [initialQuestions, setInitialQuestions] = useState<Question[]>([]);
  const [history, setHistory] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedAnswerId, setSelectedAnswer] = useState<string | null>(null);

  const { pop, push } = useNavigation();

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
    (async () => {
      const storedInitialQuestions = await LocalStorage.getItem<string>("initialQuestions");

      if (!storedInitialQuestions) {
        setInitialQuestions([]);
      } else {
        const initialQuestions: Question[] = JSON.parse(storedInitialQuestions);
        setInitialQuestions((previous) => [...previous, ...initialQuestions]);
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
        const answers: Answer[] = JSON.parse(storedHistory);
        setHistory((previous) => [...previous, ...answers]);
      }
    })();
  }, []);

  useEffect(() => {
    LocalStorage.setItem("savedAnswers", JSON.stringify(savedAnswers));
  }, [savedAnswers]);

  useEffect(() => {
    LocalStorage.setItem("initialQuestions", JSON.stringify(initialQuestions));
  }, [initialQuestions]);

  useEffect(() => {
    LocalStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const [isAutoTTS] = useState(() => {
    const autoTTS = getPreferenceValues<{
      isAutoTTS: boolean;
    }>().isAutoTTS;

    return autoTTS;
  });

  const handleSaveAnswer = useCallback(
    async (answer: Answer) => {
      const toast = await showToast({
        title: "Saving your answer...",
        style: Toast.Style.Animated,
      });
      answer.savedAt = new Date().toISOString();
      setSavedAnswers([...savedAnswers, answer]);
      toast.title = "Answer saved!";
      toast.style = Toast.Style.Success;
    },
    [setSavedAnswers, savedAnswers]
  );

  const handleUpdateHistory = useCallback(
    async (answer: Answer) => {
      setHistory([...history, answer]);
    },
    [setHistory, history]
  );

  const handleUpdateInitialQuestions = useCallback(
    async (question: Question) => {
      setInitialQuestions([...initialQuestions, question]);
    },
    [setInitialQuestions, initialQuestions]
  );

  const [chatGPT] = useState(() => {
    const accessToken = getPreferenceValues<{ accessToken: string }>().accessToken;

    const apiReverseProxyUrl = getPreferenceValues<{ apiReverseProxyUrl: string }>().apiReverseProxyUrl;

    const mode = getPreferenceValues<{ mode: string }>().mode;
    return mode === "official"
      ? new ChatGPTAPI({ apiKey: accessToken, fetch: fetch})
      : new ChatGPTUnofficialProxyAPI({ accessToken, apiReverseProxyUrl, fetch: fetch });
  });

  async function getAnswer(question: string) {
    setIsLoading(true);

    const toast = await showToast({
      title: "Getting your answer...",
      style: Toast.Style.Animated,
    });

    const answerId = uuidv4();

    const baseAnswer: ChatAnswer = {
      id: answerId,
      answer: "",
      partialAnswer: "",
      done: false,
      convoId: "",
      parentId: "",
      question: question,
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

    await chatGPT
      .sendMessage(question, {
        parentMessageId: answers.length > 0 ? answers[answers.length - 1].parentId : undefined,
        conversationId: answers.length > 0 ? answers[answers.length - 1].convoId : undefined,
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
          answer: data.text,
          partialAnswer: data.text,
          convoId: data.id,
          parentId: data.parentMessageId,
          done: true,
        };
        if (isAutoTTS) {
          say.stop();
          say.speak(newAnswer.answer);
        }
        setAnswers((prev) => {
          return prev.map((a) => {
            if (a.id === answerId) {
              return newAnswer;
            }
            return a;
          });
        });
        handleUpdateHistory(newAnswer);
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

  const getActionPanel = (answer?: ChatAnswer) => (
    <ActionPanel>
      {searchText.length > 0 ? (
        <>
          <GetAnswerAction onAction={() => getAnswer(searchText)} />
        </>
      ) : answer && selectedAnswerId === answer.id ? (
        <>
          <CopyActionSection answer={answer.answer} question={answer.question} />
          <SaveActionSection
            onSaveAnswerAction={() => handleSaveAnswer(answer)}
            snippet={{ text: answer.answer, name: answer.question }}
          />
          <ActionPanel.Section title="Output">
            <TextToSpeechAction content={answer.answer} />
            <Action
              title="Share to shareg.pt"
              shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
              icon={Icon.Upload}
              onAction={async () => {
                if (answer) {
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
      {answers.length > 0 && (
        <ActionPanel.Section title="Restart">
          <DestructiveAction
            title="Start New Conversation"
            icon={Icon.RotateAntiClockwise}
            dialog={{
              title: "Are you sure you want to start a new conversation?",
              primaryButton: "Start New",
            }}
            onAction={() => {
              setAnswers([]);
              clearSearchBar();
              setConversationId(uuidv4());
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
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unduplicatedInitialQuestions = sortedInitialQuestions.filter(
    (value, index, self) => index === self.findIndex((answer) => answer.question === value.question)
  );

  const sortedAnswers = answers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <List
      isShowingDetail={answers.length > 0 ? true : false}
      filtering={false}
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      throttle={false}
      navigationTitle={"ChatGPT"}
      actions={getActionPanel()}
      selectedItemId={selectedAnswerId || undefined}
      onSelectionChange={(id) => {
        if (id !== selectedAnswerId) {
          setSelectedAnswer(id);
        }
      }}
      searchBarPlaceholder={answers.length > 0 ? "Ask another question..." : "Ask a question..."}
    >
      {searchText.length === 0 && answers.length === 0 ? (
        initialQuestions.length > 0 ? (
          <List.Section title="Recent questions" subtitle={initialQuestions.length.toLocaleString()}>
            {unduplicatedInitialQuestions.map((question) => {
              return (
                <List.Item
                  id={question.id}
                  key={question.id}
                  accessories={[{ text: new Date(question.createdAt ?? 0).toLocaleString() }]}
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
      ) : answers.length === 0 ? (
        <EmptyView />
      ) : (
        <List.Section title="Results" subtitle={answers.length.toLocaleString()}>
          {sortedAnswers.map((answer, i) => {
            const currentAnswer = answer.done ? answer.answer : answer.partialAnswer;
            const markdown = `**${answer.question}**\n\n${currentAnswer}`;
            return (
              <List.Item
                id={answer.id}
                key={answer.id}
                accessories={[{ text: `#${answers.length - i}` }]}
                title={answer.question}
                detail={<AnswerDetailView answer={answer} markdown={markdown} />}
                actions={isLoading ? undefined : getActionPanel(answer)}
              />
            );
          })}
        </List.Section>
      )}
    </List>
  );
}

import {
  Action,
  ActionPanel,
  Form,
  getPreferenceValues,
  Icon,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { ChatGPTAPI } from "chatgpt";
import { Fragment, useEffect, useRef, useState } from "react";

export default function Ask(props: { arguments: { question: string } }) {
  const { sessionToken } = getPreferenceValues();

  const [question, setQuestion] = useState(props.arguments.question);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<{ question: string; answer: string }[]>([]);
  const chatGPTAPI = useRef(new ChatGPTAPI({ sessionToken: sessionToken }));
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const askQuestion = async () => {
    if (question.length === 0) {
      setError("Question is required!");
    } else {
      setIsLoading(true);
      try {
        console.log(`asking question: ${question}...`);
        const answer = await chatGPTAPI.current.sendMessage(question);
        setQuestion("");
        setDialog([{ question: question, answer: answer }, ...dialog]);
      } catch (error) {
        await showToast(Toast.Style.Failure, "An error occurred", "Please check your network connection.");
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatGPTAPI.current.getIsAuthenticated().then(async (isAuthenticated) => {
      if (!isAuthenticated) {
        showToast(Toast.Style.Failure, "Your session token is invalid!");
        const toast = new Toast({
          title: "Your session token is invalid!",
          message: "Please update your session token in the preferences",
          primaryAction: {
            title: "Open Preferences",
            onAction: () => openExtensionPreferences(),
          },
        });
        await toast.show();
        return;
      }
      setIsAuth(true);

      if (props.arguments.question) {
        askQuestion();
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          {isAuth && !isLoading && <Action.SubmitForm icon={Icon.Bubble} title="Ask Question" onSubmit={askQuestion} />}
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="question"
        value={question}
        error={error}
        onChange={(question) => {
          if (question.length > 0) {
            setError("");
          }
          setQuestion(question);
        }}
        placeholder="Type your question"
      />
      {dialog.map(({ question, answer }, index) => {
        const exchangeId = dialog.length - index;
        return (
          <Fragment key={exchangeId}>
            <Form.Separator />
            <Form.Description title="Question" text={question} />
            <Form.Description title="Answer" text={answer} />
          </Fragment>
        );
      })}
    </Form>
  );
}

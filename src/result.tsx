import { Action, ActionPanel, Cache, Detail, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { ChatGPTAPI } from "chatgpt";
import { useEffect, useState } from "react";

export default function Result(props: { question: string; sessionToken: string }) {
  const [answer, setAnswer] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { question, sessionToken } = props;

  const { pop } = useNavigation();

  const isQuestionProvided: boolean = question.length > 0;
  const isSessionTokenProvided: boolean = sessionToken.length > 0;

  const cache = new Cache();

  useEffect(() => {
    (async () => {
      async function getAnswer(sessionToken: string) {
        const toast = await showToast({
          title: "Initializing...",
          style: Toast.Style.Animated,
        });

        const chatGPT = new ChatGPTAPI({ sessionToken: sessionToken });
        const isAuthenticated: boolean = await chatGPT.getIsAuthenticated();

        if (isAuthenticated) {
          toast.title = "Already authenticated!";
          toast.style = Toast.Style.Success;
          toast.title = "Getting your answer...";
          toast.style = Toast.Style.Animated;
          await chatGPT
            .sendMessage(question)
            .then((data) => setAnswer(data))
            .then(() => {
              toast.title = "Got your answer!";
              toast.style = Toast.Style.Success;
              setIsLoading(false);
              cache.set("isSessionTokenValid", "true");
              cache.set("sessionToken", sessionToken);
            })
            .catch((err) => {
              toast.title = "Error";
              if (err instanceof Error) {
                toast.message = err?.message;
              }
              toast.style = Toast.Style.Failure;
            });
        } else {
          toast.title = "Your session token is invalid!";
          toast.style = Toast.Style.Failure;
          cache.set("isSessionTokenValid", "false");
          setIsLoading(false);
          pop();
        }
      }

      if (isQuestionProvided && isSessionTokenProvided) {
        getAnswer(sessionToken);
      }
    })();
  }, []);

  const markdown = `
${isLoading ? "" : ` # ${question}`}

${answer}
`;
  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle="Answer"
      actions={
        answer.length > 0 ? (
          <ActionPanel>
            <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy Answer" content={answer} />
            <Action.CopyToClipboard icon={Icon.CopyClipboard} title="Copy Question" content={question} />
            <Action onAction={() => pop()} icon={Icon.ArrowLeft} title="Back to Question Field" />
          </ActionPanel>
        ) : undefined
      }
    />
  );
}

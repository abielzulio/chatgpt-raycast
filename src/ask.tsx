import { Cache, Detail, showToast, Toast } from "@raycast/api";
import { ChatGPTAPI } from "chatgpt";
import { useEffect, useState } from "react";
import { setTimeout } from "timers/promises";

interface Arguments {
  question: string;
}

export default function Main(props: { arguments: Arguments }) {
  const [answer, setAnswer] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { question } = props.arguments;

  const cache = new Cache();

  useEffect(() => {
    async function getAnswer() {
      const toast = await showToast({
        title: "Initializing...",
        style: Toast.Style.Animated,
      });

      async function signIn(api: ChatGPTAPI) {
        try {
          toast.title = "Signing in...";
          toast.style = Toast.Style.Animated;
          await setTimeout(1000);
          const isSignedIn = await api.getIsSignedIn();
          if (isSignedIn) {
            toast.title = "Signed in!";
            toast.style = Toast.Style.Success;
            cache.set("isSignedIn", isSignedIn.toString());
          }
        } catch (err) {
          toast.title = "Error";
          if (err instanceof Error) {
            toast.message = err?.message;
          }
          toast.style = Toast.Style.Failure;
        }
      }

      const isSignedIn = cache.get("isSignedIn") === "true";

      if (isSignedIn) {
        const api = new ChatGPTAPI({ headless: true });
        await api.init();
        toast.title = "Already signed in!";
        toast.style = Toast.Style.Success;
        toast.title = "Getting your answer...";
        toast.style = Toast.Style.Animated;
        await api
          .sendMessage(question)
          .then((data) => setAnswer(data))
          .then(() => setIsLoading(false))
          .catch((err) => {
            toast.title = "Error";
            if (err instanceof Error) {
              toast.message = err?.message;
            }
            toast.style = Toast.Style.Failure;
          });
        if (answer) {
          toast.title = "Got your answer!";
          toast.style = Toast.Style.Success;
        }
        toast.hide();
      } else {
        const api = new ChatGPTAPI({ headless: false });
        await api.init();
        signIn(api);
      }
    }

    getAnswer();
  }, []);

  const markdown = `
# ${isLoading ? "Answering your question... " : question}

${answer}
`;
  return <Detail isLoading={isLoading} markdown={markdown} navigationTitle="Answer" />;
}

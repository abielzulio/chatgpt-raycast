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
        title: "Loading...",
        style: Toast.Style.Animated,
      });

      async function signIn() {
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

      const api = new ChatGPTAPI();
      await api.init();

      const isSignedIn = cache.get("isSignedIn") === "true" && api.getIsSignedIn();

      if (isSignedIn) {
        toast.title = "Already signed in!";
        toast.style = Toast.Style.Success;
        toast.title = "Getting your answer...";
        toast.style = Toast.Style.Animated;
        await api
          .sendMessage(question)
          .then((data) => setAnswer(data))
          .then(() => setIsLoading(false))
          .then(() => api.close())
          .then(() => {
            toast.title = "Done!";
            toast.style = Toast.Style.Success;
          });
        toast.hide();
      } else {
        signIn();
      }
    }

    getAnswer();
  }, []);

  const markdown = `
# ${isLoading ? "Getting your answers... " : question}

${answer}
`;
  return <Detail isLoading={isLoading} markdown={markdown} navigationTitle="Answer" />;
}

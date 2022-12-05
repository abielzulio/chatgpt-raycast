import { Action, ActionPanel, Cache, Form, Icon, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import Result from "./result";
import { Question } from "./type";

export default function Ask(props: { draftValues?: Question }) {
  const { draftValues } = props;
  const { pop, push } = useNavigation();
  const [question, setQuestion] = useState<string>(draftValues?.question ?? "");
  const [sessionToken, setSessionToken] = useState<string>(draftValues?.sessionToken ?? "");
  const [sessionTokenError, setSessionTokenError] = useState<string | undefined>();
  const [questionError, setQuestionError] = useState<string | undefined>();

  function dropQuestionErrorIfNeeded() {
    if (questionError && questionError.length > 0) {
      setQuestionError(undefined);
    }
  }

  function dropSessionTokenError() {
    if (sessionTokenError && sessionTokenError.length > 0) {
      setSessionTokenError(undefined);
    }
  }

  const cache = new Cache();
  const isSessionTokenValid: boolean = cache.has("isSessionTokenValid") && cache.get("isSessionTokenValid") === "true";

  useEffect(() => {
    if (isSessionTokenValid) {
      setSessionToken(cache.get("sessionToken") ?? "");
    }
  }, [isSessionTokenValid]);

  return (
    <Form
      enableDrafts
      navigationTitle="Question Field"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            icon={isSessionTokenValid ? Icon.Bubble : Icon.SaveDocument}
            title={isSessionTokenValid ? "Submit Question" : "Save Session Token & Ask"}
            onSubmit={() => {
              if (question.length === 0) {
                setQuestionError("Question is required");
                if (!isSessionTokenValid) {
                  if (sessionToken.length === 0) {
                    setSessionTokenError("Session token is required");
                  }
                }
              } else {
                push(<Result question={question} sessionToken={sessionToken} />);
              }
            }}
          />
          {isSessionTokenValid && (
            <Action
              icon={Icon.WrenchScrewdriver}
              title="Change Session Token"
              onAction={() => {
                cache.set("isSessionTokenValid", "false");
                pop();
              }}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="question"
        title="Question"
        value={question}
        placeholder="Type your question"
        error={questionError}
        onChange={setQuestion}
        onBlur={(event) => {
          if (event.target.value?.length == 0) {
            setQuestionError("The field should't be empty!");
          } else {
            dropQuestionErrorIfNeeded();
          }
        }}
      />
      {!isSessionTokenValid && (
        <Form.PasswordField
          id="sessionToken"
          title="Session Token"
          placeholder="Type your session token"
          error={sessionTokenError}
          onChange={setSessionToken}
          onBlur={(event) => {
            if (event.target.value?.length == 0) {
              setSessionTokenError("The field should't be empty!");
            } else {
              dropSessionTokenError();
            }
          }}
        />
      )}
    </Form>
  );
}

import { Form, Action, ActionPanel, Icon, useNavigation } from "@raycast/api";
import { useState } from "react";
import Result from "./result";
import { Question } from "./type";

export default function Ask(props: { draftValues?: Question }) {
  const { draftValues } = props;
  const { push } = useNavigation();
  const [question, setQuestion] = useState<string>(draftValues?.question ?? "");
  const [questionError, setQuestionError] = useState<string | undefined>();

  function dropQuestionErrorIfNeeded() {
    if (questionError && questionError.length > 0) {
      setQuestionError(undefined);
    }
  }

  return (
    <Form
      enableDrafts
      navigationTitle="Question Field"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            icon={Icon.QuestionMark}
            title="Submit Question"
            onSubmit={() => {
              if (question.length === 0) {
                setQuestionError("Your question is required");
              } else {
                push(<Result question={question} />);
              }
            }}
          />
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
    </Form>
  );
}

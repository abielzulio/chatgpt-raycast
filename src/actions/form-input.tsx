import { Action, ActionPanel, Form, Icon, useNavigation } from "@raycast/api";
import { useState } from "react";

export const FormInputActionSection = ({
  initialQuestion,
  onSubmit,
}: {
  initialQuestion: string;
  onSubmit: (question: string) => void;
}) => {
  const { pop, push } = useNavigation();

  const [question, setQuestion] = useState<string>(initialQuestion ?? "");
  return (
    <ActionPanel.Section title="Input">
      <Action
        title="Full Text Input"
        shortcut={{ modifiers: ["cmd"], key: "t" }}
        icon={Icon.Text}
        onAction={() => {
          push(
            <Form
              actions={
                <ActionPanel>
                  <Action
                    title="Submit"
                    icon={Icon.Checkmark}
                    onAction={() => {
                      onSubmit(question);
                      pop();
                    }}
                  />
                </ActionPanel>
              }
            >
              <Form.TextArea
                id="question"
                title="Question"
                placeholder="Type your question here"
                onChange={setQuestion}
                value={question}
              />
            </Form>
          );
        }}
      />
    </ActionPanel.Section>
  );
};

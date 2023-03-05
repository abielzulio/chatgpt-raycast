import { ActionPanel, List } from "@raycast/api";
import { DestructiveAction, GetAnswerAction } from "../actions";
import { PreferencesActionSection } from "../actions/preferences";
import { ChatHook, Question, RecentQuestionHook } from "../type";
import { EmptyView } from "./empty";

export const RecentQuestionListView = ({
  data,
  use,
}: {
  data: Question[];
  use: {
    chat: ChatHook;
    recentQuestion: RecentQuestionHook;
  };
}) => {
  const sortedRecentQuestions = data.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const uniqueRecentQuestions = sortedRecentQuestions.filter(
    (value, index, self) => index === self.findIndex((answer) => answer.question === value.question)
  );

  return uniqueRecentQuestions.length > 0 ? (
    <List.Section title="Recent questions" subtitle={uniqueRecentQuestions.length.toLocaleString()}>
      {uniqueRecentQuestions.map((question) => {
        return (
          <List.Item
            id={question.id}
            key={question.id}
            accessories={[{ text: new Date(question.created_at ?? 0).toLocaleString() }]}
            title={question.question}
            actions={
              <ActionPanel>
                <ActionPanel.Section title="Ask">
                  <GetAnswerAction onAction={() => use.chat.getAnswer(question.question)} />
                </ActionPanel.Section>
                <ActionPanel.Section title="Remove">
                  <DestructiveAction
                    title="Clear History"
                    dialog={{ title: "Are you sure you to clear your recent question?" }}
                    onAction={() => use.recentQuestion.clear()}
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
  );
};

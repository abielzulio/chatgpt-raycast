import { Icon, List } from "@raycast/api";

export const EmptyView = ({ isLoading }: { isLoading: boolean }) => (
  <List.EmptyView
    title="Ask anything!"
    description={
      isLoading
        ? "Hang on tight! This might require some time. You may redo your search if it takes longer"
        : "Type your question or prompt from the search bar and hit the enter key"
    }
    icon={Icon.QuestionMark}
  />
);

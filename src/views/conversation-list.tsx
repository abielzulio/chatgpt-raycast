import { List } from "@raycast/api";
import { Conversation } from "../type";

export const ConversationListView = (props: {
  title: string;
  data: Conversation[];
  selectedDataId: string;
  actionPanel: (conversation: Conversation) => JSX.Element;
}) => {
  const { title, data, selectedDataId, actionPanel } = props;

  return (
    <List.Section title={title} subtitle={data.length.toLocaleString()}>
      {data.map((conversation) => (
        <List.Item
          id={conversation.id}
          key={conversation.id}
          title={conversation.chats[conversation.chats.length - 1].question}
          accessories={[{ text: new Date(conversation.created_at ?? 0).toLocaleDateString() }]}
          actions={conversation && selectedDataId === conversation.id ? actionPanel(conversation) : undefined}
        />
      ))}
    </List.Section>
  );
};

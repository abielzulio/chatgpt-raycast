import { List } from "@raycast/api";

export default function PromptListItem({
  title,
  subtitle,
  text,
  actions,
}: {
  title: string;
  subtitle: string;
  text: string;
  actions: React.ReactNode;
}) {
  return (
    <List.Item
      title={title}
      icon="👉"
      subtitle={subtitle}
      actions={actions}
      detail={<List.Item.Detail markdown={text} />}
    />
  );
}

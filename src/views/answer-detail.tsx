import { Answer } from "../type";
import { getPreferenceValues, List } from "@raycast/api";
import { useState } from "react";

export const AnswerDetailView = (props: { answer: Answer; markdown?: string | null | undefined }) => {
  const { answer, markdown } = props;
  const [isDetailedView] = useState(() => {
    return getPreferenceValues<{ isDetailedView: boolean }>().isDetailedView;
  });
  return (
    <List.Item.Detail
      markdown={markdown ?? `**${answer.question}**\n\n${answer.answer}`}
      metadata={
        isDetailedView ? (
          <List.Item.Detail.Metadata>
            <List.Item.Detail.Metadata.Label title="Date" text={new Date(answer.createdAt ?? 0).toLocaleString()} />
            <List.Item.Detail.Metadata.Separator />
            <List.Item.Detail.Metadata.Label title="ID" text={answer.id} />
            <List.Item.Detail.Metadata.Label title="Conversation ID" text={answer.conversationId} />
          </List.Item.Detail.Metadata>
        ) : undefined
      }
    />
  );
};

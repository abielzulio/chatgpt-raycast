import { Action, Icon } from "@raycast/api";
import say from "say";

export const CopyToClipboardAction = (props: Action.CopyToClipboard.Props) => (
  <Action.CopyToClipboard icon={Icon.CopyClipboard} {...props} />
);

export const TextToSpeechAction = ({ content }: { content: string }) => (
  <Action
    icon={Icon.SpeechBubble}
    title="Speak"
    onAction={() => {
      say.stop();
      say.speak(content);
    }}
    shortcut={{ modifiers: ["cmd"], key: "p" }}
  />
);

export const SaveAnswerAction = ({ onAction }: { onAction: () => void }) => (
  <Action icon={Icon.Star} title="Save Answer" onAction={onAction} shortcut={{ modifiers: ["cmd"], key: "s" }} />
);

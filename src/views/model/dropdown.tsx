import { List } from "@raycast/api";
import { Model } from "../../type";

export const ModelDropdown = (props: { models: Model[]; onModelChange: (id: string) => void }) => {
  const { models, onModelChange } = props;
  const separateDefaultModel = models.filter((x) => x.id !== "default");
  const defaultModel = models.find((x) => x.id === "default");
  return (
    <List.Dropdown
      tooltip="Select Model"
      storeValue={true}
      defaultValue={defaultModel ? defaultModel.id : undefined}
      onChange={(id) => {
        onModelChange(id);
      }}
    >
      {defaultModel && <List.Dropdown.Item key={defaultModel.id} title={defaultModel.name} value={defaultModel.id} />}
      <List.Dropdown.Section title="Custom Models">
        {separateDefaultModel.map((model) => (
          <List.Dropdown.Item key={model.id} title={model.name} value={model.id} />
        ))}
      </List.Dropdown.Section>
    </List.Dropdown>
  );
};

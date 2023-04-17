import { getPreferenceValues } from "@raycast/api";
import { Configuration, OpenAIApi } from "openai";
import { useState } from "react";

export function useChatGPT() {
  const [chatGPT] = useState(() => {
    const preferences = getPreferenceValues<{
      api: string;
      useAzure: boolean;
      azureEndpoint: string;
      azureDeployment: string;
    }>();
    const getConfig = function (useAzure: boolean, apikey: string, azureEndpoint: string, azureDeployment: string) {
      if (useAzure) {
        return new Configuration({
          apiKey: apikey,
          basePath: azureEndpoint + "/openai/deployments/" + azureDeployment,
        });
      } else {
        return new Configuration({ apiKey: apikey });
      }
    };
    const config = getConfig(
      preferences.useAzure,
      preferences.api,
      preferences.azureEndpoint,
      preferences.azureDeployment
    );
    return new OpenAIApi(config);
  });
  return chatGPT;
}
export function getConfiguration() {
  return getPreferenceValues<{
    api: string;
    useAzure: boolean;
    azureEndpoint: string;
    azureDeployment: string;
  }>();
}

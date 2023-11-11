import { getPreferenceValues } from "@raycast/api";
import { Configuration, OpenAIApi } from "openai";
import { useState } from "react";

export function useChatGPT(): OpenAIApi {
  const [chatGPT] = useState(() => {
    const apiKey = getPreferenceValues<{
      api: string;
    }>().api;

    const config = new Configuration({ apiKey });

    const baseAPI = getPreferenceValues<{
      baseAPI: string;
    }>().baseAPI;

    const useBaseAPI = getPreferenceValues<{
      useBaseAPI: boolean;
    }>().useBaseAPI;

    if (useBaseAPI) {
      config.basePath = baseAPI;
    }  

    return new OpenAIApi(config);
  });

  return chatGPT;
}

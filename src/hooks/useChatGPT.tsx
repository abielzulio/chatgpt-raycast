import { getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import { Configuration, OpenAIApi } from "openai";

export function useChatGPT(): OpenAIApi {
  const [chatGPT] = useState(() => {
    const apiKey = getPreferenceValues<{
      api: string;
    }>().api;

    const config = new Configuration({ apiKey: "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" });

    return new OpenAIApi(config);
  });

  return chatGPT;
}

import { getPreferenceValues } from "@raycast/api";

export function useAutoTTS(): boolean {
  const autoTTS = getPreferenceValues<{
    isAutoTTS: boolean;
  }>().isAutoTTS;

  return autoTTS;
}

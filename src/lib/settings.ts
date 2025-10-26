import { storage } from "@/lib/storage";

export const SELECTED_MODEL_KEY = "selected-model";

export function getSelectedModelLabel(defaultLabel = "OpenAI - GPT-5"): string {
  return storage.getJSON<string>(SELECTED_MODEL_KEY, defaultLabel);
}

export function setSelectedModelLabel(label: string) {
  storage.setJSON(SELECTED_MODEL_KEY, label);
}
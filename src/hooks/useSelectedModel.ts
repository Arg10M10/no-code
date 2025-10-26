import React from "react";
import { storage } from "@/lib/storage";

const SELECTED_MODEL_KEY = "selected-model";
const DEFAULT_MODEL = "OpenAI - GPT-5";

export function useSelectedModel() {
  const [selectedModel, setSelectedModelState] = React.useState<string>(() =>
    storage.getJSON<string>(SELECTED_MODEL_KEY, DEFAULT_MODEL)
  );

  const setSelectedModel = (model: string) => {
    setSelectedModelState(model);
    storage.setJSON(SELECTED_MODEL_KEY, model);
  };

  return { selectedModel, setSelectedModel };
}

export const SELECTED_MODEL_STORAGE_KEY = SELECTED_MODEL_KEY;
export const DEFAULT_SELECTED_MODEL = DEFAULT_MODEL;
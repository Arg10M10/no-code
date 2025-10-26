import { ProviderId } from "@/services/ai";

interface Model {
  label: string;
  provider: ProviderId;
}

export function getAvailableModels(): Model[] {
  return [
    { label: "GPT-4o Mini - OpenAI", provider: "openai" },
    { label: "GPT-4o - OpenAI", provider: "openai" },
    { label: "Gemini 2.5 Flash - Google", provider: "google" },
    { label: "Gemini 2.5 Pro - Google", provider: "google" },
    { label: "Claude 3.5 Sonnet - Anthropic", provider: "anthropic" },
    { label: "Deepseek Chat - OpenRouter", provider: "openrouter" },
  ];
}
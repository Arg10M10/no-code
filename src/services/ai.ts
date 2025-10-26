export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIRequest = {
  prompt: string;
  selectedModelLabel: string;
  system?: string;
  openRouterApiKey: string;
};

type OpenRouterChatResponse = {
  id: string;
  choices: {
    index: number;
    message: { role: "assistant"; content: string };
    finish_reason: string | null;
  }[];
};

function mapLabelToModelId(label: string): string {
  const provider = (label.split(" - ")[0] || "").toLowerCase().trim();
  if (provider.includes("openai")) return "openai/gpt-4o-mini";
  if (provider.includes("google")) return "google/gemini-1.5-flash-8b";
  if (provider.includes("anthropic")) return "anthropic/claude-3.5-sonnet";
  if (provider.includes("openrouter")) return "deepseek/deepseek-chat";
  return "openai/gpt-4o-mini";
}

export async function generateAnswer(req: AIRequest): Promise<string> {
  const model = mapLabelToModelId(req.selectedModelLabel);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        req.system ??
        "You are an expert assistant that helps build and improve websites, apps and businesses. Answer with clear steps, actionable guidance, and concise best-practice code snippets when helpful.",
    },
    { role: "user", content: req.prompt },
  ];

  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.openRouterApiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": document.title || "ByDamian App",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: 0.7,
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`OpenRouter error: ${r.status} ${text}`);
  }

  const data = (await r.json()) as OpenRouterChatResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("The AI response had no content.");

  return content;
}

export async function generateChat(params: {
  messages: ChatMessage[];
  selectedModelLabel: string;
  openRouterApiKey: string;
  temperature?: number;
}): Promise<string> {
  const model = mapLabelToModelId(params.selectedModelLabel);

  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.openRouterApiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": document.title || "ByDamian App",
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      stream: false,
      temperature: params.temperature ?? 0.7,
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`OpenRouter error: ${r.status} ${text}`);
  }

  const data = (await r.json()) as OpenRouterChatResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("The AI response had no content.");
  return content;
}
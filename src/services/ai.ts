export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderId = "openai" | "google" | "anthropic" | "openrouter";

export function getProviderFromLabel(label: string): ProviderId {
  const p = (label.split(" - ")[0] || "").toLowerCase().trim();
  if (p.includes("openai")) return "openai";
  if (p.includes("google")) return "google";
  if (p.includes("anthropic")) return "anthropic";
  if (p.includes("openrouter")) return "openrouter";
  return "openai";
}

type OpenRouterChatResponse = {
  id: string;
  choices: {
    index: number;
    message: { role: "assistant"; content: string };
    finish_reason: string | null;
  }[];
};

type OpenAIChatResponse = {
  id: string;
  choices: {
    index: number;
    message: { role: "assistant"; content: string };
    finish_reason: string | null;
  }[];
};

type AnthropicResponse = {
  id: string;
  type: "message";
  content: { type: "text"; text: string }[];
  stop_reason: string | null;
};

type GooglePart = { text?: string };
type GoogleContent = { role?: string; parts: GooglePart[] };
type GoogleResponse = {
  candidates?: { content?: { parts?: GooglePart[] } }[];
};

function mapLabelToModelId(label: string): { provider: ProviderId; model: string } {
  const provider = getProviderFromLabel(label);
  const normalized = label.toLowerCase();

  switch (provider) {
    case "google": {
      // UI: "Gemini 2.5 flash" / "Gemini 2.5 Pro" -> API: gemini-2.5-flash / gemini-2.5-pro
      if (normalized.includes("2.5") && normalized.includes("flash")) {
        return { provider, model: "gemini-2.5-flash" };
      }
      if (normalized.includes("2.5") && normalized.includes("pro")) {
        return { provider, model: "gemini-2.5-pro" };
      }
      // Fallback seguro a 2.5
      return { provider, model: "gemini-2.5-flash" };
    }
    case "openai": {
      // UI: "o4mini" -> API: o4-mini
      if (normalized.includes("o4mini") || normalized.includes("o4-mini")) {
        return { provider, model: "o4-mini" };
      }
      // UI: "GPT-5" variantes -> mapear a modelos disponibles
      if (normalized.includes("gpt-5") && normalized.includes("mini")) {
        return { provider, model: "gpt-4o-mini" };
      }
      if (normalized.includes("gpt-5") && normalized.includes("nano")) {
        return { provider, model: "gpt-4o-mini" };
      }
      if (normalized.includes("gpt-5") && normalized.includes("codex")) {
        return { provider, model: "gpt-4o-mini" };
      }
      if (normalized.includes("gpt-5")) {
        return { provider, model: "gpt-4o" };
      }
      // Fallback seguro
      return { provider, model: "gpt-4o-mini" };
    }
    case "anthropic": {
      // Varias etiquetas de "Claude X Sonet" -> API estable
      return { provider, model: "claude-3-5-sonnet-latest" };
    }
    case "openrouter": {
      if (normalized.includes("qwen") || normalized.includes("qween")) {
        return { provider, model: "qwen/qwen2.5-coder" };
      }
      if (normalized.includes("deepseek")) {
        return { provider, model: "deepseek/deepseek-chat" };
      }
      // Fallback
      return { provider, model: "deepseek/deepseek-chat" };
    }
    default:
      return { provider: "openai", model: "gpt-4o-mini" };
  }
}

async function callOpenAI(params: {
  messages: ChatMessage[];
  model: string;
  apiKey: string;
  temperature?: number;
}): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`OpenAI error: ${r.status} ${text}`);
  }
  const data = (await r.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("The AI response had no content.");
  return content;
}

async function callAnthropic(params: {
  messages: ChatMessage[];
  model: string;
  apiKey: string;
  system?: string;
  temperature?: number;
}): Promise<string> {
  const system = params.messages.find((m) => m.role === "system")?.content || params.system || "";
  const chatMessages = params.messages.filter((m) => m.role !== "system");
  const mapped = chatMessages.map((m) => ({
    role: m.role,
    content: [{ type: "text", text: m.content }],
  }));
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 1024,
      system,
      messages: mapped,
      temperature: params.temperature ?? 0.7,
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Anthropic error: ${r.status} ${text}`);
  }
  const data = (await r.json()) as AnthropicResponse;
  const content = data.content?.[0]?.text?.trim();
  if (!content) throw new Error("The AI response had no content.");
  return content;
}

async function callGoogle(params: {
  messages: ChatMessage[];
  model: string;
  apiKey: string;
  system?: string;
  temperature?: number;
}): Promise<string> {
  const system = params.messages.find((m) => m.role === "system")?.content || params.system || "";
  const chatMessages = params.messages.filter((m) => m.role !== "system");

  const contents: GoogleContent[] = chatMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: params.temperature ?? 0.7,
    },
  };
  if (system) {
    body.system_instruction = { parts: [{ text: system }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    params.model,
  )}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Google error: ${r.status} ${text}`);
  }
  const data = (await r.json()) as GoogleResponse;
  const textParts = data.candidates?.[0]?.content?.parts || [];
  const content = textParts.map((p) => p.text || "").join("").trim();
  if (!content) throw new Error("The AI response had no content.");
  return content;
}

async function callOpenRouter(params: {
  messages: ChatMessage[];
  model: string;
  apiKey: string;
  temperature?: number;
}): Promise<string> {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": document.title || "ByDamian App",
    },
    body: JSON.stringify({
      model: params.model,
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

function buildMessagesForPrompt(system: string | undefined, prompt: string): ChatMessage[] {
  const baseSystem =
    system ??
    "You are an expert assistant that helps build and improve websites, apps and businesses. Answer with clear steps, actionable guidance, and concise best-practice code snippets when helpful.";
  return [
    { role: "system", content: baseSystem },
    { role: "user", content: prompt },
  ];
}

export async function generateAnswer(req: {
  prompt: string;
  selectedModelLabel: string;
  apiKeys: Record<string, string>;
  system?: string;
  temperature?: number;
}): Promise<string> {
  const { provider, model } = mapLabelToModelId(req.selectedModelLabel);
  const apiKey = req.apiKeys[provider];
  if (!apiKey) throw new Error(`Missing API key for ${provider}.`);

  const messages = buildMessagesForPrompt(req.system, req.prompt);

  switch (provider) {
    case "openai":
      return callOpenAI({ messages, model, apiKey, temperature: req.temperature });
    case "google":
      return callGoogle({ messages, model, apiKey, system: req.system, temperature: req.temperature });
    case "anthropic":
      return callAnthropic({ messages, model, apiKey, system: req.system, temperature: req.temperature });
    case "openrouter":
      return callOpenRouter({ messages, model, apiKey, temperature: req.temperature });
  }
}

export async function generateChat(req: {
  messages: ChatMessage[];
  selectedModelLabel: string;
  apiKeys: Record<string, string>;
  system?: string;
  temperature?: number;
}): Promise<string> {
  const { provider, model } = mapLabelToModelId(req.selectedModelLabel);
  const apiKey = req.apiKeys[provider];
  if (!apiKey) throw new Error(`Missing API key for ${provider}.`);

  const messages = req.system
    ? [{ role: "system", content: req.system } as ChatMessage, ...req.messages.filter((m) => m.role !== "system")]
    : req.messages;

  switch (provider) {
    case "openai":
      return callOpenAI({ messages, model, apiKey, temperature: req.temperature });
    case "google":
      return callGoogle({ messages, model, apiKey, system: req.system, temperature: req.temperature });
    case "anthropic":
      return callAnthropic({ messages, model, apiKey, system: req.system, temperature: req.temperature });
    case "openrouter":
      return callOpenRouter({ messages, model, apiKey, temperature: req.temperature });
  }
}
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
      if (normalized.includes("2.5") && normalized.includes("flash")) {
        return { provider, model: "gemini-2.5-flash" };
      }
      if (normalized.includes("2.5") && normalized.includes("pro")) {
        return { provider, model: "gemini-2.5-pro" };
      }
      return { provider, model: "gemini-2.5-flash" };
    }
    case "openai": {
      if (normalized.includes("o4mini") || normalized.includes("o4-mini")) {
        return { provider, model: "o4-mini" };
      }
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
      return { provider, model: "gpt-4o-mini" };
    }
    case "anthropic": {
      return { provider, model: "claude-3-5-sonnet-latest" };
    }
    case "openrouter": {
      if (normalized.includes("qwen") || normalized.includes("qween")) {
        return { provider, model: "qwen/qwen2.5-coder" };
      }
      if (normalized.includes("deepseek")) {
        return { provider, model: "deepseek/deepseek-chat" };
      }
      return { provider, model: "deepseek/deepseek-chat" };
    }
    default:
      return { provider: "openai", model: "gpt-4o-mini" };
  }
}

/**
 * Small helper to ensure callers always pass an array of messages.
 * Throws a clear error if messages is missing or not an array.
 */
function ensureMessages(messages: unknown): asserts messages is ChatMessage[] {
  if (!Array.isArray(messages)) {
    throw new Error("AI call requires a messages array but none was provided.");
  }
}

/**
 * Helper wrapper for fetch that augments network-level failures (e.g. CORS / failed to fetch)
 * with a clearer, actionable error message. Errors are re-thrown so they bubble up for
 * global handling (we don't swallow them).
 */
async function safeFetch(input: RequestInfo, init?: RequestInit, contextHint?: string): Promise<Response> {
  try {
    const res = await fetch(input, init);
    return res;
  } catch (err) {
    // Network-level error (TypeError: Failed to fetch)
    const hint = contextHint ? ` (${contextHint})` : "";
    throw new Error(
      `Network request failed for ${typeof input === "string" ? input : "resource"}${hint}. ` +
        `This commonly happens when calling third-party APIs directly from the browser due to CORS or connectivity issues. ` +
        `To fix this, either use a server-side proxy (recommended) or an API provider that supports browser requests (e.g. OpenRouter with proper CORS). Original error: ${String(
          err,
        )}`,
    );
  }
}

async function callOpenAI(params: {
  messages: ChatMessage[];
  model: string;
  apiKey: string;
  temperature?: number;
}): Promise<string> {
  // Validate input to avoid runtime map/filter errors
  ensureMessages(params.messages);

  const r = await safeFetch("https://api.openai.com/v1/chat/completions", {
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
  }, "OpenAI Chat API");

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
  ensureMessages(params.messages);

  const system = params.messages.find((m) => m.role === "system")?.content || params.system || "";
  const chatMessages = params.messages.filter((m) => m.role !== "system");
  const mapped = chatMessages.map((m) => ({
    role: m.role,
    content: [{ type: "text", text: m.content }],
  }));

  const r = await safeFetch("https://api.anthropic.com/v1/messages", {
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
  }, "Anthropic API");

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
  ensureMessages(params.messages);

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

  const r = await safeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, "Google Generative Language API");

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
  ensureMessages(params.messages);

  const r = await safeFetch("https://openrouter.ai/api/v1/chat/completions", {
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
  }, "OpenRouter API");

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
  // Validate that messages is an array before using .filter / .map
  ensureMessages(req.messages);

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
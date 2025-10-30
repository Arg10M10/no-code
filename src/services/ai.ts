import type { StoredMessage, ProjectFile } from "@/lib/projects";

export type ChatContent = string | Array<{ type: 'text', text: string } | { type: 'image_url', image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }>;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: ChatContent;
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

const selectionScript = `
<script>
  // ... (selection script content remains the same)
</script>
`;

function mapLabelToModelId(label: string): { provider: ProviderId; model: string } {
  const provider = getProviderFromLabel(label);
  const normalized = label.toLowerCase();

  switch (provider) {
    case "google": {
      if (normalized.includes("2.5") && normalized.includes("flash")) return { provider, model: "gemini-2.5-flash" };
      if (normalized.includes("2.5") && normalized.includes("pro")) return { provider, model: "gemini-2.5-pro" };
      return { provider, model: "gemini-2.5-flash" };
    }
    case "openai": {
      if (normalized.includes("o4mini") || normalized.includes("o4-mini")) return { provider, model: "o4-mini" };
      if (normalized.includes("gpt-5") && normalized.includes("mini")) return { provider, model: "gpt-4o-mini" };
      if (normalized.includes("gpt-5") && normalized.includes("nano")) return { provider, model: "gpt-4o-mini" };
      if (normalized.includes("gpt-5") && normalized.includes("codex")) return { provider, model: "gpt-4o-mini" };
      if (normalized.includes("gpt-5")) return { provider, model: "gpt-4o" };
      return { provider, model: "gpt-4o-mini" };
    }
    case "anthropic": {
      return { provider, model: "claude-3-5-sonnet-latest" };
    }
    case "openrouter": {
      if (normalized.includes("qwen") || normalized.includes("qween")) return { provider, model: "qwen/qwen2.5-coder" };
      if (normalized.includes("deepseek")) return { provider, model: "deepseek/deepseek-chat" };
      return { provider, model: "deepseek/deepseek-chat" };
    }
    default:
      return { provider: "openai", model: "gpt-4o-mini" };
  }
}

async function callApi(params: { messages: ChatMessage[]; model: string; apiKey: string; provider: ProviderId; system?: string; temperature?: number; signal?: AbortSignal }): Promise<string> {
  const { provider, messages, model, apiKey, system, temperature, signal } = params;
  switch (provider) {
    case "openai": {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, temperature: temperature ?? 0.7, max_tokens: 4096 }),
        signal,
      });
      if (!r.ok) { const text = await r.text(); throw new Error(`OpenAI error: ${r.status} ${text}`); }
      const data = (await r.json()) as OpenAIChatResponse;
      return data.choices?.[0]?.message?.content?.trim() || "";
    }
    case "anthropic": {
      const systemPrompt = messages.find((m) => m.role === "system")?.content || system || "";
      const chatMessages = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: [{ type: "text", text: m.content as string }] }));
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: 4096, system: systemPrompt, messages: chatMessages, temperature: temperature ?? 0.7 }),
        signal,
      });
      if (!r.ok) { const text = await r.text(); throw new Error(`Anthropic error: ${r.status} ${text}`); }
      const data = (await r.json()) as AnthropicResponse;
      return data.content?.[0]?.text?.trim() || "";
    }
    case "google": {
      const systemPrompt = messages.find((m) => m.role === "system")?.content || system || "";
      const contents: GoogleContent[] = messages.filter(m => m.role !== 'system').map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content as string }] }));
      const body: Record<string, unknown> = { contents, generationConfig: { temperature: temperature ?? 0.7 } };
      if (systemPrompt) { body.system_instruction = { parts: [{ text: systemPrompt }] }; }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
      if (!r.ok) { const text = await r.text(); throw new Error(`Google error: ${r.status} ${text}`); }
      const data = (await r.json()) as GoogleResponse;
      return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
    }
    case "openrouter": {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": window.location.origin, "X-Title": document.title || "Framio" },
        body: JSON.stringify({ model, messages, stream: false, temperature: temperature ?? 0.7, max_tokens: 4096 }),
        signal,
      });
      if (!r.ok) { const text = await r.text(); throw new Error(`OpenRouter error: ${r.status} ${text}`); }
      const data = (await r.json()) as OpenRouterChatResponse;
      return data.choices?.[0]?.message?.content?.trim() || "";
    }
  }
}

function buildGenerationMessages(prompt: string, codeContext?: string | null, images?: string[]): ChatMessage[] {
  const commonSystemPrompt = `You are an expert web developer creating a full Vite + React + TypeScript + Tailwind CSS project.
Your response MUST be a single JSON object with this exact structure: { "files": [{ "path": "...", "content": "..." }], "previewHtml": "..." }.
- "files": An array of objects, each representing a file in the project. Include package.json, vite.config.ts, tsconfig.json, tailwind.config.ts, src/main.tsx, src/App.tsx, and src/index.css.
- "previewHtml": A single, standalone HTML string that is a visual representation of the app. It must use the Tailwind CDN (<script src="https://cdn.tailwindcss.com"></script>) and include the selection script just before </body>.
Do NOT include any explanations, comments, or markdown code blocks like \`\`\`json ... \`\`\` around the JSON response.`;

  if (images && images.length > 0) {
    const userContent: ChatContent = [{ type: 'text', text: `Recreate the website from this screenshot. ${prompt}` }];
    images.forEach(url => userContent.push({ type: 'image_url', image_url: { url } }));
    return [{ role: "system", content: commonSystemPrompt }, { role: "user", content: userContent }];
  }

  if (codeContext) {
    const userPrompt = `Based on the current project files, apply the following change: "${prompt}"\n\nHere are the current project files:\n${codeContext}`;
    return [{ role: "system", content: commonSystemPrompt }, { role: "user", content: userPrompt }];
  }

  return [{ role: "system", content: commonSystemPrompt }, { role: "user", content: prompt }];
}

export async function generateAnswer(req: { prompt: string; images?: string[]; selectedModelLabel: string; apiKeys: Record<string, string>; system?: string; temperature?: number; codeContext?: string | null; signal?: AbortSignal; }): Promise<{ files: ProjectFile[], previewHtml: string }> {
  const { provider, model } = mapLabelToModelId(req.selectedModelLabel);
  const apiKey = req.apiKeys[provider];
  if (!apiKey) throw new Error(`Missing API key for ${provider}.`);

  const messages = buildGenerationMessages(req.prompt, req.codeContext, req.images);

  const rawResponse = await callApi({ provider, messages, model, apiKey, temperature: req.temperature, signal: req.signal });

  try {
    // Clean the response string to remove markdown code fences
    let cleanedResponse = rawResponse.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.substring(7).trim();
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3).trim();
    }

    const parsed = JSON.parse(cleanedResponse);
    if (!parsed.files || !parsed.previewHtml) {
      throw new Error("Invalid JSON structure from AI. Missing 'files' or 'previewHtml'.");
    }
    // Basic validation
    if (!Array.isArray(parsed.files) || typeof parsed.previewHtml !== 'string') {
        throw new Error("Invalid data types in AI response.");
    }
    return parsed;
  } catch (e: any) {
    console.error("Failed to parse AI JSON response:", e);
    console.error("Raw AI response:", rawResponse);
    throw new Error(`The AI returned an invalid response that could not be parsed. Details: ${e.message}`);
  }
}

export async function generateChat(req: { messages: StoredMessage[]; selectedModelLabel: string; apiKeys: Record<string, string>; system?: string; temperature?: number; signal?: AbortSignal; }): Promise<string> {
  const { provider, model } = mapLabelToModelId(req.selectedModelLabel);
  const apiKey = req.apiKeys[provider];
  if (!apiKey) throw new Error(`Missing API key for ${provider}.`);
  
  const chatMessages: ChatMessage[] = req.messages.map(msg => {
    if (msg.role === 'user' && msg.images && msg.images.length > 0) {
        const content: ChatContent = [{ type: 'text', text: msg.content }];
        msg.images.forEach(imageUrl => content.push({ type: 'image_url', image_url: { url: imageUrl } }));
        return { role: 'user', content };
    }
    return { role: msg.role, content: msg.content };
  });

  const messagesWithSystem = req.system 
    ? [{ role: "system", content: req.system } as ChatMessage, ...chatMessages.filter((m) => m.role !== "system")] 
    : chatMessages;

  return callApi({ provider, messages: messagesWithSystem, model, apiKey, temperature: req.temperature, signal: req.signal });
}
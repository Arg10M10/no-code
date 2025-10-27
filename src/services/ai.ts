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

// This is the script that will be injected into every generated page
// to handle the element selection mode.
const selectionScript = `
<script>
  (function() {
    let isSelectionModeActive = false;
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.border = '2px solid #3b82f6';
    overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    overlay.style.borderRadius = '3px';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'none';
    overlay.style.transition = 'all 50ms ease-out';
    document.body.appendChild(overlay);

    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'toggleSelectionMode') {
        isSelectionModeActive = event.data.payload.isActive;
        if (!isSelectionModeActive) {
          hideOverlay();
        }
      }
    });

    const showOverlay = (target) => {
      if (!target || target === document.body || target === document.documentElement || target === overlay) return;
      const rect = target.getBoundingClientRect();
      overlay.style.display = 'block';
      overlay.style.width = \`\${rect.width}px\`;
      overlay.style.height = \`\${rect.height}px\`;
      overlay.style.top = \`\${rect.top + window.scrollY}px\`;
      overlay.style.left = \`\${rect.left + window.scrollX}px\`;
    };

    const hideOverlay = () => {
      overlay.style.display = 'none';
    };

    const getElementDescription = (element) => {
      let description = element.tagName.toLowerCase();
      if (element.id) {
        description += \`#\${element.id}\`;
      }
      if (element.className && typeof element.className === 'string') {
        description += \`.\${element.className.split(' ').filter(Boolean).join('.')}\`;
      }
      const textContent = element.textContent?.trim();
      if (textContent) {
        description += \` with text "\${textContent.substring(0, 40)}\${textContent.length > 40 ? '...' : ''}"\`;
      }
      return description;
    };

    const handleMouseOver = (e) => {
      if (isSelectionModeActive) {
        showOverlay(e.target);
      }
    };

    const handleClick = (e) => {
      if (isSelectionModeActive) {
        e.preventDefault();
        e.stopPropagation();
        const description = getElementDescription(e.target);
        window.parent.postMessage({ type: 'elementSelected', payload: { description } }, '*');
        isSelectionModeActive = false;
        hideOverlay();
      } else {
        // When not in selection mode, prevent navigation from links or form submissions from buttons
        const link = e.target.closest('a[href]');
        const button = e.target.closest('button, input[type="submit"], input[type="button"]');
        
        if (link || button) {
          e.preventDefault();
          e.stopPropagation();
          console.warn('Preview Mode: Navigation and button actions are disabled.');
        }
      }
    };
    
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick, true);
  })();
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

async function callOpenAI(params: { messages: ChatMessage[]; model: string; apiKey: string; temperature?: number; }): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${params.apiKey}` },
    body: JSON.stringify({ model: params.model, messages: params.messages, temperature: params.temperature ?? 0.7 }),
  });
  if (!r.ok) { const text = await r.text(); throw new Error(`OpenAI error: ${r.status} ${text}`); }
  const data = (await r.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("The AI response had no content.");
  return content;
}

async function callAnthropic(params: { messages: ChatMessage[]; model: string; apiKey: string; system?: string; temperature?: number; }): Promise<string> {
  const system = params.messages.find((m) => m.role === "system")?.content || params.system || "";
  const chatMessages = params.messages.filter((m) => m.role !== "system");
  const mapped = chatMessages.map((m) => ({ role: m.role, content: [{ type: "text", text: m.content }] }));
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": params.apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: params.model, max_tokens: 4096, system, messages: mapped, temperature: params.temperature ?? 0.7 }),
  });
  if (!r.ok) { const text = await r.text(); throw new Error(`Anthropic error: ${r.status} ${text}`); }
  const data = (await r.json()) as AnthropicResponse;
  const content = data.content?.[0]?.text?.trim();
  if (!content) throw new Error("The AI response had no content.");
  return content;
}

async function callGoogle(params: { messages: ChatMessage[]; model: string; apiKey: string; system?: string; temperature?: number; }): Promise<string> {
  const system = params.messages.find((m) => m.role === "system")?.content || params.system || "";
  const chatMessages = params.messages.filter((m) => m.role !== "system");
  const contents: GoogleContent[] = chatMessages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const body: Record<string, unknown> = { contents, generationConfig: { temperature: params.temperature ?? 0.7 } };
  if (system) { body.system_instruction = { parts: [{ text: system }] }; }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) { const text = await r.text(); throw new Error(`Google error: ${r.status} ${text}`); }
  const data = (await r.json()) as GoogleResponse;
  const textParts = data.candidates?.[0]?.content?.parts || [];
  const content = textParts.map((p) => p.text || "").join("").trim();
  if (!content) throw new Error("The AI response had no content.");
  return content;
}

async function callOpenRouter(params: { messages: ChatMessage[]; model: string; apiKey: string; temperature?: number; }): Promise<string> {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${params.apiKey}`, "HTTP-Referer": window.location.origin, "X-Title": document.title || "ByDamian App" },
    body: JSON.stringify({ model: params.model, messages: params.messages, stream: false, temperature: params.temperature ?? 0.7 }),
  });
  if (!r.ok) { const text = await r.text(); throw new Error(`OpenRouter error: ${r.status} ${text}`); }
  const data = (await r.json()) as OpenRouterChatResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("The AI response had no content.");
  return content;
}

function buildGenerationMessages(prompt: string, system?: string, codeContext?: string | null): ChatMessage[] {
  if (codeContext) {
    // Editing existing code
    const systemPrompt = system ?? `You are an expert web developer. Your task is to modify the provided HTML code based on the user's request.
RULES:
1.  You will be given the user's modification request and the full current HTML.
2.  You MUST respond with ONLY the complete, modified HTML file.
3.  The response MUST start with \`<!DOCTYPE html>\` and end with \`</html>\`.
4.  Do NOT include any explanations, comments, or markdown code blocks like \`\`\`html ... \`\`\` around the code.
5.  Ensure all necessary scripts (like Tailwind CDN and the selection script) are preserved in the final output.`;
    
    const userPrompt = `Based on the current HTML code, apply the following change: "${prompt}"

Here is the current HTML code:
\`\`\`html
${codeContext}
\`\`\``;

    return [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
  } else {
    // Generating new code from scratch
    const systemPrompt = system ?? `You are an expert web developer. Your task is to generate a complete, standalone HTML file based on the user's prompt.
RULES:
1.  ALWAYS respond with a single, complete HTML file.
2.  The response MUST start with \`<!DOCTYPE html>\` and end with \`</html>\`.
3.  Do NOT include any explanations, comments, or markdown code blocks like \`\`\`html ... \`\`\` around the code. The response must be ONLY the HTML code itself.
4.  Use Tailwind CSS for styling. Include the Tailwind CDN script in the \`<head>\`: \`<script src="https://cdn.tailwindcss.com"></script>\`.
5.  Create a visually appealing, modern, and dark-themed design unless specified otherwise.
6.  ALWAYS include the following script tag just before the closing \`</body>\` tag: ${selectionScript}`;
    
    return [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];
  }
}

export async function generateAnswer(req: { prompt: string; selectedModelLabel: string; apiKeys: Record<string, string>; system?: string; temperature?: number; codeContext?: string | null; }): Promise<string> {
  const { provider, model } = mapLabelToModelId(req.selectedModelLabel);
  const apiKey = req.apiKeys[provider];
  if (!apiKey) throw new Error(`Missing API key for ${provider}.`);
  const messages = buildGenerationMessages(req.prompt, req.system, req.codeContext);
  switch (provider) {
    case "openai": return callOpenAI({ messages, model, apiKey, temperature: req.temperature });
    case "google": return callGoogle({ messages, model, apiKey, system: req.system, temperature: req.temperature });
    case "anthropic": return callAnthropic({ messages, model, apiKey, system: req.system, temperature: req.temperature });
    case "openrouter": return callOpenRouter({ messages, model, apiKey, temperature: req.temperature });
  }
}

export async function generateChat(req: { messages: ChatMessage[]; selectedModelLabel: string; apiKeys: Record<string, string>; system?: string; temperature?: number; }): Promise<string> {
  const { provider, model } = mapLabelToModelId(req.selectedModelLabel);
  const apiKey = req.apiKeys[provider];
  if (!apiKey) throw new Error(`Missing API key for ${provider}.`);
  const messages = req.system ? [{ role: "system", content: req.system } as ChatMessage, ...req.messages.filter((m) => m.role !== "system")] : req.messages;
  switch (provider) {
    case "openai": return callOpenAI({ messages, model, apiKey, temperature: req.temperature });
    case "google": return callGoogle({ messages, model, apiKey, system: req.system, temperature: req.temperature });
    case "anthropic": return callAnthropic({ messages, model, apiKey, system: req.system, temperature: req.temperature });
    case "openrouter": return callOpenRouter({ messages, model, apiKey, temperature: req.temperature });
  }
}
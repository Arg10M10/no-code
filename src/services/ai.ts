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
    // Append to body once it exists
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        document.body.appendChild(overlay);
      }
    });

    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'toggleSelectionMode') {
        isSelectionModeActive = event.data.payload.isActive;
        if (!isSelectionModeActive) {
          hideOverlay();
        }
      }
    });

    const showOverlay = (target) => {
      if (!target || !document.body.contains(target) || target === overlay) return;
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

    const handleInteraction = (e) => {
      if (isSelectionModeActive) {
        // In selection mode, every click is for selection
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const description = getElementDescription(e.target);
        window.parent.postMessage({ type: 'elementSelected', payload: { description } }, '*');
        isSelectionModeActive = false;
        hideOverlay();
      } else {
        // Not in selection mode, prevent default actions for links and forms
        const link = e.target.closest('a[href]');
        const button = e.target.closest('button, input[type="submit"], input[type="button"]');
        
        if (link || button || e.type === 'submit') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.warn('Preview Mode: Navigation and actions are disabled.');
        }
      }
    };

    const handleMouseOver = (e) => {
      if (isSelectionModeActive) {
        showOverlay(e.target);
      }
    };
    
    document.addEventListener('click', handleInteraction, true);
    document.addEventListener('submit', handleInteraction, true);
    document.addEventListener('mouseover', handleMouseOver, true);
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

async function streamResponse(
  url: string,
  options: RequestInit,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) {
  try {
    const response = await fetch(url, options);
    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.substring(6);
          if (data.trim() === "[DONE]") {
            onComplete();
            return;
          }
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Ignore parsing errors for incomplete JSON
          }
        }
      }
    }
    onComplete();
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      onError(error);
    }
  }
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

export async function streamAnswer(req: {
  prompt: string;
  selectedModelLabel: string;
  apiKeys: Record<string, string>;
  system?: string;
  temperature?: number;
  codeContext?: string | null;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}): Promise<void> {
  const { provider, model } = mapLabelToModelId(req.selectedModelLabel);
  const apiKey = req.apiKeys[provider];
  if (!apiKey) {
    req.onError(new Error(`Missing API key for ${provider}.`));
    return;
  }
  const messages = buildGenerationMessages(req.prompt, req.system, req.codeContext);

  const url = "https://openrouter.ai/api/v1/chat/completions";
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": window.location.origin, "X-Title": document.title || "Brimy" },
    body: JSON.stringify({ model, messages, stream: true, temperature: req.temperature ?? 0.7 }),
    signal: req.signal,
  };

  await streamResponse(url, options, req.onChunk, req.onComplete, req.onError);
}

export async function streamChat(req: {
  messages: ChatMessage[];
  selectedModelLabel: string;
  apiKeys: Record<string, string>;
  system?: string;
  temperature?: number;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}): Promise<void> {
  const { provider, model } = mapLabelToModelId(req.selectedModelLabel);
  const apiKey = req.apiKeys[provider];
  if (!apiKey) {
    req.onError(new Error(`Missing API key for ${provider}.`));
    return;
  }
  const messages = req.system ? [{ role: "system", content: req.system } as ChatMessage, ...req.messages.filter((m) => m.role !== "system")] : req.messages;
  
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": window.location.origin, "X-Title": document.title || "Brimy" },
    body: JSON.stringify({ model, messages, stream: true, temperature: req.temperature ?? 0.7 }),
    signal: req.signal,
  };

  await streamResponse(url, options, req.onChunk, req.onComplete, req.onError);
}
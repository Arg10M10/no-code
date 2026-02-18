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

// Mapa de modelos (simplificado para ahorrar espacio, la lógica es la misma)
function mapLabelToModelId(label: string): { provider: ProviderId; model: string } {
  const provider = getProviderFromLabel(label);
  const normalized = label.toLowerCase();
  
  if (provider === "openai") {
    if (normalized.includes("gpt-5.2")) return { provider, model: "gpt-5.2" };
    if (normalized.includes("gpt-5.1")) return { provider, model: "gpt-5.1" };
    if (normalized.includes("mini")) return { provider, model: "gpt-5-mini" };
    if (normalized.includes("codex")) return { provider, model: "gpt-5-codex" };
    return { provider, model: "gpt-5" };
  }
  if (provider === "google") {
    if (normalized.includes("3 flash")) return { provider, model: "gemini-3-flash" };
    return { provider, model: "gemini-3-pro" };
  }
  if (provider === "anthropic") {
    if (normalized.includes("opus")) return { provider, model: "claude-4.5-opus" };
    return { provider, model: "claude-4.5-sonnet" };
  }
  if (provider === "openrouter") {
    if (normalized.includes("kimi")) return { provider, model: "moonshot/kimi-k2.5" };
    if (normalized.includes("deepseek")) return { provider, model: "deepseek/deepseek-v3.1" };
    return { provider, model: "qwen/qwen-3-coder" };
  }
  return { provider: "openai", model: "gpt-5" };
}

/**
 * Parsea eventos Server-Sent Events (SSE) simples.
 * Usado por OpenAI, OpenRouter y Anthropic.
 */
async function streamReader(
  response: Response, 
  onChunk: (chunk: string) => void,
  provider: ProviderId
) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return "";

  let accumulatedText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    
    // Procesamiento básico de SSE
    const lines = chunk.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;

      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          // OpenAI / OpenRouter format
          if (json.choices?.[0]?.delta?.content) {
            const text = json.choices[0].delta.content;
            accumulatedText += text;
            onChunk(text);
          }
        } catch (e) {
          // Ignorar chunks corruptos
        }
      } else if (provider === "anthropic" && trimmed.startsWith("event: content_block_delta")) {
         // Anthropic manda evento, luego data.
         // Esto es simplificado, en una implementación robusta se debe leer la siguiente línea 'data:'
      } else if (provider === "anthropic" && trimmed.startsWith("data: ")) {
         try {
           const json = JSON.parse(trimmed.slice(6));
           if (json.type === "content_block_delta" && json.delta?.text) {
             const text = json.delta.text;
             accumulatedText += text;
             onChunk(text);
           }
         } catch {}
      }
    }
  }
  return accumulatedText;
}

// Google tiene su propio formato raro, para simplificar usaremos non-streaming para Google
// o implementaremos un lector básico si el usuario insiste. Por ahora, fallback a fetch normal si es Google.

async function callApi(params: { 
  messages: ChatMessage[]; 
  model: string; 
  apiKey: string; 
  provider: ProviderId; 
  system?: string; 
  temperature?: number; 
  signal?: AbortSignal;
  onProgress?: (fullText: string) => void; 
}): Promise<string> {
  const { provider, messages, model, apiKey, system, temperature, signal, onProgress } = params;

  // Manejo especial para streaming
  const isStreaming = !!onProgress && provider !== "google"; 

  if (provider === "openai" || provider === "openrouter") {
    const r = await fetch(provider === "openai" ? "https://api.openai.com/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, ...(provider === "openrouter" ? {"HTTP-Referer": window.location.origin, "X-Title": "Framio"} : {}) },
      body: JSON.stringify({ model, messages, temperature: temperature ?? 0.7, max_tokens: 4096, stream: isStreaming }),
      signal,
    });
    
    if (!r.ok) { const text = await r.text(); throw new Error(`${provider} error: ${r.status} ${text}`); }
    
    if (isStreaming) {
      let fullText = "";
      await streamReader(r, (chunk) => {
        fullText += chunk;
        onProgress?.(fullText);
      }, provider);
      return fullText;
    } else {
      const data = await r.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    }
  }

  if (provider === "anthropic") {
    const systemPrompt = messages.find((m) => m.role === "system")?.content || system || "";
    const chatMessages = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: [{ type: "text", text: m.content as string }] }));
    
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 4096, system: systemPrompt, messages: chatMessages, temperature: temperature ?? 0.7, stream: isStreaming }),
      signal,
    });
    
    if (!r.ok) { const text = await r.text(); throw new Error(`Anthropic error: ${r.status} ${text}`); }

    if (isStreaming) {
       let fullText = "";
       await streamReader(r, (chunk) => {
         fullText += chunk;
         onProgress?.(fullText);
       }, provider);
       return fullText;
    } else {
       const data = (await r.json()) as any;
       return data.content?.[0]?.text?.trim() || "";
    }
  }

  // Google (Non-streaming fallback for now due to complex protocol)
  if (provider === "google") {
    const systemPrompt = messages.find((m) => m.role === "system")?.content || system || "";
    const contents = messages.filter(m => m.role !== 'system').map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content as string }] }));
    const body: any = { contents, generationConfig: { temperature: temperature ?? 0.7 } };
    if (systemPrompt) { body.system_instruction = { parts: [{ text: systemPrompt }] }; }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
    if (!r.ok) { const text = await r.text(); throw new Error(`Google error: ${r.status} ${text}`); }
    const data = await r.json();
    return (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("").trim();
  }

  return "";
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

export async function generateAnswer(req: { 
  prompt: string; 
  images?: string[]; 
  selectedModelLabel: string; 
  apiKeys: Record<string, string>; 
  system?: string; 
  temperature?: number; 
  codeContext?: string | null; 
  signal?: AbortSignal; 
  onStatusUpdate?: (status: string) => void;
}): Promise<{ files: ProjectFile[], previewHtml: string }> {
  const { provider, model } = mapLabelToModelId(req.selectedModelLabel);
  const apiKey = req.apiKeys[provider];
  if (!apiKey) throw new Error(`Missing API key for ${provider}.`);

  const messages = buildGenerationMessages(req.prompt, req.codeContext, req.images);

  // Espiar el progreso
  const onProgress = (fullText: string) => {
    if (!req.onStatusUpdate) return;
    
    // Intentar encontrar el último archivo que se está escribiendo
    // Buscamos patrones: "path": "src/..."
    const regex = /"path":\s*"([^"]+)"/g;
    let match;
    let lastFile = null;
    while ((match = regex.exec(fullText)) !== null) {
      lastFile = match[1];
    }
    
    if (lastFile) {
      req.onStatusUpdate(`Generando ${lastFile}...`);
    } else {
      // Si aún no hay archivo, dar feedback genérico basado en longitud
      if (fullText.length < 50) req.onStatusUpdate("Inicializando...");
      else if (fullText.length < 200) req.onStatusUpdate("Estructurando respuesta JSON...");
    }
  };

  const rawResponse = await callApi({ 
    provider, 
    messages, 
    model, 
    apiKey, 
    temperature: req.temperature, 
    signal: req.signal,
    onProgress
  });

  try {
    let cleanedResponse = rawResponse.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.substring(7).trim();
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3).trim();
    }

    // A veces el JSON está incompleto si se corta, intentamos parsear lo que haya
    const parsed = JSON.parse(cleanedResponse);
    if (!parsed.files || !parsed.previewHtml) {
      throw new Error("Invalid JSON structure from AI. Missing 'files' or 'previewHtml'.");
    }
    return parsed;
  } catch (e: any) {
    console.error("Failed to parse AI JSON response:", e);
    throw new Error(`The AI returned an invalid response that could not be parsed. Details: ${e.message}`);
  }
}

export async function generateChat(req: { 
  messages: StoredMessage[]; 
  selectedModelLabel: string; 
  apiKeys: Record<string, string>; 
  system?: string; 
  temperature?: number; 
  signal?: AbortSignal; 
}): Promise<string> {
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
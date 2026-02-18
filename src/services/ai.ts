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

// Mapa de modelos futuristas (2026)
function mapLabelToModelId(label: string): { provider: ProviderId; model: string } {
  const provider = getProviderFromLabel(label);
  const normalized = label.toLowerCase();
  
  if (provider === "openai") {
    if (normalized.includes("gpt-5.2")) return { provider, model: "gpt-5.2" };
    if (normalized.includes("gpt-5.1")) return { provider, model: "gpt-5.1" };
    if (normalized.includes("mini")) return { provider, model: "gpt-5-mini" };
    if (normalized.includes("codex")) return { provider, model: "gpt-5-codex" };
    // Default flagship
    return { provider, model: "gpt-5" };
  }
  
  if (provider === "google") {
    if (normalized.includes("3 flash")) return { provider, model: "gemini-3-flash" };
    if (normalized.includes("3 pro")) return { provider, model: "gemini-3-pro" };
    if (normalized.includes("2.5 flash")) return { provider, model: "gemini-2.5-flash" };
    if (normalized.includes("2.5 pro")) return { provider, model: "gemini-2.5-pro" };
    // Default
    return { provider, model: "gemini-3-pro" };
  }
  
  if (provider === "anthropic") {
    if (normalized.includes("opus 4.5")) return { provider, model: "claude-opus-4.5" };
    if (normalized.includes("sonnet 4.5")) return { provider, model: "claude-sonnet-4.5" };
    if (normalized.includes("sonnet 4")) return { provider, model: "claude-sonnet-4" };
    // Default
    return { provider, model: "claude-sonnet-4.5" };
  }
  
  if (provider === "openrouter") {
    if (normalized.includes("coder")) return { provider, model: "qwen/qwen-3-coder" };
    if (normalized.includes("deepseek")) return { provider, model: "deepseek/deepseek-v3.1" };
    if (normalized.includes("kimi")) return { provider, model: "moonshot/kimi-k2.5" };
    if (normalized.includes("devstral")) return { provider, model: "mistral/devstral-2" };
    if (normalized.includes("glm")) return { provider, model: "zhipu/glm-4.7" };
    // Default fallback
    return { provider, model: "deepseek/deepseek-v3.1" };
  }
  
  return { provider: "openai", model: "gpt-5" };
}

/**
 * Parsea eventos Server-Sent Events (SSE) simples con buffering para chunks incompletos.
 */
async function streamReader(
  response: Response, 
  onChunk: (chunk: string) => void,
  provider: ProviderId
) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return "";

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    
    // Guardamos la última línea en el buffer porque puede estar incompleta
    buffer = lines.pop() || ""; 

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;

      if (trimmed.startsWith("data: ")) {
        try {
          const jsonStr = trimmed.slice(6);
          const json = JSON.parse(jsonStr);
          
          if (provider === "anthropic") {
             if (json.type === "content_block_delta" && json.delta?.text) {
               onChunk(json.delta.text);
             }
          } else {
             // OpenAI / OpenRouter
             if (json.choices?.[0]?.delta?.content) {
               onChunk(json.choices[0].delta.content);
             }
          }
        } catch (e) {
          // Ignoramos errores de parseo en líneas individuales (ping, etc)
        }
      } 
    }
  }
}

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
  
  // Enable streaming for OpenAI, Anthropic, OpenRouter. Google REST API requires different endpoint for stream.
  const isStreaming = !!onProgress && provider !== "google"; 

  try {
    if (provider === "openai" || provider === "openrouter") {
      const url = provider === "openai" 
        ? "https://api.openai.com/v1/chat/completions" 
        : "https://openrouter.ai/api/v1/chat/completions";
        
      const headers: Record<string, string> = { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${apiKey}` 
      };
      
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = window.location.origin;
        headers["X-Title"] = "Framio";
      }

      const r = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          model, 
          messages, 
          temperature: temperature ?? 0.7, 
          max_tokens: 4096, 
          stream: isStreaming 
        }),
        signal,
      });
      
      if (!r.ok) { 
        const text = await r.text(); 
        throw new Error(`${provider} error (${r.status}): ${text}`); 
      }
      
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
      const chatMessages = messages.filter((m) => m.role !== "system").map((m) => ({ 
        role: m.role, 
        content: typeof m.content === 'string' ? m.content : (m.content as any)
      }));
      
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
          "content-type": "application/json", 
          "x-api-key": apiKey, 
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true" 
        },
        body: JSON.stringify({ 
          model, 
          max_tokens: 4096, 
          system: systemPrompt, 
          messages: chatMessages, 
          temperature: temperature ?? 0.7, 
          stream: isStreaming 
        }),
        signal,
      });
      
      if (!r.ok) { 
        const text = await r.text(); 
        throw new Error(`Anthropic error (${r.status}): ${text}`); 
      }

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

    if (provider === "google") {
      const systemPrompt = messages.find((m) => m.role === "system")?.content || system || "";
      const contents = messages
        .filter(m => m.role !== 'system')
        .map((m) => ({ 
          role: m.role === "assistant" ? "model" : "user", 
          parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }] 
        }));

      const body: any = { contents, generationConfig: { temperature: temperature ?? 0.7 } };
      if (systemPrompt) { body.system_instruction = { parts: [{ text: systemPrompt }] }; }
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      
      const r = await fetch(url, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(body), 
        signal 
      });
      
      if (!r.ok) { 
        const text = await r.text(); 
        throw new Error(`Google error (${r.status}): ${text}`); 
      }
      const data = await r.json();
      const result = (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("").trim();
      
      // Simulate progress for Google since we're not using streaming endpoint
      onProgress?.(result); 
      return result;
    }

    throw new Error(`Provider ${provider} not supported`);
    
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    if (error.message.includes("Failed to fetch")) {
      throw new Error(`Connection failed. If using OpenAI, this might be a CORS issue. If using Anthropic, ensure headers are allowed.`);
    }
    throw error;
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

  const onProgress = (fullText: string) => {
    if (!req.onStatusUpdate) return;
    
    // Find last file path being written
    const regex = /"path":\s*"([^"]+)"/g;
    let match;
    let lastFile = null;
    while ((match = regex.exec(fullText)) !== null) {
      lastFile = match[1];
    }
    
    // Update active status
    if (lastFile) {
      req.onStatusUpdate(`Writing ${lastFile}...`);
    } else {
      if (fullText.length < 50) req.onStatusUpdate("Thinking...");
      else if (fullText.length < 500) req.onStatusUpdate(`Planning structure (${fullText.length} chars)...`);
      else req.onStatusUpdate(`Generating code (${Math.round(fullText.length / 1024)}KB)...`);
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
  onUpdate?: (fullText: string) => void; 
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

  return callApi({ 
    provider, 
    messages: messagesWithSystem, 
    model, 
    apiKey, 
    temperature: req.temperature, 
    signal: req.signal,
    onProgress: req.onUpdate 
  });
}
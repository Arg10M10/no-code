import { supabase } from "@/integrations/supabase/client";
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
    if (normalized.includes("3 pro")) return { provider, model: "gemini-3-pro" };
    if (normalized.includes("2.5 flash")) return { provider, model: "gemini-2.5-flash" };
    if (normalized.includes("2.5 pro")) return { provider, model: "gemini-2.5-pro" };
    return { provider, model: "gemini-3-pro" };
  }
  
  if (provider === "anthropic") {
    if (normalized.includes("opus 4.5")) return { provider, model: "claude-opus-4.5" };
    if (normalized.includes("sonnet 4.5")) return { provider, model: "claude-sonnet-4.5" };
    if (normalized.includes("sonnet 4")) return { provider, model: "claude-sonnet-4" };
    return { provider, model: "claude-sonnet-4.5" };
  }
  
  if (provider === "openrouter") {
    if (normalized.includes("coder")) return { provider, model: "qwen/qwen-3-coder" };
    if (normalized.includes("deepseek")) return { provider, model: "deepseek/deepseek-v3.1" };
    if (normalized.includes("kimi")) return { provider, model: "moonshot/kimi-k2.5" };
    if (normalized.includes("devstral")) return { provider, model: "mistral/devstral-2" };
    if (normalized.includes("glm")) return { provider, model: "zhipu/glm-4.7" };
    return { provider, model: "deepseek/deepseek-v3.1" };
  }
  
  return { provider: "openai", model: "gpt-5" };
}

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
    
    // Process buffer line by line
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        
        if (!line || line === "data: [DONE]") continue;
        
        if (line.startsWith("data: ")) {
            try {
                const jsonStr = line.slice(6);
                const json = JSON.parse(jsonStr);

                if (provider === "anthropic") {
                    if (json.type === "content_block_delta" && json.delta?.text) {
                        onChunk(json.delta.text);
                    }
                } else if (provider === "google") {
                    // Gemini stream format in proxy
                    if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
                        onChunk(json.candidates[0].content.parts[0].text);
                    }
                } else {
                    // OpenAI / OpenRouter format
                    if (json.choices?.[0]?.delta?.content) {
                        onChunk(json.choices[0].delta.content);
                    }
                }
            } catch (e) {
                // Ignore incomplete JSON chunks
            }
        } else if (provider === "google" && line.startsWith("[") || line.startsWith(",")) {
            // Very rudimentary Gemini handling if raw stream is passed
            // Ideally the backend normalizes this, but for now we rely on the proxy
            // passing 'data: ' lines or raw JSON arrays.
            // If backend passes raw google response, it's messy. 
            // Assuming our Edge Function returns standard SSE or raw body.
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

  try {
    // Usamos Supabase Functions para el backend
    const { data: responseData, error } = await supabase.functions.invoke('generate-code', {
      body: { 
        provider, 
        model, 
        messages, 
        apiKey, 
        system, 
        temperature: temperature ?? 0.7 
      },
      // Importante: responseType 'blob' o 'arraybuffer' a veces ayuda, 
      // pero para streaming necesitamos acceder al body raw.
      // supabase-js v2 'invoke' no expone el reader fácilmente si no es responseType stream (que no siempre existe explícitamente).
      // Workaround: Usar fetch directo a la URL de la función si queremos control total del ReadableStream,
      // pero probemos capturando la respuesta como un objeto Response si es posible.
    });

    if (error) throw error;
    
    // NOTA: supabase.functions.invoke espera JSON por defecto.
    // Para streaming real, a veces es mejor hacer fetch directo a la URL de la función
    // si la librería de cliente intenta parsear el JSON antes de devolver.
    // Vamos a intentar fetch directo a la URL de la función para garantizar streaming.
    
    const functionUrl = `${supabase.supabaseUrl}/functions/v1/generate-code`;
    const headers = {
      "Authorization": `Bearer ${supabase.supabaseKey}`, // Anon key
      "Content-Type": "application/json"
    };

    const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
            provider, 
            model, 
            messages, 
            apiKey, 
            system, 
            temperature: temperature ?? 0.7 
        }),
        signal
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Edge Function Error: ${errText}`);
    }

    let fullText = "";
    await streamReader(response, (chunk) => {
      fullText += chunk;
      onProgress?.(fullText);
    }, provider);

    return fullText;

  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error("AI Service Error:", error);
    throw new Error(`Error conectando con la IA: ${error.message}`);
  }
}

function buildGenerationMessages(prompt: string, codeContext?: string | null, images?: string[]): ChatMessage[] {
  const commonSystemPrompt = `You are an expert web developer creating a full Vite + React + TypeScript + Tailwind CSS project.

IMPORTANTE:
1. First, you MUST explain your plan and reasoning in plain text. **You MUST use the same language as the user's request** (e.g., if the user asks in Spanish, reason in Spanish; if in English, reason in English).
2. After explaining your plan, generate the code in a single JSON block.

Structure your response exactly like this:

[Brief explanation of your plan and reasoning in the user's language...]

\`\`\`json
{ 
  "files": [{ "path": "...", "content": "..." }], 
  "previewHtml": "..." 
}
\`\`\`

- "files": Array of objects, each representing a file in the project. Include package.json, vite.config.ts, tsconfig.json, tailwind.config.ts, src/main.tsx, src/App.tsx, and src/index.css.
- "previewHtml": A single, standalone HTML string that is a visual representation of the app. It must use the Tailwind CDN (<script src="https://cdn.tailwindcss.com"></script>) and include the selection script just before </body>.
`;

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
  onThoughtUpdate?: (thought: string) => void;
}): Promise<{ files: ProjectFile[], previewHtml: string, thoughtProcess?: string }> {
  const { provider, model } = mapLabelToModelId(req.selectedModelLabel);
  const apiKey = req.apiKeys[provider];
  if (!apiKey) throw new Error(`Missing API key for ${provider}.`);

  const messages = buildGenerationMessages(req.prompt, req.codeContext, req.images);

  const onProgress = (fullText: string) => {
    // 1. Separar pensamiento del código JSON
    const jsonStartIndex = fullText.indexOf("```json");
    
    if (jsonStartIndex === -1) {
       // Aún estamos en la fase de pensamiento (streaming)
       const thought = fullText.trim();
       if (thought && req.onThoughtUpdate) {
          req.onThoughtUpdate(thought);
       }
    } else {
       // Hemos empezado a generar código
       if (req.onThoughtUpdate) {
          const thoughtPart = fullText.substring(0, jsonStartIndex).trim();
          req.onThoughtUpdate(thoughtPart);
       }
       
       if (req.onStatusUpdate) {
         // Analizar JSON parcial para detectar archivos en tiempo real
         const jsonPart = fullText.substring(jsonStartIndex);
         const regex = /"path":\s*"([^"]+)"/g;
         let match;
         let lastFile = null;
         
         while ((match = regex.exec(jsonPart)) !== null) {
            lastFile = match[1];
         }
         
         if (lastFile) {
            req.onStatusUpdate(`Writing ${lastFile}...`);
         }
       }
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
    let thoughtProcess = "";
    let jsonContent = rawResponse;

    const jsonStartIndex = rawResponse.indexOf("```json");
    if (jsonStartIndex !== -1) {
        thoughtProcess = rawResponse.substring(0, jsonStartIndex).trim();
        jsonContent = rawResponse.substring(jsonStartIndex);
    } else {
        const firstBrace = rawResponse.indexOf("{");
        if (firstBrace !== -1) {
            thoughtProcess = rawResponse.substring(0, firstBrace).trim();
            jsonContent = rawResponse.substring(firstBrace);
        }
    }

    let cleanedResponse = jsonContent.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.substring(7).trim();
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3).trim();
    }
    
    const lastBraceIndex = cleanedResponse.lastIndexOf("}");
    if (lastBraceIndex !== -1) {
        cleanedResponse = cleanedResponse.substring(0, lastBraceIndex + 1);
    }

    const parsed = JSON.parse(cleanedResponse);
    if (!parsed.files || !parsed.previewHtml) {
      throw new Error("Respuesta inválida de la IA. Faltan 'files' o 'previewHtml'.");
    }
    
    return { ...parsed, thoughtProcess };
  } catch (e: any) {
    console.error("Failed to parse AI JSON response:", e);
    throw new Error(`La IA devolvió una respuesta que no se pudo procesar. Intenta de nuevo.`);
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
  if (!apiKey) throw new Error(`Falta la API Key para ${provider}.`);
  
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
    onUpdate: req.onUpdate 
  });
}
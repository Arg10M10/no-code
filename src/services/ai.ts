type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIRequest = {
  prompt: string;
  selectedModelLabel: string; // p.ej. "OpenAI - GPT-5" (mapeamos a un modelo real)
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

// Mapeo simple desde la etiqueta del UI a un modelo soportado por OpenRouter
function mapLabelToModelId(label: string): string {
  const provider = (label.split(" - ")[0] || "").toLowerCase().trim();

  // Defaults razonables por proveedor
  if (provider.includes("openai")) return "openai/gpt-4o-mini";
  if (provider.includes("google")) return "google/gemini-1.5-flash-8b";
  if (provider.includes("anthropic")) return "anthropic/claude-3.5-sonnet";
  if (provider.includes("openrouter")) return "deepseek/deepseek-chat";

  // Fallback
  return "openai/gpt-4o-mini";
}

export async function generateAnswer(req: AIRequest): Promise<string> {
  const model = mapLabelToModelId(req.selectedModelLabel);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        req.system ??
        "Eres un asistente experto que ayuda a construir y mejorar webs, apps y negocios. Responde con ejemplos claros, pasos accionables y, si procede, fragmentos de código concisos con buenas prácticas.",
    },
    { role: "user", content: req.prompt },
  ];

  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.openRouterApiKey}`,
      // Campos recomendados por OpenRouter (opcional, pero útiles)
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
  if (!content) throw new Error("La respuesta de la IA no contenía contenido.");

  return content;
}
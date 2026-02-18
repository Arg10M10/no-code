const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { provider, model, messages, apiKey, temperature, system } = await req.json();

    if (!apiKey) {
      throw new Error('Missing API Key');
    }

    let url = '';
    let body = {};
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    if (provider === 'openai' || provider === 'openrouter') {
      url = provider === 'openai' 
        ? 'https://api.openai.com/v1/chat/completions' 
        : 'https://openrouter.ai/api/v1/chat/completions';
      
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://framio.app';
        headers['X-Title'] = 'Framio';
      }

      body = {
        model,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: 4096, // Reduced slightly to be safe
        stream: true,
      };
    } else if (provider === 'anthropic') {
      url = 'https://api.anthropic.com/v1/messages';
      headers = {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      
      const systemPrompt = messages.find((m: any) => m.role === 'system')?.content || system || "";
      const chatMessages = messages
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({ 
          role: m.role, 
          content: m.content 
        }));

      body = {
        model,
        messages: chatMessages,
        system: systemPrompt,
        max_tokens: 4096,
        temperature: temperature ?? 0.7,
        stream: true,
      };
    } else if (provider === 'google') {
       url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;
       // Google API uses key in URL, remove auth header
       delete headers['Authorization'];

       const systemPrompt = messages.find((m: any) => m.role === 'system')?.content || system || "";
       const contents = messages
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({ 
          role: m.role === "assistant" ? "model" : "user", 
          parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }] 
        }));

       body = {
         contents,
         generationConfig: { temperature: temperature ?? 0.7 },
         system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined
       };
    } else {
      throw new Error(`Provider ${provider} not supported.`);
    }

    // Proxy the request to the AI provider
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Provider Error (${provider}):`, errText);
      throw new Error(`Provider API Error: ${response.status} - ${errText}`);
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
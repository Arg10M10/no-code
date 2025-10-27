import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

type WebResult = {
  title: string
  text: string
  url: string
  image?: string | null
}

async function searchDuckDuckGo(query: string) {
  const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
  const res = await fetch(ddgUrl, { headers: { "Accept": "application/json" }})
  if (!res.ok) {
    throw new Error(`DuckDuckGo respondió ${res.status}`)
  }
  const data = await res.json()
  return data
}

async function wikipediaSummary(url: string): Promise<{ image?: string | null } | null> {
  try {
    const m = url.match(/https?:\/\/(.*\.)?wikipedia\.org\/wiki\/([^#?]+)/i)
    if (!m) return null
    const title = decodeURIComponent(m[2])
    const api = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    const r = await fetch(api, { headers: { "Accept": "application/json" }})
    if (!r.ok) return null
    const j = await r.json()
    const image = j?.thumbnail?.source ?? null
    return { image }
  } catch {
    return null
  }
}

function flattenRelated(related: any[]): any[] {
  const out: any[] = []
  for (const item of related ?? []) {
    if (item.Topics && Array.isArray(item.Topics)) {
      out.push(...item.Topics)
    } else {
      out.push(item)
    }
  }
  return out
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query } = await req.json().catch(() => ({}))
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Falta el parámetro 'query'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const ddg = await searchDuckDuckGo(query)

    const results: WebResult[] = []
    const heading = ddg?.Heading
    const abstract = ddg?.Abstract
    const abstractURL = ddg?.AbstractURL
    const image = ddg?.Image ? `https://duckduckgo.com${ddg.Image}` : null

    if (abstract && abstractURL) {
      results.push({
        title: heading || "Resultado principal",
        text: abstract,
        url: abstractURL,
        image,
      })
    }

    const related = flattenRelated(ddg?.RelatedTopics || [])
    for (const r of related.slice(0, 5)) {
      const text = r.Text || ""
      const firstURL = r.FirstURL || ""
      let img: string | null = null
      const wiki = await wikipediaSummary(firstURL)
      if (wiki?.image) img = wiki.image
      results.push({
        title: text.split(" - ")[0] || "Resultado",
        text,
        url: firstURL,
        image: img,
      })
    }

    return new Response(JSON.stringify({ query, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error)?.message || "Error en búsqueda" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
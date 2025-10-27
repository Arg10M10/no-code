const SUPABASE_PROJECT_ID = "xkcnbvcjzezhjaoxojsv";
// Anon key pública del entorno (solo para invocar la función); no usar service_role aquí.
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY25idmNqemV6aGphb3hvanN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzA2NzQsImV4cCI6MjA3NzE0NjY3NH0.I6xsD0LHiOsuas5VaxU3killUr_aRDx3Xi57WvXeGlc";

export type WebResult = {
  title: string;
  text: string;
  url: string;
  image?: string | null;
};

export async function webSearch(query: string): Promise<WebResult[]> {
  const endpoint = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/web-search`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Error ${res.status}`);
  }
  const data = await res.json();
  return data?.results ?? [];
}
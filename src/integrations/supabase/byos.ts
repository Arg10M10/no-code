import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type BYOSConfig = {
  url: string;
  anonKey: string;
};

const STORAGE_KEY = 'byos.supabase.config';
let cachedClient: SupabaseClient | null = null;

export function getConfig(): BYOSConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const cfg = JSON.parse(raw) as BYOSConfig;
    return cfg?.url && cfg?.anonKey ? cfg : null;
  } catch {
    return null;
  }
}

export function setConfig(cfg: BYOSConfig) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  cachedClient = createClient(cfg.url.replace(/\/$/, ''), cfg.anonKey);
}

export function clearConfig() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  cachedClient = null;
}

export function isConnected(): boolean {
  return !!getConfig();
}

export function getClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const cfg = getConfig();
  if (!cfg) return null;
  cachedClient = createClient(cfg.url.replace(/\/$/, ''), cfg.anonKey);
  return cachedClient;
}

export async function testConnection(url: string, anonKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const base = url.replace(/\/$/, '');
    const res = await fetch(`${base}/auth/v1/settings`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    // If we got settings, the URL and anon key are valid and reachable
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Unknown error' };
  }
}
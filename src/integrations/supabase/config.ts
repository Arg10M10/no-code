import { storage } from "@/lib/storage";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

const STORAGE_KEY = "supabase-config";

export function getSupabaseConfig(): SupabaseConfig | null {
  const cfg = storage.getJSON<SupabaseConfig | null>(STORAGE_KEY, null);
  if (!cfg || !cfg.url || !cfg.anonKey) return null;
  return cfg;
}

export function setSupabaseConfig(config: SupabaseConfig) {
  storage.setJSON<SupabaseConfig>(STORAGE_KEY, {
    url: config.url.trim(),
    anonKey: config.anonKey.trim(),
  });
}

export function clearSupabaseConfig() {
  storage.remove(STORAGE_KEY);
}

export function isSupabaseConfigured(): boolean {
  const cfg = getSupabaseConfig();
  return !!(cfg && cfg.url && cfg.anonKey);
}
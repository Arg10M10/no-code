export const storage = {
  getJSON<T = unknown>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  setJSON<T = unknown>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string) {
    localStorage.removeItem(key);
  },
};

// New functions for local API key storage
const LOCAL_STORAGE_API_KEYS_KEY = "local-api-keys";

export function getApiKeysFromLocalStorage(): Record<string, string> {
  return storage.getJSON<Record<string, string>>(LOCAL_STORAGE_API_KEYS_KEY, {});
}

export function setApiKeyInLocalStorage(providerId: string, apiKey: string) {
  const currentKeys = getApiKeysFromLocalStorage();
  storage.setJSON(LOCAL_STORAGE_API_KEYS_KEY, { ...currentKeys, [providerId]: apiKey });
}

export function removeApiKeyFromLocalStorage(providerId: string) {
  const currentKeys = getApiKeysFromLocalStorage();
  delete currentKeys[providerId];
  storage.setJSON(LOCAL_STORAGE_API_KEYS_KEY, currentKeys);
}
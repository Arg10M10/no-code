"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

// Define the structure for a provider
interface Provider {
  id: string;
  name: string;
  key: string;
  placeholder: string;
}

// Initial list of providers
const initialProviders: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    key: "OPENAI_API_KEY",
    placeholder: "sk-...",
  },
  {
    id: "google",
    name: "Google Gemini",
    key: "GEMINI_API_KEY",
    placeholder: "AIza...",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    key: "ANTHROPIC_API_KEY",
    placeholder: "sk-ant-...",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    key: "OPENROUTER_API_KEY",
    placeholder: "sk-or-...",
  },
];

// Utility function to get initials
const getInitials = (name: string) => {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export function ApiKeySettings() {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    // Load existing keys from localStorage or initialize empty
    const keys: Record<string, string> = {};
    initialProviders.forEach((p) => {
      keys[p.key] = localStorage.getItem(p.key) || "";
    });
    return keys;
  });

  const handleSave = (keyName: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [keyName]: value }));
    localStorage.setItem(keyName, value);
  };

  const handleRemove = (keyName: string) => {
    setApiKeys((prev) => ({ ...prev, [keyName]: "" }));
    localStorage.removeItem(keyName);
  };

  const isKeySet = (keyName: string) => !!apiKeys[keyName];

  return (
    <div className="grid gap-4">
      <h3 className="font-medium leading-none">API Keys</h3>
      <div className="grid gap-3">
        {providers.map((provider) => {
          const keyIsSet = isKeySet(provider.key);

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg bg-background"
            >
              <div className="flex items-center gap-3">
                {/* Display initials instead of logo component */}
                <div
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold",
                    keyIsSet ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {getInitials(provider.name)}
                </div>
                
                <div className="grid gap-1">
                  <Label htmlFor={provider.id}>{provider.name}</Label>
                  <p className="text-sm text-muted-foreground">
                    {provider.key}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Input
                    id={provider.id}
                    type="password"
                    placeholder={provider.placeholder}
                    value={apiKeys[provider.key] || ""}
                    onChange={(e) =>
                      setApiKeys((prev) => ({
                        ...prev,
                        [provider.key]: e.target.value,
                      }))
                    }
                    className={cn(
                      "pr-10",
                      keyIsSet && "border-green-500 focus-visible:ring-green-500"
                    )}
                  />
                  {keyIsSet && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>

                {keyIsSet ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemove(provider.key)}
                    title={`Remove ${provider.name} API Key`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSave(provider.key, apiKeys[provider.key] || "")}
                    disabled={!apiKeys[provider.key]}
                  >
                    Save
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
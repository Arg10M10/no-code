import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Trash2, ExternalLink } from "lucide-react";
import { storage } from "@/lib/storage";

type Provider = {
  id: 'openai' | 'google' | 'anthropic' | 'openrouter';
  name: string;
  description: string;
  logo: React.ReactNode;
  placeholder: string;
  getApiKeyUrl: string;
  models: string[];
};

const providers: Provider[] = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    description: 'Powering models like GPT-5.', 
    logo: <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-sm text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-400">OA</div>, 
    placeholder: 'sk-...', 
    getApiKeyUrl: 'https://openai.com/api/', 
    models: ['GPT-5.2', 'GPT-5.1', 'GPT-5 Codex', 'GPT-5', 'GPT-5 Mini'] 
  },
  { 
    id: 'google', 
    name: 'Google', 
    description: 'Home of the Gemini family of models.', 
    logo: <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-sm text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-400">G</div>, 
    placeholder: 'AIzaSy...', 
    getApiKeyUrl: 'https://aistudio.google.com/app/api-keys', 
    models: ['Gemini 3 Pro (Preview)', 'Gemini 3 Flash (Preview)', 'Gemini 2.5 Pro', 'Gemini 2.5 Flash'] 
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    description: 'Building reliable, interpretable, and steerable AI systems.', 
    logo: <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-sm text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-400">A</div>, 
    placeholder: 'sk-ant-...', 
    getApiKeyUrl: 'https://console.anthropic.com/login?returnTo=%2F%3F', 
    models: ['Claude Opus 4.5', 'Claude Sonnet 4.5', 'Claude Sonnet 4'] 
  },
  { 
    id: 'openrouter', 
    name: 'OpenRouter', 
    description: 'Access a variety of models through a single API.', 
    logo: <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-sm text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-400">OR</div>, 
    placeholder: 'sk-or-...', 
    getApiKeyUrl: 'https://openrouter.ai/docs/api-reference/overview', 
    models: ['Kimi K2.5', 'Qwen3 Coder', 'Devstral 2', 'GLM 4.7', 'Deepseek v3.1', 'Kimi K2'] 
  },
];

const STORAGE_KEY = "api-keys";

const ApiKeySettings = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [currentKey, setCurrentKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const saved = storage.getJSON<Record<string, string>>(STORAGE_KEY, {});
    setApiKeys(saved);
  }, []);

  const handleManageClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setCurrentKey(apiKeys[provider.id] || "");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (selectedProvider) {
      const next = { ...apiKeys, [selectedProvider.id]: currentKey.trim() };
      setApiKeys(next);
      storage.setJSON(STORAGE_KEY, next);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedProvider) {
      const next = { ...apiKeys };
      delete next[selectedProvider.id];
      setApiKeys(next);
      storage.setJSON(STORAGE_KEY, next);
    }
    setIsDialogOpen(false);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setSelectedProvider(null);
      setCurrentKey("");
    }
    setIsDialogOpen(open);
  }

  return (
    <div className="grid gap-4">
      <h3 className="font-medium leading-none">API Keys</h3>
      <p className="text-xs text-muted-foreground -mt-2">
        To use AI right now, set at least your OpenRouter key. Later we can route OpenAI/Google/Anthropic through a backend.
      </p>
      <div className="grid gap-3">
        {providers.map((provider) => (
          <div key={provider.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 flex items-center justify-center">{provider.logo}</div>
              <span className="font-medium">{provider.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {apiKeys[provider.id] ? (
                <div className="flex items-center gap-2 text-xs text-green-500">
                  <KeyRound className="h-3 w-3" />
                  <span>Active</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Not Configured</span>
              )}
              <Button variant="outline" size="sm" onClick={() => handleManageClick(provider)}>
                Manage
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage {selectedProvider?.name} API Key</DialogTitle>
            <DialogDescription>{selectedProvider?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Available Models (2026)</Label>
              <div className="flex flex-wrap gap-2">
                {selectedProvider?.models.map(model => <Badge key={model} variant="secondary">{model}</Badge>)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Get your API Key</Label>
              <a href={selectedProvider?.getApiKeyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                Go to {selectedProvider?.name} dashboard <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api-key" className="text-right">
                API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                value={currentKey}
                onChange={(e) => setCurrentKey(e.target.value)}
                placeholder={selectedProvider?.placeholder}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <div>
              {selectedProvider && apiKeys[selectedProvider.id] && (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Key
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Key</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeySettings;
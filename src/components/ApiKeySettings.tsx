import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Trash2, ExternalLink, ChevronLeft, Check, Copy } from "lucide-react";
import { storage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Provider = {
  id: 'openai' | 'google' | 'anthropic' | 'openrouter';
  name: string;
  description: string;
  placeholder: string;
  getApiKeyUrl: string;
  models: string[];
  color: string;
};

const providers: Provider[] = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    description: 'Industry standard for reasoning and coding tasks.', 
    placeholder: 'sk-...', 
    getApiKeyUrl: 'https://platform.openai.com/api-keys', 
    models: ['GPT-5', 'GPT-4o'],
    color: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  { 
    id: 'google', 
    name: 'Google', 
    description: 'Large context window and multimodal capabilities.', 
    placeholder: 'AIzaSy...', 
    getApiKeyUrl: 'https://aistudio.google.com/app/api-keys', 
    models: ['Gemini 1.5 Pro', 'Gemini 1.5 Flash'],
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    description: 'Focus on safety and high-quality creative writing.', 
    placeholder: 'sk-ant-...', 
    getApiKeyUrl: 'https://console.anthropic.com/settings/keys', 
    models: ['Claude 3.5 Sonnet', 'Claude 3 Opus'],
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
  },
  { 
    id: 'openrouter', 
    name: 'OpenRouter', 
    description: 'Aggregator providing access to all top models.', 
    placeholder: 'sk-or-...', 
    getApiKeyUrl: 'https://openrouter.ai/keys', 
    models: ['DeepSeek V3', 'Qwen 2.5', 'Llama 3'],
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  },
];

const STORAGE_KEY = "api-keys";

const ApiKeySettings = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [currentKey, setCurrentKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  useEffect(() => {
    const saved = storage.getJSON<Record<string, string>>(STORAGE_KEY, {});
    setApiKeys(saved);
  }, []);

  const handleManageClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setCurrentKey(apiKeys[provider.id] || "");
  };

  const handleBack = () => {
    setSelectedProvider(null);
    setCurrentKey("");
  };

  const handleSave = () => {
    if (selectedProvider) {
      const next = { ...apiKeys, [selectedProvider.id]: currentKey.trim() };
      setApiKeys(next);
      storage.setJSON(STORAGE_KEY, next);
      toast.success(`Key for ${selectedProvider.name} saved successfully.`);
      handleBack();
    }
  };

  const handleDelete = () => {
    if (selectedProvider) {
      const next = { ...apiKeys };
      delete next[selectedProvider.id];
      setApiKeys(next);
      storage.setJSON(STORAGE_KEY, next);
      toast.info(`Key for ${selectedProvider.name} removed.`);
      handleBack();
    }
  };

  if (selectedProvider) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium">Configuring {selectedProvider.name}</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Tutorial / Steps */}
          <div className="space-y-6">
             <div className="rounded-xl border bg-card/50 p-5 space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">How to get your key</h4>
                
                <ol className="space-y-4 text-sm relative border-l border-border/50 ml-2 pl-4">
                    <li className="relative">
                        <div className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <p className="font-medium">Create an account</p>
                        <p className="text-muted-foreground mt-1">
                            Go to the <a href={selectedProvider.getApiKeyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">provider's dashboard <ExternalLink className="h-3 w-3" /></a> and sign up or log in.
                        </p>
                    </li>
                    <li className="relative">
                        <div className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                        <p className="font-medium">Generate a new key</p>
                        <p className="text-muted-foreground mt-1">
                            Look for "API Keys" or "Developers" section. Click "Create new secret key".
                        </p>
                    </li>
                     <li className="relative">
                        <div className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                        <p className="font-medium">Copy and paste</p>
                        <p className="text-muted-foreground mt-1">
                            Copy the key immediately (you won't see it again) and paste it below.
                        </p>
                    </li>
                </ol>
             </div>
             
             <div className="rounded-xl border bg-secondary/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold">Supported Models</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectedProvider.models.map(m => (
                        <Badge key={m} variant="secondary" className="bg-background/80 hover:bg-background border-border/50 text-[10px]">
                            {m}
                        </Badge>
                    ))}
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">+ others</Badge>
                </div>
             </div>
          </div>

          {/* Input Area */}
          <div className="space-y-6">
            <div className="rounded-xl border bg-background p-6 shadow-sm space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="api-key"
                            type="password"
                            value={currentKey}
                            onChange={(e) => setCurrentKey(e.target.value)}
                            placeholder={selectedProvider.placeholder}
                            className="pl-9 font-mono text-sm"
                            autoComplete="off"
                            autoFocus
                        />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        Your key is stored locally in your browser. We never send it to our servers.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button onClick={handleSave} className="w-full">
                        <Check className="h-4 w-4 mr-2" />
                        Save Configuration
                    </Button>
                    {apiKeys[selectedProvider.id] && (
                        <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Key
                        </Button>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6 animate-fade-in">
        <div className="grid gap-4 md:grid-cols-2">
            {providers.map((provider) => {
                const isActive = !!apiKeys[provider.id];
                return (
                    <div 
                        key={provider.id} 
                        className={cn(
                            "group relative flex flex-col justify-between rounded-xl border p-5 transition-all hover:shadow-md cursor-pointer",
                            isActive 
                                ? "bg-background border-primary/30 shadow-[0_0_0_1px_rgba(0,0,0,0)] shadow-primary/10" 
                                : "bg-card border-border hover:border-primary/20"
                        )}
                        onClick={() => handleManageClick(provider)}
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border", provider.color)}>
                                    {provider.name}
                                </div>
                                {isActive && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Connected
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {provider.description}
                            </p>
                        </div>
                        
                        <div className="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0">
                            {isActive ? "Manage Configuration" : "Setup Integration"} <ChevronLeft className="h-3 w-3 rotate-180 ml-1" />
                        </div>
                    </div>
                )
            })}
        </div>
        
        <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-4">
            <h4 className="text-sm font-medium text-blue-500 mb-1">Privacy First</h4>
            <p className="text-xs text-blue-400/80">
                All API keys are encrypted and stored in your browser's Local Storage. 
                They are sent directly from your client to the AI providers (or via a secure proxy for CORS) and never touch our database.
            </p>
        </div>
    </div>
  );
};

export default ApiKeySettings;
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Trash2, ExternalLink, ChevronLeft, Check, ChevronRight, Cloud, AlertCircle, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { storage } from "@/lib/storage"; // Import local storage utility

type Provider = {
  id: 'openai' | 'google' | 'anthropic' | 'openrouter';
  name: string;
  description: string;
  placeholder: string;
  getApiKeyUrl: string;
  models: string[];
};

const providers: Provider[] = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    description: 'Estándar de la industria. Modelos GPT-4o/5.', 
    placeholder: 'sk-...', 
    getApiKeyUrl: 'https://platform.openai.com/api-keys', 
    models: ['GPT-5', 'GPT-4o']
  },
  { 
    id: 'google', 
    name: 'Google', 
    description: 'Familia Gemini. Rápido y multimodal.', 
    placeholder: 'AIzaSy...', 
    getApiKeyUrl: 'https://aistudio.google.com/app/api-keys', 
    models: ['Gemini 1.5 Pro', 'Gemini 1.5 Flash']
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    description: 'Claude 3.5 Sonnet. Excelente para código.', 
    placeholder: 'sk-ant-...', 
    getApiKeyUrl: 'https://console.anthropic.com/settings/keys', 
    models: ['Claude 3.5 Sonnet', 'Claude 3 Opus']
  },
  { 
    id: 'openrouter', 
    name: 'OpenRouter', 
    description: 'Acceso a modelos Open Source (Deepseek, Qwen).', 
    placeholder: 'sk-or-...', 
    getApiKeyUrl: 'https://openrouter.ai/keys', 
    models: ['Deepseek V3', 'Qwen 2.5 Coder']
  },
];

// Key for storing API keys in localStorage
const LOCAL_STORAGE_API_KEYS_KEY = "local-api-keys";

const ApiKeySettings = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [currentKey, setCurrentKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false); // Keep loading state for UI feedback

  useEffect(() => {
    // Load API keys from localStorage on component mount
    const storedKeys = storage.getJSON<Record<string, string>>(LOCAL_STORAGE_API_KEYS_KEY, {});
    setApiKeys(storedKeys);
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
      setLoading(true);
      const updatedKeys = {
          ...apiKeys,
          [selectedProvider.id]: currentKey.trim()
      };
      storage.setJSON(LOCAL_STORAGE_API_KEYS_KEY, updatedKeys);
      setApiKeys(updatedKeys);
      toast.success(`Clave de ${selectedProvider.name} guardada localmente.`);
      handleBack();
      setLoading(false);
    }
  };

  const handleDelete = () => {
     if (selectedProvider) {
        setLoading(true);
        const updatedKeys = { ...apiKeys };
        delete updatedKeys[selectedProvider.id];
        storage.setJSON(LOCAL_STORAGE_API_KEYS_KEY, updatedKeys);
        setApiKeys(updatedKeys);
        toast.info(`Clave de ${selectedProvider.name} eliminada localmente.`);
        handleBack();
        setLoading(false);
     }
  };

  // If a provider is selected, show the input form for that provider
  if (selectedProvider) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium">Configurando {selectedProvider.name}</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Tutorial */}
          <div className="space-y-6">
             <div className="rounded-xl border bg-card/50 p-5 space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Cómo obtener tu clave</h4>
                <ol className="space-y-4 text-sm relative border-l border-border/50 ml-2 pl-4">
                    <li className="relative">
                        <div className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <p className="font-medium">Ir al panel del proveedor</p>
                        <p className="text-muted-foreground mt-1">
                            Visita <a href={selectedProvider.getApiKeyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">su dashboard <ExternalLink className="h-3 w-3" /></a>.
                        </p>
                    </li>
                    <li className="relative">
                        <div className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                        <p className="font-medium">Generar Secret Key</p>
                        <p className="text-muted-foreground mt-1">
                            Crea una nueva API Key y cópiala inmediatamente.
                        </p>
                    </li>
                </ol>
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
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-blue-500/5 p-2 rounded border border-blue-500/10">
                        <Cloud className="h-3 w-3 text-blue-600" />
                        Se almacenará de forma segura en tu navegador.
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button onClick={handleSave} className="w-full" disabled={loading || !currentKey.trim()}>
                        {loading ? "Guardando..." : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Guardar Clave
                            </>
                        )}
                    </Button>
                    {apiKeys[selectedProvider.id] && (
                        <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={loading}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Clave
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
    <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-muted-foreground">Gestiona tus conexiones a proveedores de IA.</p>
            {/* Removed Supabase-specific database setup button */}
        </div>

        {providers.map((provider) => {
            const isActive = !!apiKeys[provider.id];
            return (
                <div 
                    key={provider.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/40 cursor-pointer transition-colors bg-card"
                    onClick={() => handleManageClick(provider)}
                >
                    <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center border",
                          isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"
                        )}>
                           <span className="font-semibold text-xs uppercase">{provider.name.substring(0, 2)}</span>
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{provider.name}</h4>
                              {isActive && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                                  Conectado
                                </Badge>
                              )}
                           </div>
                           <p className="text-xs text-muted-foreground">{provider.description}</p>
                        </div>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )
        })}
        
        {loading && <div className="text-xs text-center text-muted-foreground animate-pulse">Sincronizando claves...</div>}
    </div>
  );
};

export default ApiKeySettings;
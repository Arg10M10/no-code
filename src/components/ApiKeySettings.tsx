import { useState } from "react";
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
import { KeyRound, Trash2 } from "lucide-react";

type Provider = {
  id: 'openai' | 'google' | 'anthropic' | 'openrouter';
  name: string;
  description: string;
  logo: React.ReactNode;
  placeholder: string;
};

const ProviderLogo = ({ children }: { children: React.ReactNode }) => (
  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
    {children}
  </div>
);

const providers: Provider[] = [
  { id: 'openai', name: 'OpenAI', description: 'Powering models like GPT-4.', logo: <ProviderLogo>OA</ProviderLogo>, placeholder: 'sk-...' },
  { id: 'google', name: 'Google', description: 'Home of the Gemini family of models.', logo: <ProviderLogo>G</ProviderLogo>, placeholder: 'AIzaSy...' },
  { id: 'anthropic', name: 'Anthropic', description: 'Building reliable, interpretable, and steerable AI systems.', logo: <ProviderLogo>AN</ProviderLogo>, placeholder: 'sk-ant-...' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Access a variety of models through a single API.', logo: <ProviderLogo>OR</ProviderLogo>, placeholder: 'sk-or-...' },
];

const ApiKeySettings = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [currentKey, setCurrentKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleManageClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setCurrentKey(apiKeys[provider.id] || "");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (selectedProvider) {
      setApiKeys(prev => ({ ...prev, [selectedProvider.id]: currentKey }));
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedProvider) {
      const newKeys = { ...apiKeys };
      delete newKeys[selectedProvider.id];
      setApiKeys(newKeys);
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
      <div className="grid gap-3">
        {providers.map((provider) => (
          <div key={provider.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
            <div className="flex items-center gap-3">
              {provider.logo}
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
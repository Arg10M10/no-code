import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const modelsData = {
  OpenAI: {
    provider: 'GPT-4, GPT-3.5',
    models: ['GPT-4o', 'GPT-4', 'GPT-3.5-Turbo'],
  },
  Google: {
    provider: 'Gemini Pro',
    models: ['Gemini 1.5 Pro', 'Gemini 1.0 Pro'],
  },
  Anthropic: {
    provider: 'Claude 3',
    models: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
  },
  OpenRouter: {
    provider: 'Free models',
    models: ['Llama 3 8B', 'Mistral 7B'],
  },
};

type Provider = keyof typeof modelsData;

interface ModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const ModelsModal: React.FC<ModelsModalProps> = ({ isOpen, onClose, selectedModel, onSelectModel }) => {
  const [view, setView] = useState<'providers' | 'models'>('providers');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [apiKey, setApiKey] = useState('');

  // Reset view when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('providers');
        setSelectedProvider(null);
        setApiKey('');
      }, 300); // Delay to allow for closing animation
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setView('models');
  };

  const handleBack = () => {
    setView('providers');
    setSelectedProvider(null);
  };

  const handleModelSelect = (model: string) => {
    if (selectedProvider) {
      onSelectModel(`${selectedProvider} - ${model}`);
      onClose();
    }
  };

  const renderProviderView = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Select a Provider</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="space-y-3">
        {Object.keys(modelsData).map((providerKey) => {
          const provider = providerKey as Provider;
          return (
            <div
              key={provider}
              onClick={() => handleProviderSelect(provider)}
              className="p-4 border rounded-lg cursor-pointer transition-all duration-200 border-border hover:border-primary/50 hover:bg-secondary"
            >
              <h3 className="font-medium">{provider}</h3>
              <p className="text-sm text-muted-foreground">{modelsData[provider].provider}</p>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderModelsView = () => {
    if (!selectedProvider) return null;
    const providerData = modelsData[selectedProvider];
    const [currentProvider, currentModel] = selectedModel.split(' - ');

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">{selectedProvider} Models</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-4">
          {selectedProvider !== 'OpenRouter' && (
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder={`Enter your ${selectedProvider} API Key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-3">
            {providerData.models.map((model) => (
              <div
                key={model}
                onClick={() => handleModelSelect(model)}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  currentProvider === selectedProvider && currentModel === model
                    ? 'border-primary bg-primary/10 ring-2 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-secondary'
                }`}
              >
                <h3 className="font-medium">{model}</h3>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-background/80 border border-border rounded-xl shadow-lg backdrop-blur-lg animate-fade-in-up">
        {view === 'providers' ? renderProviderView() : renderModelsView()}
      </div>
    </div>
  );
};

export default ModelsModal;
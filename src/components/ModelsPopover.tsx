import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface ModelsPopoverProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const ModelsPopover: React.FC<ModelsPopoverProps> = ({ selectedModel, onSelectModel }) => {
  const [view, setView] = useState<'providers' | 'models'>('providers');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setView('models');
  };

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setView('providers');
    setSelectedProvider(null);
  };

  const handleModelSelect = (model: string) => {
    if (selectedProvider) {
      onSelectModel(`${selectedProvider} - ${model}`);
    }
  };

  const renderProviderView = () => (
    <div className="w-64">
      <div className="p-2 text-center text-sm font-semibold border-b border-border">Select a Provider</div>
      <div className="p-2 space-y-1">
        {Object.keys(modelsData).map((providerKey) => {
          const provider = providerKey as Provider;
          return (
            <div
              key={provider}
              onClick={() => handleProviderSelect(provider)}
              className="p-2 rounded-md cursor-pointer hover:bg-secondary"
            >
              <h3 className="font-medium text-sm">{provider}</h3>
              <p className="text-xs text-muted-foreground">{modelsData[provider].provider}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderModelsView = () => {
    if (!selectedProvider) return null;
    const providerData = modelsData[selectedProvider];
    const [currentProvider, currentModel] = selectedModel.split(' - ');

    return (
      <div className="w-64">
        <div className="flex items-center p-1 border-b border-border">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold text-center flex-grow mr-8">{selectedProvider}</h2>
        </div>
        <div className="p-2 space-y-1">
          {providerData.models.map((model) => (
            <div
              key={model}
              onClick={() => handleModelSelect(model)}
              className={`p-2 rounded-md cursor-pointer text-sm ${
                currentProvider === selectedProvider && currentModel === model
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-secondary'
              }`}
            >
              {model}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return view === 'providers' ? renderProviderView() : renderModelsView();
};

export default ModelsPopover;
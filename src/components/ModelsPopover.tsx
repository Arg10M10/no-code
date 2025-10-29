import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const modelsData = {
  OpenAI: {
    provider: 'OpenAI Models',
    models: ['GPT-5', 'GPT Codex', 'GPT-5 Mini', 'GPT-4o'],
  },
  Google: {
    provider: 'Google Models',
    models: ['Gemini 2.5 Pro', 'Gemini 2.5 Flash'],
  },
  Anthropic: {
    provider: 'Anthropic Models',
    models: ['Claude 4.5 Sonet', 'Claude 4 Sonet', 'Claude 3.7 Sonet', 'Claude 3.5 Sonet', 'Claude 3.5 Haiku'],
  },
  OpenRouter: {
    provider: 'OpenRouter Models',
    models: ['QweenCoder (free)', 'DeepSeek 3.1 (free)', 'Deepseek v3 (free)', 'Kimi K2'],
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
  };

  const handleModelSelect = (model: string) => {
    if (selectedProvider) {
      onSelectModel(`${selectedProvider} - ${model}`);
    }
  };

  const renderProviderView = () => (
    <div>
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
      <div>
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

  return (
    <div className="relative w-64 overflow-hidden">
      <div
        className={cn(
          "transition-transform duration-300 ease-in-out",
          view === 'providers' ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderProviderView()}
      </div>
      <div
        className={cn(
          "absolute top-0 left-0 w-full transition-transform duration-300 ease-in-out",
          view === 'models' ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {renderModelsView()}
      </div>
    </div>
  );
};

export default ModelsPopover;
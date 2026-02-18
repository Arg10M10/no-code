import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Brain, Code, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type ModelInfo = {
  id: string;
  name: string;
  description: string;
  badge?: "New" | "Fast" | "Pro" | "Best" | "Beta";
};

type ProviderData = {
  name: string;
  icon: React.ReactNode;
  models: ModelInfo[];
};

const modelsData: Record<string, ProviderData> = {
  OpenAI: {
    name: "OpenAI",
    icon: <Sparkles className="w-4 h-4" />,
    models: [
      { id: "GPT-5", name: "GPT-5", description: "Flagship model with high reasoning.", badge: "Best" },
      { id: "GPT-5.2", name: "GPT-5.2", description: "Advanced reasoning & coding.", badge: "New" },
      { id: "GPT-5.1", name: "GPT-5.1", description: "Balanced performance." },
      { id: "GPT-5 Codex", name: "GPT-5 Codex", description: "Specialized for programming." },
      { id: "GPT-5 Mini", name: "GPT-5 Mini", description: "Fast and cost-effective.", badge: "Fast" },
    ],
  },
  Google: {
    name: "Google",
    icon: <Brain className="w-4 h-4" />,
    models: [
      { id: "Gemini 3 Pro (Preview)", name: "Gemini 3 Pro", description: "Next-gen multimodal reasoning.", badge: "Beta" },
      { id: "Gemini 3 Flash (Preview)", name: "Gemini 3 Flash", description: "Low latency, high throughput.", badge: "Fast" },
      { id: "Gemini 2.5 Pro", name: "Gemini 2.5 Pro", description: "Solid performance across tasks." },
      { id: "Gemini 2.5 Flash", name: "Gemini 2.5 Flash", description: "Efficient and capable." },
    ],
  },
  Anthropic: {
    name: "Anthropic",
    icon: <Box className="w-4 h-4" />,
    models: [
      { id: "Claude Opus 4.5", name: "Claude Opus 4.5", description: "Most capable model for complex tasks.", badge: "Best" },
      { id: "Claude Sonnet 4.5", name: "Claude Sonnet 4.5", description: "Ideal balance of intelligence & speed.", badge: "New" },
      { id: "Claude Sonnet 4", name: "Claude Sonnet 4", description: "Reliable enterprise workhorse." },
    ],
  },
  OpenRouter: {
    name: "OpenRouter",
    icon: <Code className="w-4 h-4" />,
    models: [
      { id: "Qwen3 Coder", name: "Qwen3 Coder", description: "Top-tier open source coding model.", badge: "Best" },
      { id: "Deepseek v3.1", name: "Deepseek v3.1", description: "Great reasoning capabilities.", badge: "New" },
      { id: "Kimi K2.5", name: "Kimi K2.5", description: "Long context specialist." },
      { id: "Devstral 2", name: "Devstral 2", description: "Optimized for development." },
      { id: "GLM 4.7", name: "GLM 4.7", description: "Bilingual powerhouse." },
    ],
  },
};

type ProviderKey = keyof typeof modelsData;

interface ModelsPopoverProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const ModelsPopover: React.FC<ModelsPopoverProps> = ({ selectedModel, onSelectModel }) => {
  const [activeProvider, setActiveProvider] = useState<ProviderKey>('OpenAI');

  useEffect(() => {
    const provider = selectedModel.split(' - ')[0] as ProviderKey;
    if (modelsData[provider]) {
      setActiveProvider(provider);
    }
  }, []);

  const currentProviderData = modelsData[activeProvider];
  const [currentProviderName, currentModelId] = selectedModel.split(' - ');

  return (
    <div className="flex w-[500px] h-[320px] bg-background text-foreground rounded-lg overflow-hidden border border-border shadow-xl">
      {/* Sidebar - Providers */}
      <div className="w-36 flex flex-col border-r border-border bg-muted/30 p-2 gap-1">
        <div className="px-2 py-2 mb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Providers</span>
        </div>
        {Object.entries(modelsData).map(([key, data]) => {
          const isActive = activeProvider === key;
          return (
            <button
              key={key}
              onClick={() => setActiveProvider(key as ProviderKey)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors duration-200 text-left w-full",
                isActive 
                  ? "bg-background text-foreground font-medium shadow-sm ring-1 ring-border" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center transition-colors", 
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {data.icon}
              </div>
              <span className="truncate">{key}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content - Models */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {currentProviderData.icon}
            </span>
            <span className="font-semibold text-sm">{currentProviderData.name} Models</span>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-2">
          <div className="grid grid-cols-1 gap-1">
            {currentProviderData.models.map((model) => {
              const isSelected = currentProviderName === activeProvider && currentModelId === model.id;
              
              return (
                <button
                  key={model.id}
                  onClick={() => onSelectModel(`${activeProvider} - ${model.id}`)}
                  className={cn(
                    "relative flex items-start gap-3 p-3 rounded-lg text-left transition-colors duration-200 border border-transparent",
                    isSelected 
                      ? "bg-muted border-border" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0",
                    isSelected 
                      ? "border-primary bg-primary text-primary-foreground" 
                      : "border-muted-foreground/30"
                  )}>
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      <span className={cn("text-sm font-medium truncate", isSelected ? "text-foreground" : "text-foreground/90")}>
                        {model.name}
                      </span>
                      {model.badge && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-px rounded-full font-medium border uppercase tracking-wider shrink-0",
                          "bg-muted text-muted-foreground border-border"
                        )}>
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate pr-2">
                      {model.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ModelsPopover;
import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Brain, Code, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Definición de tipos y datos enriquecidos para la UI
type ModelInfo = {
  id: string;
  name: string;
  description: string;
  badge?: "New" | "Fast" | "Pro" | "Best" | "Beta";
};

type ProviderData = {
  name: string;
  icon: React.ReactNode;
  color: string;
  models: ModelInfo[];
};

const modelsData: Record<string, ProviderData> = {
  OpenAI: {
    name: "OpenAI",
    color: "bg-green-500/10 text-green-500",
    icon: <Sparkles className="w-4 h-4" />,
    models: [
      { id: "GPT-5", name: "GPT-5", description: "Flagship model with high reasoning.", badge: "Best" },
      { id: "GPT-5.2", name: "GPT-5.2", description: "Advanced reasoning & coding.", badge: "New" },
      { id: "GPT-5.1", name: "GPT-5.1", description: "Balanced performance.", badge: "Pro" },
      { id: "GPT-5 Codex", name: "GPT-5 Codex", description: "Specialized for programming.", badge: "Pro" },
      { id: "GPT-5 Mini", name: "GPT-5 Mini", description: "Fast and cost-effective.", badge: "Fast" },
    ],
  },
  Google: {
    name: "Google",
    color: "bg-blue-500/10 text-blue-500",
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
    color: "bg-orange-500/10 text-orange-500",
    icon: <Box className="w-4 h-4" />,
    models: [
      { id: "Claude Opus 4.5", name: "Claude Opus 4.5", description: "Most capable model for complex tasks.", badge: "Best" },
      { id: "Claude Sonnet 4.5", name: "Claude Sonnet 4.5", description: "Ideal balance of intelligence & speed.", badge: "New" },
      { id: "Claude Sonnet 4", name: "Claude Sonnet 4", description: "Reliable enterprise workhorse." },
    ],
  },
  OpenRouter: {
    name: "OpenRouter",
    color: "bg-purple-500/10 text-purple-500",
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

  // Determinar el proveedor activo basado en el modelo seleccionado actual
  useEffect(() => {
    const provider = selectedModel.split(' - ')[0] as ProviderKey;
    if (modelsData[provider]) {
      setActiveProvider(provider);
    }
  }, []); // Run once on mount to set initial tab if needed

  const currentProviderData = modelsData[activeProvider];
  const [currentProviderName, currentModelId] = selectedModel.split(' - ');

  return (
    <div className="flex w-[500px] h-[320px] bg-[#0F0F0F] text-foreground rounded-lg overflow-hidden border border-white/10 shadow-2xl">
      {/* Sidebar - Providers */}
      <div className="w-36 flex flex-col border-r border-white/5 bg-black/20 p-2 gap-1">
        <div className="px-2 py-2 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Providers</span>
        </div>
        {Object.entries(modelsData).map(([key, data]) => {
          const isActive = activeProvider === key;
          return (
            <button
              key={key}
              onClick={() => setActiveProvider(key as ProviderKey)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 text-left w-full group",
                isActive 
                  ? "bg-secondary text-foreground font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1 rounded-md transition-colors", 
                isActive ? data.color : "bg-white/5 group-hover:bg-white/10"
              )}>
                {data.icon}
              </div>
              <span className="truncate">{key}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content - Models */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/50">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/2">
          <div className="flex items-center gap-2">
            <span className={cn("p-1 rounded-md", currentProviderData.color)}>
              {currentProviderData.icon}
            </span>
            <span className="font-semibold text-sm">{currentProviderData.name} Models</span>
          </div>
          <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            2026 Edition
          </span>
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
                    "relative flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 border border-transparent group",
                    isSelected 
                      ? "bg-primary/10 border-primary/20 shadow-sm" 
                      : "hover:bg-white/5 hover:border-white/5"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                    isSelected 
                      ? "border-primary bg-primary text-primary-foreground" 
                      : "border-white/20 group-hover:border-white/40"
                  )}>
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("text-sm font-medium truncate", isSelected ? "text-primary" : "text-foreground")}>
                        {model.name}
                      </span>
                      {model.badge && (
                        <span className={cn(
                          "text-[9px] px-1.5 py-px rounded-full font-medium border uppercase tracking-wider",
                          model.badge === "Best" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                          model.badge === "New" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                          model.badge === "Fast" && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                          model.badge === "Pro" && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                          model.badge === "Beta" && "bg-pink-500/10 text-pink-500 border-pink-500/20",
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
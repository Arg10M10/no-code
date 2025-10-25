import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const models = [
  { name: 'OpenAI', provider: 'GPT-4, GPT-3.5' },
  { name: 'Google', provider: 'Gemini Pro' },
  { name: 'Anthropic', provider: 'Claude 3 Sonnet' },
  { name: 'OpenRouter', provider: 'Free models' },
];

interface ModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const ModelsModal: React.FC<ModelsModalProps> = ({ isOpen, onClose, selectedModel, onSelectModel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-background/80 border border-border rounded-xl shadow-lg backdrop-blur-lg animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Select a Model</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-3">
          {models.map((model) => (
            <div
              key={model.name}
              onClick={() => onSelectModel(model.name)}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedModel === model.name
                  ? 'border-primary bg-primary/10 ring-2 ring-primary'
                  : 'border-border hover:border-primary/50 hover:bg-secondary'
              }`}
            >
              <h3 className="font-medium">{model.name}</h3>
              <p className="text-sm text-muted-foreground">{model.provider}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelsModal;
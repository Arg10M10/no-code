import React from 'react';
import { Button } from "@/components/ui/button";

interface PromptSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onSuggestionClick }) => {
  const examplePrompts = [
    {
      title: "SaaS landing page",
      prompt:
        "Create a modern landing page for a SaaS that helps teams manage projects. Include a hero, features, pricing, and footer.",
    },
    {
      title: "Todo app",
      prompt:
        "Design a todo app in React + TypeScript with state, add, complete, and delete.",
    },
    {
      title: "Initial business plan",
      prompt:
        "Help me create a lean business plan for a B2B app: customer segments, value proposition, initial pricing, and key metrics.",
    },
  ];

  return (
    <div className="pt-8 text-center">
      <p className="text-sm text-muted-foreground mb-4">O prueba uno de estos ejemplos:</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {examplePrompts.map((example) => (
          <Button
            key={example.title}
            variant="outline"
            size="sm"
            className="rounded-full bg-secondary border-border hover:bg-muted"
            onClick={() => onSuggestionClick(example.prompt)}
          >
            {example.title}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PromptSuggestions;
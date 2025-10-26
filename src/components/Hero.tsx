"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createProject, setMessages, StoredMessage } from "@/lib/projects";
import { getSelectedModelLabel, setSelectedModelLabel } from "@/lib/settings";
import { ChevronDown, Sparkles } from "lucide-react";

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("Dyad-3.5");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    setSelectedModel(getSelectedModelLabel());
  }, []);

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setSelectedModelLabel(model);
    setIsPopoverOpen(false);
  };

  const handleCreateProject = () => {
    if (prompt.trim()) {
      const newProject = createProject(prompt.trim());
      const initialMessage: StoredMessage = {
        role: "user",
        content: prompt.trim(),
        createdAt: Date.now(),
      };
      setMessages(newProject.id, [initialMessage]);
      navigate(`/editor?id=${newProject.id}`);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleCreateProject();
    }
  };

  return (
    <section className="container flex flex-col items-center justify-center py-12 md:py-24 lg:py-32">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Tu Asistente de Desarrollo AI
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4">
            Describe lo que quieres construir. Dyad generará el código y te permitirá iterar en tiempo real.
          </p>
        </div>
        <div className="mt-8">
          <div className="relative">
            <Textarea
              placeholder="Ej: 'Crea un formulario de contacto con campos para nombre, email y mensaje, y un botón de envío.'"
              className="min-h-[120px] resize-none rounded-xl border-2 border-border p-4 pr-28 shadow-sm focus-visible:ring-primary"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    {selectedModel}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1">
                  <div
                    className="cursor-pointer rounded p-2 text-sm hover:bg-muted"
                    onClick={() => handleModelSelect("Dyad-3.5")}
                  >
                    Dyad-3.5
                  </div>
                  <div
                    className="cursor-pointer rounded p-2 text-sm hover:bg-muted"
                    onClick={() => handleModelSelect("Dyad-4")}
                  >
                    Dyad-4
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                size="sm"
                className="h-8"
                onClick={handleCreateProject}
                disabled={!prompt.trim()}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Crear
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
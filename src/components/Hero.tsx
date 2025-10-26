"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Cpu } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ModelsPopover from "@/components/ModelsPopover";
import { useSelectedModel } from "@/hooks/useSelectedModel";

const Hero: React.FC = () => {
  const { selectedModel, setSelectedModel } = useSelectedModel();

  return (
    <section className="w-full py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Construye webs con IA en minutos</h1>
          <p className="mt-3 text-muted-foreground">
            Describe lo que quieres y genera una web editable con vista previa en vivo.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Cpu className="h-4 w-4 mr-2" />
                  {selectedModel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <ModelsPopover selectedModel={selectedModel} onSelectModel={setSelectedModel} />
              </PopoverContent>
            </Popover>
            {/* Otros botones que ya existían en el Hero pueden mantenerse aquí */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
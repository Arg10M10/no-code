"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Project } from "@/lib/projects";

interface PreviewPanelProps {
  project: Project;
  onRebuild: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ project, onRebuild }) => {
  const [key, setKey] = React.useState(Date.now());

  const handleRefresh = () => {
    setKey(Date.now());
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <div className="p-2 border-b border-border/40 flex items-center justify-between bg-background/80 backdrop-blur-sm">
        <p className="text-sm font-medium">{project.name}</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onRebuild}>
            Reconstruir
          </Button>
        </div>
      </div>
      <div className="flex-1 relative">
        {project.screenshot ? (
          <img
            key={key}
            src={`file://${project.screenshot}?t=${key}`}
            alt="Vista previa del proyecto"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No hay vista previa disponible.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
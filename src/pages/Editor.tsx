import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, Settings, LogOut, RefreshCw, Send, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useAuth } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProject";
import { generateAnswer } from "@/services/ai";
import { getAvailableModels } from "@/lib/models";

import PreviewPanel from "@/components/PreviewPanel";
import CreditManager from "@/components/CreditManager";
import ProjectNameButton from "@/components/ProjectNameButton";

const availableModels = getAvailableModels();

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    projectName,
    setProjectName,
    prompt,
    setPrompt,
    code,
    setCode,
    selectedModel,
    setSelectedModel,
    apiKeys,
    credits,
  } = useProject();

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Por favor, introduce un prompt.");
      return;
    }
    if (!apiKeys[selectedModel.provider]) {
      toast.error(`Falta la clave API para ${selectedModel.provider}.`);
      navigate("/settings");
      return;
    }

    setIsGenerating(true);
    setPreviewLoading(true);
    setCode(null); // Limpiar el código anterior mientras se genera

    try {
      const systemPrompt =
        "You are an expert web developer. Your task is to generate a single, complete HTML file (including <html>, <head>, and <body> tags) based on the user's request. Use Tailwind CSS for styling. Do not include any external scripts or CSS links other than the Tailwind CDN script in the head. The output MUST be only the HTML code, nothing else. Do not include markdown fences (```html).";

      const result = await generateAnswer({
        prompt,
        selectedModelLabel: selectedModel.label,
        apiKeys,
        system: systemPrompt,
        temperature: 0.3,
      });

      setCode(result);
      toast.success("Código generado exitosamente.");
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error(`Error al generar código: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
      setPreviewLoading(false);
    }
  };

  const handleApplyCode = (newCode: string) => {
    setCode(newCode);
    toast.success("Código aplicado al proyecto.");
  };

  const handleRenameProject = (newName: string) => {
    setProjectName(newName);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-3 border-b border-border/60 bg-card/60">
        <div className="flex items-center gap-4 min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                  <Home className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Inicio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2 min-w-0 group">
            <ProjectNameButton projectName={projectName} onRename={handleRenameProject} />
            <div className="text-[11px] text-muted-foreground">
              {previewLoading ? "Cargando Preview…" : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CreditManager credits={credits} />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configuración</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cerrar Sesión</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left Panel: Prompt and Controls */}
        <div className="flex flex-col w-1/3 border-r border-border/60 bg-background">
          <div className="p-4 flex-grow flex flex-col">
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
              Prompt
            </h2>
            <Textarea
              placeholder="Describe el componente o página web que quieres generar (ej: 'Un formulario de inicio de sesión moderno con un fondo degradado')."
              className="flex-grow resize-none font-mono text-sm"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="p-4 border-t border-border/60 bg-card/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Modelo AI</h3>
              <Select
                value={selectedModel.label}
                onValueChange={(label) => {
                  const model = availableModels.find((m) => m.label === label);
                  if (model) {
                    setSelectedModel(model);
                  }
                }}
                disabled={isGenerating}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Seleccionar modelo" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.label} value={model.label}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generar Código
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="w-2/3">
          <PreviewPanel code={code} loading={previewLoading} onApply={handleApplyCode} />
        </div>
      </div>
    </div>
  );
};

export default Editor;
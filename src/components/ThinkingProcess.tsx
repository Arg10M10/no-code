import React, { useEffect, useState } from "react";
import { Loader2, ChevronDown, ChevronRight, BrainCircuit, CheckCircle2, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingProcessProps {
  logs: string[];
  thought?: string;
  isFinished?: boolean;
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ logs, thought, isFinished = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("Iniciando...");

  // Determinar el "paso" actual basado en el estado
  useEffect(() => {
    if (logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        if (lastLog.includes("Writing")) {
            setCurrentStep("Generando código...");
        } else {
            setCurrentStep("Aplicando cambios...");
        }
    } else if (thought) {
        if (thought.length < 50) setCurrentStep("Analizando solicitud...");
        else if (thought.length < 200) setCurrentStep("Revisando contexto...");
        else setCurrentStep("Planificando arquitectura...");
    }
  }, [logs, thought]);

  if (isFinished && !isExpanded) return null;

  return (
    <div className="w-full my-2 animate-fade-in">
      <div className={cn(
          "rounded-lg border transition-all duration-300 overflow-hidden",
          isExpanded ? "bg-card border-border shadow-sm" : "bg-muted/30 border-transparent hover:bg-muted/50"
      )}>
        {/* Header - Always visible summary */}
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs select-none"
        >
            <div className="flex items-center gap-2.5">
                <div className={cn(
                    "flex items-center justify-center w-4 h-4 rounded-full",
                    isFinished ? "text-green-500" : "text-amber-500"
                )}>
                    {isFinished ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                        <BrainCircuit className={cn("w-3.5 h-3.5", !isFinished && "animate-pulse")} />
                    )}
                </div>
                
                <span className={cn(
                    "font-medium",
                    isFinished ? "text-muted-foreground" : "text-foreground"
                )}>
                    {isFinished ? "Planificación completada" : currentStep}
                </span>

                {/* Loading indicator dots if active */}
                {!isFinished && (
                    <span className="flex gap-0.5 items-center mt-1">
                        <span className="w-0.5 h-0.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-0.5 h-0.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-0.5 h-0.5 bg-foreground/40 rounded-full animate-bounce" />
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold opacity-70">
                    {isExpanded ? "Ocultar" : "Detalles"}
                </span>
                {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
            </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
            <div className="px-3 pb-3 pt-0 border-t border-border/40 bg-background/50">
                {/* Chain of Thought */}
                {thought && (
                    <div className="mt-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <BrainCircuit className="w-3 h-3" />
                            Razonamiento
                        </h4>
                        <div className="text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-border/60">
                            {thought}
                        </div>
                    </div>
                )}

                {/* File Generation Logs */}
                {logs.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <FileCode className="w-3 h-3" />
                            Acciones
                        </h4>
                        <div className="space-y-1 pl-1">
                            {logs.map((log, idx) => {
                                const match = log.match(/Writing\s+(.+)\.\.\./);
                                const fileName = match ? match[1] : log;
                                return (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground/80 font-mono">
                                        <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                                        {fileName}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
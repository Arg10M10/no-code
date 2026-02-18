import React, { useEffect, useState, useRef } from "react";
import { ChevronDown, ChevronRight, BrainCircuit, CheckCircle2, FileCode, Terminal, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingProcessProps {
  logs: string[];
  thought?: string;
  isFinished?: boolean;
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ logs, thought, isFinished = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [phase, setPhase] = useState<'connecting' | 'thinking' | 'coding' | 'finished'>('connecting');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll cuando llega nuevo texto de pensamiento o logs
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thought, logs.length, isExpanded]);

  // Máquina de estados para controlar las fases
  useEffect(() => {
    if (isFinished) {
        setPhase('finished');
        setIsExpanded(false);
        return;
    }

    if (logs.length > 0) {
        // Si hay logs de archivos, estamos en fase de programación
        if (phase !== 'coding') {
             setPhase('coding');
             // Mantenemos expandido para ver los archivos
             setIsExpanded(true); 
        }
    } else if (thought && thought.length > 0) {
        // Si hay texto de pensamiento, estamos en fase de razonamiento
        if (phase !== 'thinking') {
            setPhase('thinking');
            setIsExpanded(true); // Auto-expandir para mostrar el stream de texto
        }
    } else {
        // Si no hay nada aún, estamos conectando
        setPhase('connecting');
    }
  }, [logs.length, thought, isFinished]);

  // Renderizado especial para la fase "Conectando" (Sin caja, solo texto animado)
  if (phase === 'connecting') {
      return (
          <div className="flex items-center gap-3 py-4 px-2 animate-fade-in">
              <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping duration-1000" />
                  <div className="relative bg-background rounded-full p-1 border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </div>
              </div>
              <span className="text-sm font-medium bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                  Conectando con la IA...
              </span>
          </div>
      );
  }

  // Configuración visual para las fases dentro de la caja
  const getHeaderInfo = () => {
    switch (phase) {
        case 'finished':
            return { label: "Proceso completado", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" };
        case 'coding':
            return { label: "Escribiendo código...", icon: Terminal, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" };
        case 'thinking':
            return { label: "Razonando solución...", icon: BrainCircuit, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20" };
        default:
            return { label: "Procesando...", icon: Loader2, color: "text-muted-foreground", bg: "bg-muted/10", border: "border-border" };
    }
  };

  const getLastLog = () => {
      if (logs.length === 0) return null;
      const last = logs[logs.length - 1];
      const match = last.match(/Writing\s+(.+)\.\.\./);
      return match ? match[1] : last;
  };

  // Si terminó y no está expandido, no mostramos nada (la respuesta final ya estará visible en el chat)
  if (isFinished && !isExpanded) return null;

  const header = getHeaderInfo();
  const Icon = header.icon;

  return (
    <div className="w-full my-2 animate-fade-in duration-300">
      <div className={cn(
          "rounded-xl border transition-all duration-500 overflow-hidden shadow-sm",
          header.bg,
          header.border
      )}>
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors border",
                    header.bg, header.color, header.border
                )}>
                    <Icon className={cn("w-3.5 h-3.5", phase !== 'finished' && "animate-pulse")} />
                </div>
                
                <div className="flex flex-col items-start text-left gap-0.5">
                    <span className={cn(
                        "font-semibold text-sm transition-colors",
                        phase === 'finished' ? "text-muted-foreground" : "text-foreground"
                    )}>
                        {header.label}
                    </span>
                    
                    {/* Subtítulo dinámico */}
                    {phase === 'coding' && logs.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 opacity-80">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            {getLastLog()}
                        </span>
                    )}
                    {phase === 'thinking' && (
                        <span className="text-[10px] text-muted-foreground opacity-80">
                            Analizando requisitos y planeando estructura...
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 opacity-50">
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
            </div>
        </button>

        <div className={cn(
            "grid transition-all duration-300 ease-in-out border-t border-border/50 bg-background/40 backdrop-blur-sm",
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}>
            <div className="overflow-hidden">
                <div 
                    ref={scrollRef}
                    className="p-4 pt-2 max-h-[300px] overflow-y-auto custom-scrollbar"
                >
                    {/* Sección: Pensamiento (Streaming) */}
                    {thought && (
                        <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center gap-2 mb-2 text-amber-600/90 dark:text-amber-400/90">
                                <BrainCircuit className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Process de Pensamiento</span>
                            </div>
                            <div className="text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-amber-500/20 font-mono">
                                {thought}
                                {phase === 'thinking' && (
                                    <span className="inline-block w-1.5 h-3 ml-1 align-middle bg-amber-500/50 animate-pulse" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sección: Coding Logs (Lista de archivos) */}
                    {logs.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-2">
                            <div className="flex items-center gap-2 mb-2 text-blue-600/90 dark:text-blue-400/90">
                                <FileCode className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Modificando Archivos</span>
                            </div>
                            <div className="space-y-2 pl-3 border-l-2 border-blue-500/20">
                                {logs.map((log, idx) => {
                                    const match = log.match(/Writing\s+(.+)\.\.\./);
                                    const fileName = match ? match[1] : log;
                                    const isLast = idx === logs.length - 1;
                                    return (
                                        <div key={idx} className="flex items-center gap-2 text-xs font-mono text-foreground/80">
                                            {isLast && phase === 'coding' ? (
                                                <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 shrink-0 ml-0.5" />
                                            )}
                                            <span className={cn(
                                                "truncate transition-colors",
                                                isLast && phase === 'coding' ? "text-blue-600 dark:text-blue-400 font-semibold" : ""
                                            )}>
                                                {fileName}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
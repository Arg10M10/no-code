import React, { useEffect, useState, useRef } from "react";
import { Loader2, ChevronDown, ChevronRight, BrainCircuit, CheckCircle2, FileCode, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingProcessProps {
  logs: string[];
  thought?: string;
  isFinished?: boolean;
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ logs, thought, isFinished = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [phase, setPhase] = useState<'thinking' | 'coding' | 'finished'>('thinking');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para el pensamiento
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thought, logs, isExpanded]);

  // Gestión de fases y auto-expansión
  useEffect(() => {
    if (isFinished) {
        setPhase('finished');
        setIsExpanded(false); // Colapsar al terminar
        return;
    }

    // Si hay logs, estamos programando
    if (logs.length > 0) {
        setPhase('coding');
        setIsExpanded(true); // Mantener expandido para ver qué archivos toca
    } 
    // Si hay pensamiento pero no logs, estamos pensando
    else if (thought && thought.length > 0) {
        setPhase('thinking');
        setIsExpanded(true); // Auto-expandir al empezar a pensar
    }
  }, [logs.length, thought, isFinished]);

  const getCurrentLabel = () => {
    if (isFinished) return "Proceso completado";
    if (phase === 'coding') return "Programando cambios...";
    if (phase === 'thinking') return "Thinking...";
    return "Iniciando..."; // Estado inicial antes del primer token
  };

  const getLastLog = () => {
      if (logs.length === 0) return null;
      const last = logs[logs.length - 1];
      const match = last.match(/Writing\s+(.+)\.\.\./);
      return match ? match[1] : last;
  };

  if (isFinished && !isExpanded) return null;

  return (
    <div className="w-full my-2 animate-fade-in">
      <div className={cn(
          "rounded-lg border transition-all duration-300 overflow-hidden",
          phase === 'coding' ? "bg-blue-500/5 border-blue-500/20" : 
          phase === 'thinking' ? "bg-amber-500/5 border-amber-500/20" :
          "bg-card border-border shadow-sm"
      )}>
        {/* Header - Always visible summary */}
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs select-none"
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition-colors",
                    phase === 'finished' ? "bg-green-500/10 text-green-500" :
                    phase === 'coding' ? "bg-blue-500/10 text-blue-500" :
                    "bg-amber-500/10 text-amber-500"
                )}>
                    {phase === 'finished' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : phase === 'coding' ? (
                        <Terminal className="w-3.5 h-3.5 animate-pulse" />
                    ) : (
                        <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
                    )}
                </div>
                
                <div className="flex flex-col items-start">
                    <span className={cn(
                        "font-medium leading-none",
                        phase === 'finished' ? "text-muted-foreground" : "text-foreground"
                    )}>
                        {getCurrentLabel()}
                    </span>
                    {phase === 'coding' && logs.length > 0 && (
                        <span className="text-[10px] text-muted-foreground mt-1 font-mono">
                            {getLastLog()}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
            </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
            <div className="px-3 pb-3 pt-0 border-t border-border/40 bg-background/50">
                <div 
                    ref={scrollRef}
                    className="mt-3 max-h-[200px] overflow-y-auto pr-1 space-y-3 custom-scrollbar"
                >
                    {/* Chain of Thought */}
                    {thought && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-1.5 mb-1.5 text-amber-600/80 dark:text-amber-400/80">
                                <BrainCircuit className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Razonamiento</span>
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-amber-500/20 font-mono">
                                {thought}
                                {phase === 'thinking' && (
                                    <span className="inline-block w-1.5 h-3 ml-1 align-middle bg-amber-500/50 animate-pulse" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* File Generation Logs */}
                    {logs.length > 0 && (
                        <div className="animate-fade-in pt-2">
                            <div className="flex items-center gap-1.5 mb-1.5 text-blue-600/80 dark:text-blue-400/80">
                                <FileCode className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Cambios</span>
                            </div>
                            <div className="space-y-1 pl-2 border-l-2 border-blue-500/20">
                                {logs.map((log, idx) => {
                                    const match = log.match(/Writing\s+(.+)\.\.\./);
                                    const fileName = match ? match[1] : log;
                                    const isLast = idx === logs.length - 1;
                                    return (
                                        <div key={idx} className="flex items-center gap-2 text-xs font-mono text-foreground/80">
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full shrink-0",
                                                isLast && phase === 'coding' ? "bg-blue-500 animate-pulse" : "bg-blue-500/30"
                                            )} />
                                            <span className={isLast && phase === 'coding' ? "text-blue-600 dark:text-blue-400 font-semibold" : ""}>
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
        )}
      </div>
    </div>
  );
};
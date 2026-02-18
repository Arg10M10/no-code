import React, { useEffect, useState, useRef } from "react";
import { ChevronDown, ChevronRight, BrainCircuit, CheckCircle2, FileCode, Terminal, Loader2, Server } from "lucide-react";
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

  // Auto-scroll
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thought, logs, isExpanded]);

  // Máquina de estados
  useEffect(() => {
    if (isFinished) {
        setPhase('finished');
        setIsExpanded(false);
        return;
    }

    if (logs.length > 0) {
        // Si hay logs, estamos programando
        if (phase !== 'coding') {
             setPhase('coding');
             setIsExpanded(true); 
        }
    } else if (thought && thought.length > 0) {
        // Si hay pensamiento, estamos pensando
        if (phase !== 'thinking') {
            setPhase('thinking');
            setIsExpanded(true); // Auto-expandir para mostrar lo que piensa
        }
    } else {
        setPhase('connecting');
    }
  }, [logs.length, thought?.length, isFinished]);

  const getHeaderInfo = () => {
    switch (phase) {
        case 'finished':
            return { label: "Proceso completado", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" };
        case 'coding':
            return { label: "Escribiendo código...", icon: Terminal, color: "text-blue-500", bg: "bg-blue-500/10" };
        case 'thinking':
            return { label: "Analizando solicitud...", icon: BrainCircuit, color: "text-amber-500", bg: "bg-amber-500/10" };
        default: // connecting
            return { label: "Procesando...", icon: Server, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const getLastLog = () => {
      if (logs.length === 0) return null;
      const last = logs[logs.length - 1];
      const match = last.match(/Writing\s+(.+)\.\.\./);
      return match ? match[1] : last;
  };

  if (isFinished && !isExpanded) return null;

  const header = getHeaderInfo();
  const Icon = header.icon;

  return (
    <div className="w-full my-2 animate-fade-in">
      <div className={cn(
          "rounded-lg border transition-all duration-300 overflow-hidden",
          phase === 'coding' ? "bg-blue-500/5 border-blue-500/20" : 
          phase === 'thinking' ? "bg-amber-500/5 border-amber-500/20" :
          phase === 'connecting' ? "bg-muted/30 border-transparent" :
          "bg-card border-border shadow-sm"
      )}>
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs select-none"
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition-colors",
                    header.bg, header.color
                )}>
                    {phase === 'connecting' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Icon className={cn("w-3.5 h-3.5", phase !== 'finished' && "animate-pulse")} />
                    )}
                </div>
                
                <div className="flex flex-col items-start text-left">
                    <span className={cn(
                        "font-medium leading-none transition-colors",
                        phase === 'finished' ? "text-muted-foreground" : "text-foreground"
                    )}>
                        {header.label}
                    </span>
                    {phase === 'coding' && logs.length > 0 && (
                        <span className="text-[10px] text-muted-foreground mt-1 font-mono flex items-center gap-1.5">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
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

        {isExpanded && (
            <div className="px-3 pb-3 pt-0 border-t border-border/40 bg-background/50">
                <div 
                    ref={scrollRef}
                    className="mt-3 max-h-[240px] overflow-y-auto pr-1 space-y-3 custom-scrollbar"
                >
                    {/* Sección: Pensamiento */}
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

                    {/* Sección: Coding Logs */}
                    {logs.length > 0 && (
                        <div className="animate-fade-in pt-2">
                            <div className="flex items-center gap-1.5 mb-1.5 text-blue-600/80 dark:text-blue-400/80">
                                <FileCode className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Generando Archivos</span>
                            </div>
                            <div className="space-y-1.5 pl-2 border-l-2 border-blue-500/20">
                                {logs.map((log, idx) => {
                                    const match = log.match(/Writing\s+(.+)\.\.\./);
                                    const fileName = match ? match[1] : log;
                                    const isLast = idx === logs.length - 1;
                                    return (
                                        <div key={idx} className="flex items-center gap-2 text-xs font-mono text-foreground/80">
                                            {isLast && phase === 'coding' ? (
                                                <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
                                            ) : (
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/30 shrink-0 ml-0.5" />
                                            )}
                                            <span className={cn(isLast && phase === 'coding' ? "text-blue-600 dark:text-blue-400 font-semibold" : "")}>
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
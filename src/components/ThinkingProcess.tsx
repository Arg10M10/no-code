import React, { useEffect, useState, useRef } from "react";
import { ChevronDown, ChevronRight, BrainCircuit, CheckCircle2, FileCode, Terminal, Loader2, Sparkles, Code2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ThinkingProcessProps {
  logs: string[];
  thought?: string;
  isFinished?: boolean;
  codeStream?: string;
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ logs, thought, isFinished = false, codeStream }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [phase, setPhase] = useState<'connecting' | 'thinking' | 'coding' | 'finished'>('connecting');
  const scrollRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);

  // Auto-scroll para pensamiento y logs
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thought, logs.length, isExpanded]);

  // Auto-scroll para preview de código
  useEffect(() => {
    if (showCodePreview && codeRef.current) {
        codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [codeStream, showCodePreview]);

  // Máquina de estados
  useEffect(() => {
    if (isFinished) {
        setPhase('finished');
        setIsExpanded(false);
        return;
    }

    if (logs.length > 0 || (codeStream && codeStream.length > 10)) {
        if (phase !== 'coding') {
             setPhase('coding');
             setShowCodePreview(true); 
        }
    } else if (thought && thought.length > 0) {
        if (phase !== 'thinking') {
            setPhase('thinking');
        }
    } else {
        setPhase('connecting');
    }
  }, [logs.length, thought, isFinished, codeStream]);

  const getLastLog = () => {
      if (logs.length === 0) return null;
      const last = logs[logs.length - 1];
      const match = last.match(/(Writing|Generating)\s+(.+)(\.\.\.)?/);
      return match ? match[2].replace('...', '') : last;
  };

  // Renderizado especial para "Conectando"
  if (phase === 'connecting') {
      return (
          <div className="flex items-center gap-3 py-4 px-3 animate-fade-in bg-secondary/30 rounded-lg border border-border/40">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Conectando con el modelo...</span>
          </div>
      );
  }

  const header = {
    finished: { label: "Proceso completado", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    coding: { label: "Escribiendo código...", icon: Terminal, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" },
    thinking: { label: "Razonando solución...", icon: BrainCircuit, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20" },
    connecting: { label: "Conectando...", icon: Loader2, color: "text-muted-foreground", bg: "bg-muted/10", border: "border-border" }
  }[phase];

  const Icon = header.icon;
  const activeFile = getLastLog();

  // Si terminó y no está expandido, no mostramos nada
  if (isFinished && !isExpanded) return null;

  return (
    <div className="w-full my-3 animate-fade-in duration-300">
      <div className={cn(
          "rounded-xl border transition-all duration-500 overflow-hidden shadow-sm",
          header.bg,
          header.border
      )}>
        {/* Header Clickable */}
        <div className="flex items-center justify-between px-4 py-3 bg-background/40 backdrop-blur-sm">
             <div className="flex items-center gap-3 overflow-hidden">
                <div className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-colors border shadow-sm",
                    "bg-background", header.color, header.border
                )}>
                    <Icon className={cn("w-4 h-4", phase !== 'finished' && "animate-pulse")} />
                </div>
                
                <div className="flex flex-col min-w-0">
                    <span className={cn(
                        "font-semibold text-sm transition-colors truncate",
                        phase === 'finished' ? "text-muted-foreground" : "text-foreground"
                    )}>
                        {header.label}
                    </span>
                    
                    {phase === 'coding' && activeFile && (
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1.5 opacity-90 truncate">
                            <FileCode className="w-3 h-3" />
                            {activeFile}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {phase === 'coding' && (
                    <button 
                        onClick={() => setShowCodePreview(!showCodePreview)}
                        className={cn(
                            "text-[10px] px-2 py-1 rounded border flex items-center gap-1 transition-all",
                            showCodePreview 
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
                                : "bg-background text-muted-foreground hover:text-foreground"
                        )}
                        title="Ver stream de código"
                    >
                        <Code2 className="w-3 h-3" />
                        {showCodePreview ? "Ocultar Código" : "Ver Código"}
                    </button>
                )}
                
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                >
                    {isExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                </button>
            </div>
        </div>

        {/* Content Area */}
        {isExpanded && (
            <div className="border-t border-border/50 bg-background/60">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto]">
                    {/* Panel Izquierdo: Pensamiento y Logs */}
                    <div ref={scrollRef} className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                         {/* Sección Pensamiento */}
                        {thought && (
                            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="flex items-center gap-2 mb-2 text-amber-600/90 dark:text-amber-400/90">
                                    <BrainCircuit className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Razonamiento</span>
                                </div>
                                <div className="text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-amber-500/20 font-mono">
                                    {thought}
                                    {phase === 'thinking' && (
                                        <span className="inline-block w-1.5 h-3 ml-1 align-middle bg-amber-500/50 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sección Lista de Archivos (Logs) */}
                        {logs.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-2">
                                <div className="flex items-center gap-2 mb-2 text-blue-600/90 dark:text-blue-400/90">
                                    <FileCode className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Generando Archivos</span>
                                </div>
                                <div className="space-y-1 pl-3 border-l-2 border-blue-500/20">
                                    {logs.map((log, idx) => {
                                        const match = log.match(/(Writing|Generating)\s+(.+)(\.\.\.)?/);
                                        const fileName = match ? match[2].replace('...', '') : log;
                                        const isLast = idx === logs.length - 1;
                                        return (
                                            <div key={idx} className="flex items-center gap-2 text-xs font-mono text-foreground/80 group">
                                                {isLast && phase === 'coding' ? (
                                                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
                                                ) : (
                                                    <CheckCircle2 className="w-3 h-3 text-green-500/70 shrink-0" />
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

                    {/* Panel Derecho (Opcional): Live Code Stream */}
                    {showCodePreview && codeStream && (
                        <div className="border-t md:border-t-0 md:border-l border-border/50 w-full md:w-[320px] bg-[#1e1e1e] text-zinc-300 flex flex-col">
                             <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5">
                                <span className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-2">
                                    <Terminal className="w-3 h-3" />
                                    Live Output
                                </span>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                </div>
                             </div>
                             <pre 
                                ref={codeRef}
                                className="flex-1 p-3 text-[10px] font-mono leading-tight overflow-auto custom-scrollbar whitespace-pre-wrap break-all"
                             >
                                {codeStream.slice(-2000)} {/* Mostrar solo los últimos 2000 caracteres para rendimiento */}
                                <span className="inline-block w-2 h-4 bg-green-500 ml-0.5 animate-pulse align-middle" />
                             </pre>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
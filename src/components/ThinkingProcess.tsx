import React, { useEffect, useRef, useState } from "react";
import { Loader2, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingProcessProps {
  logs: string[];
  thought?: string;
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ logs, thought }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Lógica de auto-colapso:
  // Si tenemos logs (empezó a escribir código), colapsamos el pensamiento por defecto.
  // Si no hay logs (está pensando), lo mantenemos expandido.
  useEffect(() => {
    if (logs.length > 0) {
        setIsExpanded(false);
    } else if (thought) {
        setIsExpanded(true);
    }
  }, [logs.length > 0]); // Solo reaccionar cuando cambia el estado de tener logs o no

  // Auto-scroll para logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!thought && logs.length === 0) {
     return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse p-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Analizando solicitud...</span>
        </div>
     );
  }

  return (
    <div className="flex flex-col gap-2 w-full animate-fade-in text-sm">
      
      {/* Sección de Pensamiento (Collapsible) */}
      {thought && (
        <div className="group">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
                <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-90")} />
                <span className={cn("font-medium", isExpanded ? "text-foreground" : "")}>
                    Thought
                </span>
                {!isExpanded && (
                    <span className="text-xs text-muted-foreground/60 truncate ml-1 max-w-[300px]">
                        {thought.split('\n')[0]}...
                    </span>
                )}
            </button>
            
            {isExpanded && (
                <div className="pl-6 mt-1 text-muted-foreground/90 text-xs leading-relaxed whitespace-pre-wrap border-l border-border/40 ml-2 animate-fade-in">
                    {thought}
                </div>
            )}
        </div>
      )}

      {/* Sección de Archivos Editados (Logs) */}
      {logs.length > 0 && (
        <div className="mt-2 pl-2">
            <div 
                ref={scrollRef}
                className="flex flex-col gap-1.5 overflow-hidden"
            >
                {logs.map((log, index) => {
                    const isLast = index === logs.length - 1;
                    const match = log.match(/Writing\s+(.+)\.\.\./);
                    const fileName = match ? match[1] : log;

                    return (
                        <div key={index} className={cn(
                            "flex items-center gap-2 text-xs transition-all",
                            isLast ? "text-foreground opacity-100" : "text-muted-foreground opacity-60"
                        )}>
                            {isLast ? (
                                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                            ) : (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                            <span className="font-mono">{fileName}</span>
                        </div>
                    )
                })}
            </div>
        </div>
      )}
    </div>
  );
};
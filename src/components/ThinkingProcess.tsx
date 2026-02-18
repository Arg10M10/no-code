import React, { useEffect, useRef } from "react";
import { Loader2, FileCode, CheckCircle2, Terminal, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingProcessProps {
  logs: string[];
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Si no hay logs reales aún, mostramos un estado inicial
  if (logs.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Iniciando conexión con la IA...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-border/50 bg-black/5 dark:bg-white/5 animate-fade-in font-mono text-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        <Terminal className="h-3 w-3" />
        <span>Live Output</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar"
      >
        {logs.map((log, index) => {
            const isLast = index === logs.length - 1;
            
            // Detectar si es un archivo o un pensamiento general
            const isFile = log.toLowerCase().includes("writing") || log.includes("src/");

            return (
                <div key={index} className={cn(
                    "flex items-start gap-2 animate-fade-in transition-all",
                    isLast ? "opacity-100" : "opacity-60"
                )}>
                    <div className="mt-0.5">
                       {isLast ? (
                         <Loader2 className="h-3 w-3 animate-spin text-primary" />
                       ) : (
                         isFile ? <Pencil className="h-3 w-3 text-blue-500" /> : <CheckCircle2 className="h-3 w-3 text-green-500" />
                       )}
                    </div>
                    <span className={cn(
                        "break-all leading-tight",
                        isLast ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                        {log}
                    </span>
                </div>
            )
        })}
      </div>
    </div>
  );
};
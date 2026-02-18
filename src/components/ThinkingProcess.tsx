import React, { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, BrainCircuit, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingProcessProps {
  logs: string[];
  thought?: string;
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ logs, thought }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(true);

  // Auto-scroll al último log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0 && !thought) {
    return (
      <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Pensando...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-black/5 dark:bg-white/5 animate-fade-in text-xs w-full max-w-full">
      
      {/* Thought Process Section */}
      {thought && (
        <div className="flex flex-col gap-2">
            <button 
                onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider mb-1 select-none"
            >
                <BrainCircuit className="h-3.5 w-3.5" />
                <span>Reasoning</span>
                {isThoughtExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            
            {isThoughtExpanded && (
                <div className="pl-1 text-muted-foreground/90 whitespace-pre-wrap leading-relaxed font-sans text-sm animate-fade-in border-l-2 border-border/50 ml-1.5 pl-3">
                    {thought}
                </div>
            )}
        </div>
      )}

      {/* File Operations Log */}
      {logs.length > 0 && (
        <div className={cn("flex flex-col gap-2 mt-2", thought && "pt-2 border-t border-border/30")}>
            {thought && (
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Applying Changes</span>
                </div>
            )}

            <div 
                ref={scrollRef}
                className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar font-mono"
            >
                {logs.map((log, index) => {
                    const isLast = index === logs.length - 1;
                    
                    // Extract filename from "Writing src/path/to/file..."
                    const match = log.match(/Writing\s+(.+)\.\.\./);
                    const fileName = match ? match[1] : log;

                    return (
                        <div key={index} className={cn(
                            "flex items-start gap-2 animate-fade-in transition-all",
                            isLast ? "opacity-100" : "opacity-60"
                        )}>
                            <div className="mt-0.5 min-w-[12px]">
                            {isLast ? (
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            ) : (
                                <Pencil className="h-3 w-3 text-blue-500" />
                            )}
                            </div>
                            <span className={cn(
                                "break-all leading-tight",
                                isLast ? "text-foreground font-medium" : "text-muted-foreground"
                            )}>
                                {fileName}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
      )}
    </div>
  );
};
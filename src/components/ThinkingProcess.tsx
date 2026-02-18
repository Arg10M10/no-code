import React, { useEffect, useRef } from "react";
import { Loader2, Pencil } from "lucide-react";
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

  if (logs.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg animate-fade-in font-mono text-xs">
      <div 
        ref={scrollRef}
        className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar"
      >
        {logs.map((log, index) => {
            const isLast = index === logs.length - 1;
            
            // Extract filename from "Writing src/path/to/file..."
            const match = log.match(/Writing\s+(.+)\.\.\./);
            const fileName = match ? match[1] : log;

            return (
                <div key={index} className={cn(
                    "flex items-center gap-3 animate-fade-in transition-all",
                    isLast ? "opacity-100" : "opacity-70"
                )}>
                    <div className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full shrink-0",
                        "bg-blue-500/10 text-blue-500"
                    )}>
                        {isLast ? (
                             <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                             <Pencil className="h-3.5 w-3.5" />
                        )}
                    </div>
                    <span className="text-foreground font-medium">
                        {fileName}
                    </span>
                </div>
            )
        })}
      </div>
    </div>
  );
};
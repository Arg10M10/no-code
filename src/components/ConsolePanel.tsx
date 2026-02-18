import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Info, AlertTriangle, Terminal, Sparkles, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export type LogEntry = {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
  stack?: string;
  source?: string;
};

interface ConsolePanelProps {
  logs: LogEntry[];
  onClear: () => void;
  onFixError: (error: string) => void;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs, onClear, onFixError }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
      default: return <Terminal className="w-4 h-4 text-muted-foreground shrink-0" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'error': return "bg-red-500/5 border-red-500/10 text-red-600 dark:text-red-400";
      case 'warn': return "bg-yellow-500/5 border-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case 'info': return "bg-blue-500/5 border-blue-500/10 text-blue-600 dark:text-blue-400";
      default: return "hover:bg-muted/50 text-foreground/80";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-zinc-300 font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground/80">Terminal Output</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-muted-foreground">
                {logs.length}
            </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-6 w-6 p-0 hover:bg-white/10 hover:text-white">
            <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 gap-2">
                <Terminal className="w-8 h-8 opacity-20" />
                <p>No logs to display</p>
            </div>
        ) : (
            logs.map((log) => (
                <div 
                    key={log.id} 
                    className={cn(
                        "group flex items-start gap-2 p-2 rounded border border-transparent transition-all",
                        getColor(log.type)
                    )}
                >
                    <div className="mt-0.5 opacity-70">{getIcon(log.type)}</div>
                    <div className="flex-1 min-w-0 break-all whitespace-pre-wrap">
                        <div className="flex items-center gap-2 opacity-50 text-[10px] mb-0.5">
                            <span>{format(log.timestamp, "HH:mm:ss.SSS")}</span>
                            {log.source && <span>• {log.source}</span>}
                        </div>
                        <div>{log.message}</div>
                        {log.stack && (
                            <details className="mt-1">
                                <summary className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity">Ver Stack Trace</summary>
                                <pre className="mt-2 p-2 bg-black/20 rounded overflow-x-auto text-[10px] opacity-70">
                                    {log.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                    
                    {log.type === 'error' && (
                        <Button 
                            size="sm" 
                            variant="secondary"
                            className="h-6 px-2 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => onFixError(log.message + (log.stack ? `\nStack: ${log.stack}` : ""))}
                        >
                            <Sparkles className="w-3 h-3 mr-1.5" />
                            Fix with AI
                        </Button>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ConsolePanel;
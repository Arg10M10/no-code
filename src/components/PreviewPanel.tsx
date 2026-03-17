"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, MousePointerClick, Terminal, Package, Play, Square, 
  Globe, AlertCircle, Code2, Settings2, ChevronDown, ChevronUp, Maximize2 
} from "lucide-react";
import Loader from "./Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import SupabaseConnectModal from "@/components/supabase/SupabaseConnectModal";
import CodePanel from "@/components/CodePanel";
import { ProjectFile } from "@/lib/projects";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PreviewPanelProps {
  previewUrl: string;
  code?: string | null;
  files?: ProjectFile[] | null;
  loading: boolean;
  onRefresh: () => void;
  isSelectionModeActive: boolean;
  onToggleSelectionMode: () => void;
  onElementSelected: (description: string) => void;
  projectName?: string;
  supabaseIntent?: number;
  projectId: string | null;
  localhostUrl: string | null;
  npmOutput: string[];
  npmError: string[];
  isNpmRunning: boolean;
  onRebuild: () => void;
  onRestart: () => void;
  onStopDevServer: () => void;
  onRunCommand: (command: string, args: string[], showToast?: boolean) => Promise<void>;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  previewUrl,
  code,
  files,
  loading,
  onRefresh,
  isSelectionModeActive,
  onToggleSelectionMode,
  onElementSelected,
  projectName,
  supabaseIntent = 0,
  projectId,
  localhostUrl,
  npmOutput,
  npmError,
  isNpmRunning,
  onRebuild,
  onRestart,
  onStopDevServer,
  onRunCommand,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const consoleScrollRef = useRef<HTMLDivElement>(null);
  const consoleInputRef = useRef<HTMLInputElement>(null);
  const [openSupabaseModal, setOpenSupabaseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [commandInput, setCommandInput] = useState<string>("");
  const isElectron = typeof window.electronAPI !== 'undefined';

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      const message = { type: 'toggleSelectionMode', payload: { isActive: isSelectionModeActive } };
      const post = () => iframe.contentWindow?.postMessage(message, '*');
      iframe.addEventListener('load', post);
      post();
      return () => iframe.removeEventListener('load', post);
    }
  }, [isSelectionModeActive, code, localhostUrl]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'elementSelected') {
        onElementSelected(event.data.payload.description);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelected]);

  useEffect(() => {
    if (consoleScrollRef.current) {
      consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
    }
  }, [npmOutput, npmError, isTerminalOpen]);

  const handleConsoleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const parts = commandInput.trim().split(/\s+/);
    await onRunCommand(parts[0], parts.slice(1));
    setCommandInput("");
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden relative">
      {/* Header Principal */}
      <div className="flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur-sm z-20 shrink-0">
        <div className="flex items-center gap-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-muted/50 h-8">
              <TabsTrigger value="preview" className="text-[11px] font-bold uppercase tracking-wider px-3 h-7">
                <Globe className="h-3 w-3 mr-1.5" /> Navegador
              </TabsTrigger>
              <TabsTrigger value="code" className="text-[11px] font-bold uppercase tracking-wider px-3 h-7">
                <Code2 className="h-3 w-3 mr-1.5" /> Código
              </TabsTrigger>
              <TabsTrigger value="integrations" className="text-[11px] font-bold uppercase tracking-wider px-3 h-7">
                <Settings2 className="h-3 w-3 mr-1.5" /> Ajustes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {isElectron && (
            <div className="flex items-center gap-1.5 border-r pr-2 mr-1">
              <Button variant="outline" size="sm" onClick={onRebuild} disabled={loading} className="h-7 text-[10px] font-bold">
                REBUILD
              </Button>
              <Button 
                variant={isNpmRunning ? "destructive" : "secondary"} 
                size="sm" 
                onClick={isNpmRunning ? onStopDevServer : onRestart}
                className="h-7 text-[10px] font-bold"
              >
                {isNpmRunning ? <Square className="h-3 w-3 mr-1 fill-current" /> : <Play className="h-3 w-3 mr-1 fill-current" />}
                {isNpmRunning ? "STOP" : "RUN DEV"}
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSelectionMode}
            className={cn("h-8 w-8", isSelectionModeActive && "bg-primary text-primary-foreground")}
          >
            <MousePointerClick className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Área de Contenido Principal */}
      <div className="flex-1 relative min-h-0 w-full overflow-hidden">
        {activeTab === "preview" && (
          <div className="absolute inset-0 flex flex-col bg-white">
            {/* Fake Address Bar */}
            <div className="h-9 bg-muted/20 border-b flex items-center px-4 gap-3 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/40" />
              </div>
              <div className="flex-1 bg-background/50 border rounded h-6 flex items-center px-3 gap-2 text-[10px] text-muted-foreground font-mono truncate">
                <Maximize2 className="h-2.5 w-2.5" />
                {localhostUrl || "http://localhost:5173"}
              </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden">
              {(loading || (isNpmRunning && !localhostUrl)) && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                  <Loader />
                  <p className="mt-4 text-xs font-bold tracking-widest text-muted-foreground animate-pulse">
                    CARGANDO SERVIDOR...
                  </p>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={localhostUrl || (code ? `data:text/html;base64,${btoa(unescape(encodeURIComponent(code)))}` : "about:blank")}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        )}

        {activeTab === "code" && (
          <div className="absolute inset-0 bg-background z-10 flex flex-col">
             <CodePanel files={files} />
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="absolute inset-0 bg-background overflow-auto p-8">
             <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-xl font-bold">Configuración del Proyecto</h2>
                <div className="p-6 border rounded-xl bg-card">
                   <h3 className="font-semibold mb-2">Supabase Cloud</h3>
                   <p className="text-sm text-muted-foreground mb-4">Conecta tu base de datos y autenticación en segundos.</p>
                   <Button onClick={() => setOpenSupabaseModal(true)}>Configurar Conexión</Button>
                </div>
             </div>
             <SupabaseConnectModal open={openSupabaseModal} onOpenChange={setOpenSupabaseModal} />
          </div>
        )}
      </div>

      {/* Terminal Inferior Animada */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 z-40 bg-[#0c0c0c] border-t border-white/10 transition-all duration-300 ease-in-out flex flex-col shadow-2xl",
          isTerminalOpen ? "h-[300px]" : "h-9"
        )}
      >
        <div 
          className="h-9 flex items-center justify-between px-4 cursor-pointer hover:bg-white/5 shrink-0"
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Terminal de Node.js</span>
            {isNpmRunning && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-2" />}
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[9px] text-zinc-600 font-mono">localhost:5173</span>
             {isTerminalOpen ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronUp className="h-4 w-4 text-zinc-500" />}
          </div>
        </div>

        {isTerminalOpen && (
          <div className="flex-1 flex flex-col min-h-0 font-mono">
            <ScrollArea className="flex-1 p-3" viewportRef={consoleScrollRef}>
              <div className="space-y-1 text-[11px] leading-tight">
                {npmOutput.map((line, i) => (
                  <div key={`out-${i}`} className="text-zinc-300 break-all whitespace-pre-wrap">{line}</div>
                ))}
                {npmError.map((line, i) => (
                  <div key={`err-${i}`} className="text-red-400/90 break-all whitespace-pre-wrap">{line}</div>
                ))}
              </div>
            </ScrollArea>
            
            <form onSubmit={handleConsoleCommandSubmit} className="p-2 bg-black border-t border-white/5 flex items-center gap-2 px-4">
               <span className="text-blue-500 font-bold text-xs">$</span>
               <input
                 ref={consoleInputRef}
                 value={commandInput}
                 onChange={(e) => setCommandInput(e.target.value)}
                 className="flex-1 bg-transparent border-none text-[11px] font-mono py-1 focus:ring-0 text-zinc-200 placeholder:text-zinc-800"
                 placeholder="Ej: npm install, npm run build..."
                 autoFocus
               />
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
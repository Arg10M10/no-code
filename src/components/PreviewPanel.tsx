"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, MousePointerClick, Terminal, Package, Play, Square, Trash2, Globe, AlertCircle, Code2, Settings2 } from "lucide-react";
import Loader from "./Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import SupabaseConnectModal from "@/components/supabase/SupabaseConnectModal";
import CodePanel from "@/components/CodePanel";
import { ProjectFile } from "@/lib/projects";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

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
  // Propiedades para comandos NPM y servidor
  localhostUrl: string | null;
  npmOutput: string[];
  npmError: string[];
  isNpmRunning: boolean;
  onRebuild: () => void;
  onRestart: () => void;
  onStopDevServer: () => void;
  onRunCommand: (command: string, args: string[], showToast?: boolean) => Promise<void>;
}

const SUPABASE_PROJECT_ID = "xkcnbvcjzezhjaoxojsv";
const SUPABASE_AUTH_ID = "bydamian-app";

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
  const [commandInput, setCommandInput] = useState<string>("");
  const isElectron = typeof window.electronAPI !== 'undefined';

  // Notificar al iframe sobre cambios del modo de selección
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      const message = {
        type: 'toggleSelectionMode',
        payload: { isActive: isSelectionModeActive },
      };
      const post = () => iframe.contentWindow?.postMessage(message, '*');
      iframe.addEventListener('load', post);
      post();
      return () => iframe.removeEventListener('load', post);
    }
  }, [isSelectionModeActive, code, localhostUrl]);

  // Escuchar mensajes del iframe (elemento seleccionado)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'elementSelected') {
        onElementSelected(event.data.payload.description);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelected]);

  // Si el asistente sugiere conectar Supabase
  useEffect(() => {
    if (supabaseIntent > 0) {
      setActiveTab("integrations");
      setOpenSupabaseModal(true);
    }
  }, [supabaseIntent]);

  // Auto-scroll consola
  useEffect(() => {
    if (consoleScrollRef.current) {
      consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
    }
  }, [npmOutput, npmError, activeTab]);

  const handleConsoleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const parts = commandInput.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    
    await onRunCommand(cmd, args);
    setCommandInput("");
    consoleInputRef.current?.focus();
  };

  const clearConsole = () => {
    // Nota: El estado de los logs se maneja en el padre (Editor.tsx)
    // Aquí solo podríamos limpiar la vista local si quisiéramos
  };

  return (
    <div className="h-full flex flex-col bg-muted/40 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between p-2 border-b bg-background flex-shrink-0 animate-fade-in shadow-sm">
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="preview" className="px-4 text-xs font-medium gap-2">
                <Globe className="h-3.5 w-3.5" />
                Navegador
            </TabsTrigger>
            <TabsTrigger value="code" className="px-4 text-xs font-medium gap-2">
                <Code2 className="h-3.5 w-3.5" />
                Código
            </TabsTrigger>
            <TabsTrigger value="console" className="px-4 text-xs font-medium gap-2">
                <Terminal className="h-3.5 w-3.5" />
                Terminal
            </TabsTrigger>
            <TabsTrigger value="integrations" className="px-4 text-xs font-medium gap-2">
                <Settings2 className="h-3.5 w-3.5" />
                Integraciones
            </TabsTrigger>
            <TabsTrigger value="issues" className="px-4 text-xs font-medium gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                Problemas
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {isElectron && (
              <div className="flex items-center gap-1.5 border-r pr-2 mr-1">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRebuild} 
                    title="Reinstalar y Reconstruir" 
                    disabled={loading}
                    className="h-8 text-[10px] uppercase tracking-wider font-bold"
                >
                  <Package className="h-3.5 w-3.5 mr-1.5" />
                  Rebuild
                </Button>
                {isNpmRunning ? (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={onStopDevServer} 
                    className="h-8 text-[10px] uppercase tracking-wider font-bold"
                  >
                    <Square className="h-3.5 w-3.5 mr-1.5 fill-current" />
                    Stop
                  </Button>
                ) : (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={onRestart}
                    className="h-8 text-[10px] uppercase tracking-wider font-bold bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20"
                  >
                    <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                    Run Dev
                  </Button>
                )}
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSelectionMode}
              title="Seleccionar elemento del diseño"
              className={cn(
                "h-8 w-8 transition-all", 
                isSelectionModeActive ? "bg-primary text-primary-foreground shadow-lg scale-110" : "hover:bg-accent"
              )}
            >
              <MousePointerClick className="h-4 w-4" />
            </Button>
            
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onRefresh} 
                title="Refrescar navegador" 
                className="h-8 w-8 transition-transform hover:rotate-180 duration-500"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="preview" className="flex-1 relative m-0 bg-white">
          {(loading || (isNpmRunning && !localhostUrl)) && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center z-10 animate-fade-in">
              <Loader />
              <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
                {localhostUrl ? "Cargando previsualización..." : "Iniciando servidor de desarrollo..."}
              </p>
            </div>
          )}
          
          <div className="w-full h-full flex flex-col">
             {/* Barra de direcciones falsa para look profesional */}
             <div className="h-10 bg-muted/30 border-b flex items-center px-4 gap-3 shrink-0">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                    <div className="w-3 h-3 rounded-full bg-green-400/50" />
                </div>
                <div className="flex-1 bg-background border rounded-md h-7 flex items-center px-3 gap-2 text-[11px] text-muted-foreground truncate font-mono">
                    <Globe className="h-3 w-3" />
                    {localhostUrl || "http://localhost:5173"}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRefresh}>
                    <RefreshCw className="h-3 w-3" />
                </Button>
             </div>

             <iframe
                ref={iframeRef}
                src={localhostUrl || (code ? `data:text/html;base64,${btoa(unescape(encodeURIComponent(code)))}` : "about:blank")}
                className="flex-1 w-full border-0 bg-white"
                title="Previsualización"
                sandbox="allow-scripts allow-same-origin allow-forms"
             />
          </div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0 overflow-hidden bg-background">
          <CodePanel files={files} />
        </TabsContent>

        <TabsContent value="console" className="flex-1 m-0 overflow-hidden bg-[#0a0a0a] text-zinc-300">
          <div className="h-full w-full flex flex-col font-mono">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Node Terminal</span>
                </div>
                {isNpmRunning && (
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-green-500/80 font-bold uppercase">Dev Server Active</span>
                    </div>
                )}
            </div>
            
            <ScrollArea className="flex-1 p-4" viewportRef={consoleScrollRef}>
              <div className="space-y-1.5 pb-4">
                {npmOutput.map((line, i) => (
                  <div key={`out-${i}`} className="text-xs leading-relaxed break-all whitespace-pre-wrap">{line}</div>
                ))}
                {npmError.map((line, i) => (
                  <div key={`err-${i}`} className="text-xs leading-relaxed text-red-400 break-all whitespace-pre-wrap">{line}</div>
                ))}
                {npmOutput.length === 0 && npmError.length === 0 && (
                  <div className="text-zinc-600 text-xs italic">La terminal está lista para recibir comandos...</div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleConsoleCommandSubmit} className="p-3 bg-black border-t border-white/5 shrink-0">
                <div className="flex items-center gap-2 bg-zinc-900/50 rounded-md border border-white/5 px-3 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                    <span className="text-blue-500 font-bold text-xs">$</span>
                    <input
                        ref={consoleInputRef}
                        value={commandInput}
                        onChange={(e) => setCommandInput(e.target.value)}
                        placeholder="npm install, npm run build, ..."
                        className="flex-1 bg-transparent border-none text-xs font-mono py-2 focus:ring-0 placeholder:text-zinc-700"
                        autoComplete="off"
                    />
                </div>
                <p className="text-[9px] text-zinc-600 mt-2 px-1">Presiona Enter para ejecutar el comando en el directorio del proyecto.</p>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="flex-1 m-0 overflow-auto bg-background">
          <div className="max-w-3xl mx-auto p-8 space-y-8 animate-fade-in">
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Settings2 className="h-6 w-6 text-primary" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold">Integraciones de Backend</h2>
                    <p className="text-sm text-muted-foreground">Configura servicios externos para potenciar tu aplicación.</p>
                 </div>
              </div>
              
              <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-background/50">
                     <div className="flex items-center gap-3">
                        <img src="/logo.png" className="h-6 w-6 grayscale" alt="Supabase" />
                        <div>
                           <p className="text-sm font-semibold">Supabase</p>
                           <p className="text-xs text-muted-foreground">Base de datos, Auth y Storage.</p>
                        </div>
                     </div>
                     <Button variant="outline" size="sm" onClick={() => setOpenSupabaseModal(true)}>
                        Configurar
                     </Button>
                  </div>
              </div>
            </div>
          </div>
          <SupabaseConnectModal open={openSupabaseModal} onOpenChange={setOpenSupabaseModal} />
        </TabsContent>

        <TabsContent value="issues" className="flex-1 m-0 p-12 bg-background flex items-center justify-center">
          <div className="max-w-md text-center space-y-4 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <Package className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Sin problemas</h2>
            <p className="text-muted-foreground">
              No se han detectado errores de compilación ni problemas en el código generado.
            </p>
            <Button variant="outline" onClick={() => setActiveTab("preview")}>
                Volver al Navegador
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PreviewPanel;
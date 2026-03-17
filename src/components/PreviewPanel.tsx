"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, MousePointerClick, Terminal, Package, Play, Square, Trash2, Globe } from "lucide-react";
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
  // New props for NPM commands
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

  const handleRefresh = () => {
    onRefresh();
  };

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
      post(); // También intentar inmediatamente
      return () => iframe.removeEventListener('load', post);
    }
  }, [isSelectionModeActive, code, localhostUrl]); // Add localhostUrl to dependencies

  // Escuchar mensajes del iframe (elemento seleccionado)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'elementSelected') {
        onElementSelected(event.data.payload.description);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onElementSelected]);

  // Si el asistente sugiere conectar Supabase, llevar al tab Integrations y abrir el modal
  useEffect(() => {
    if (supabaseIntent > 0) {
      setActiveTab("integrations");
      setOpenSupabaseModal(true);
    }
  }, [supabaseIntent]);

  // Auto-scroll console output
  useEffect(() => {
    if (consoleScrollRef.current) {
      consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
    }
  }, [npmOutput, npmError, activeTab]);

  const openSupabaseAuthorization = () => {
    const url = `https://supabase.com/dashboard/project/${encodeURIComponent(
      SUPABASE_PROJECT_ID
    )}/settings/api?auth_id=${encodeURIComponent(SUPABASE_AUTH_ID)}`;
    window.open(url, "_blank", "noopener");
  };

  const handleConsoleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const [cmd, ...args] = commandInput.trim().split(/\s+/);
    await onRunCommand(cmd, args);
    setCommandInput("");
    consoleInputRef.current?.focus();
  };

  const handleClearConsole = () => {
    npmOutput.splice(0, npmOutput.length); // Clear array directly
    npmError.splice(0, npmError.length); // Clear array directly
  };

  return (
    <div className="h-full flex flex-col bg-muted/40">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between p-2 border-b bg-background flex-shrink-0 animate-fade-in">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            {isElectron && <TabsTrigger value="console">Console</TabsTrigger>}
          </TabsList>
          <div className="flex items-center gap-2">
            {isElectron && (
              <>
                <Button variant="ghost" size="icon" onClick={onRebuild} title="Rebuild & Restart" disabled={isNpmRunning}>
                  <Package className="h-4 w-4" />
                </Button>
                {isNpmRunning ? (
                  <Button variant="ghost" size="icon" onClick={onStopDevServer} title="Stop Dev Server">
                    <Square className="h-4 w-4 text-red-500" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={onRestart} title="Start Dev Server">
                    <Play className="h-4 w-4 text-green-500" />
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSelectionMode}
              title="Select element"
              className={cn("transition-all", isSelectionModeActive && "bg-accent text-accent-foreground scale-110")}
            >
              <MousePointerClick className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh preview" className="transition-transform hover:rotate-90">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="preview" className="flex-1 relative">
          {(loading || isNpmRunning && !localhostUrl) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader />
            </div>
          )}
          {isElectron && localhostUrl ? (
            <iframe
              ref={iframeRef}
              src={localhostUrl}
              className="w-full h-full border-0 transition-opacity duration-300"
              title="Preview"
              sandbox="allow-scripts"
              style={{ opacity: (loading || isNpmRunning && !localhostUrl) ? 0.5 : 1 }}
            />
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={code ?? undefined}
              className="w-full h-full border-0 transition-opacity duration-300"
              title="Preview"
              sandbox="allow-scripts"
              style={{ opacity: (loading || isNpmRunning && !localhostUrl) ? 0.5 : 1 }}
            />
          )}
          {isElectron && localhostUrl && (
            <div className="absolute bottom-2 left-2 bg-background/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-muted-foreground flex items-center gap-2 border border-border/60">
              <Globe className="h-3 w-3 text-green-500" />
              <span>Live: <a href={localhostUrl} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">{localhostUrl}</a></span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="issues" className="p-6 flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-lg font-semibold mb-2">Issues Detected</h2>
            <p className="text-sm text-muted-foreground">
              No issues have been detected. Errors or warnings will be shown here.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 overflow-hidden bg-background/50">
          <CodePanel files={files} />
        </TabsContent>

        <TabsContent value="integrations" className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Integrations</h2>
                <div className="text-xs text-muted-foreground">Supabase</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Conecta tu proyecto de Supabase para usar base de datos, Auth y funciones.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => setOpenSupabaseModal(true)}>
                  Conectar Supabase
                </Button>
                <Button variant="outline" onClick={openSupabaseAuthorization}>
                  Abrir API y autorización (auth_id)
                </Button>
              </div>
            </div>
          </div>

          <SupabaseConnectModal open={openSupabaseModal} onOpenChange={setOpenSupabaseModal} />
        </TabsContent>

        {isElectron && (
          <TabsContent value="console" className="flex-1 overflow-hidden bg-black text-white">
            <div className="h-full w-full flex flex-col">
              <div className="flex items-center gap-2 p-3 border-b border-gray-800 bg-gray-900">
                <Terminal className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-mono text-gray-300">NPM Console</span>
                {isNpmRunning && (
                  <span className="ml-auto text-xs text-blue-400 animate-pulse">
                    Running: {localhostUrl ? `Dev Server (${localhostUrl})` : 'Command...'}
                  </span>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={handleClearConsole} title="Clear Console">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-3 text-xs font-mono whitespace-pre-wrap break-all" viewportRef={consoleScrollRef}>
                {npmOutput.map((line, i) => (
                  <div key={`out-${i}`} className="text-gray-200">{line}</div>
                ))}
                {npmError.map((line, i) => (
                  <div key={`err-${i}`} className="text-red-400">{line}</div>
                ))}
                {(npmOutput.length === 0 && npmError.length === 0 && !isNpmRunning) && (
                  <div className="text-gray-500">No output yet. Run a command to see results.</div>
                )}
              </ScrollArea>
              <form onSubmit={handleConsoleCommandSubmit} className="flex-shrink-0 p-3 border-t border-gray-800 bg-gray-900">
                <Input
                  ref={consoleInputRef}
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="npm install, npm run build, npx ..."
                  className="bg-gray-800 border-gray-700 text-white text-xs font-mono focus:ring-blue-500 focus:border-blue-500"
                  disabled={isNpmRunning}
                />
              </form>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default PreviewPanel;
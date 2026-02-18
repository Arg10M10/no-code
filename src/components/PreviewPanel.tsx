"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, MousePointerClick, Terminal, Bug } from "lucide-react";
import Loader from "./Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import SupabaseConnectModal from "@/components/supabase/SupabaseConnectModal";
import CodePanel from "@/components/CodePanel";
import ConsolePanel, { LogEntry } from "@/components/ConsolePanel";
import { ProjectFile } from "@/lib/projects";
import { toast } from "sonner";

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
  onFixError: (error: string) => void; // Nueva prop
}

const SUPABASE_PROJECT_ID = "xkcnbvcjzezhjaoxojsv";
const SUPABASE_AUTH_ID = "bydamian-app";

// Script que se inyecta en el iframe para capturar errores y logs
const ERROR_CATCHER_SCRIPT = `
  <script>
    (function() {
      const send = (type, payload) => {
        try {
          window.parent.postMessage({ type, payload }, '*');
        } catch (e) {}
      };

      // Captura de errores globales
      window.onerror = function(msg, url, line, col, error) {
        send('CONSOLE_LOG', { 
          type: 'error', 
          message: msg, 
          stack: error?.stack,
          source: url ? \`\${url}:\${line}:\${col}\` : 'Script'
        });
        return false;
      };

      // Captura de promesas rechazadas
      window.onunhandledrejection = function(event) {
        send('CONSOLE_LOG', { 
          type: 'error', 
          message: 'Unhandled Promise Rejection: ' + (event.reason?.message || event.reason),
          stack: event.reason?.stack
        });
      };

      // Interceptar console.log, warn, error, info
      const methods = ['log', 'warn', 'error', 'info'];
      methods.forEach(method => {
        const original = console[method];
        console[method] = function(...args) {
          original.apply(console, args);
          // Convertir argumentos a string seguro
          const message = args.map(arg => {
            try {
              return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
            } catch(e) {
              return '[Circular/Unserializable]';
            }
          }).join(' ');
          
          send('CONSOLE_LOG', { type: method, message });
        };
      });
    })();
  </script>
`;

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
  onFixError,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [openSupabaseModal, setOpenSupabaseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorCount, setErrorCount] = useState(0);

  // Inyectar el script de captura de errores en el HTML generado
  const enhancedCode = code 
    ? code.replace('<head>', `<head>${ERROR_CATCHER_SCRIPT}`) 
    : null;

  const handleRefresh = () => {
    setLogs([]); // Limpiar logs al refrescar
    setErrorCount(0);
    onRefresh();
  };

  const handleClearLogs = () => {
    setLogs([]);
    setErrorCount(0);
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
      post();
      return () => iframe.removeEventListener('load', post);
    }
  }, [isSelectionModeActive, enhancedCode]);

  // Escuchar mensajes del iframe (elemento seleccionado Y logs)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'elementSelected') {
        onElementSelected(event.data.payload.description);
      } else if (event.data.type === 'CONSOLE_LOG') {
        const { type, message, stack, source } = event.data.payload;
        
        const newLog: LogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          type: type === 'warning' ? 'warn' : type,
          message,
          stack,
          source
        };

        setLogs(prev => [...prev, newLog]);
        
        if (type === 'error') {
            setErrorCount(c => c + 1);
            // Opcional: Auto-cambiar a la pestaña de consola si es un error crítico
            // setActiveTab("console"); 
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onElementSelected]);

  useEffect(() => {
    if (supabaseIntent > 0) {
      setActiveTab("integrations");
      setOpenSupabaseModal(true);
    }
  }, [supabaseIntent]);

  const openSupabaseAuthorization = () => {
    const url = `https://supabase.com/dashboard/project/${encodeURIComponent(
      SUPABASE_PROJECT_ID
    )}/settings/api?auth_id=${encodeURIComponent(SUPABASE_AUTH_ID)}`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <div className="h-full flex flex-col bg-muted/40">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between p-2 border-b bg-background flex-shrink-0 animate-fade-in">
          <TabsList className="h-9">
            <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
            <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
            <TabsTrigger value="console" className={cn("text-xs flex items-center gap-1.5", errorCount > 0 && "text-red-500 font-medium")}>
               <Terminal className="w-3.5 h-3.5" />
               Console
               {errorCount > 0 && (
                   <span className="flex items-center justify-center bg-red-500 text-white text-[9px] h-4 min-w-[16px] px-1 rounded-full">
                       {errorCount}
                   </span>
               )}
            </TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs">Integrations</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSelectionMode}
              title="Select element"
              className={cn("h-8 w-8 transition-all", isSelectionModeActive && "bg-accent text-accent-foreground scale-110")}
            >
              <MousePointerClick className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh preview" className="h-8 w-8 transition-transform hover:rotate-90">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="preview" className="flex-1 relative m-0">
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader />
            </div>
          )}
          <iframe
            ref={iframeRef}
            srcDoc={enhancedCode ?? undefined}
            src={!enhancedCode ? previewUrl : undefined}
            className="w-full h-full border-0 transition-opacity duration-300"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            style={{ opacity: loading ? 0.5 : 1 }}
          />
        </TabsContent>

        <TabsContent value="code" className="flex-1 overflow-hidden bg-background/50 m-0">
          <CodePanel files={files} />
        </TabsContent>

        <TabsContent value="console" className="flex-1 overflow-hidden m-0 bg-[#1e1e1e]">
          <ConsolePanel logs={logs} onClear={handleClearLogs} onFixError={onFixError} />
        </TabsContent>

        <TabsContent value="integrations" className="flex-1 overflow-auto m-0">
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
      </Tabs>
    </div>
  );
};

export default PreviewPanel;
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, MousePointerClick, Globe, Code2, Settings2, Maximize2, ChevronLeft, ChevronRight, ShieldCheck
} from "lucide-react";
import Loader from "./Loader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import SupabaseConnectModal from "@/components/supabase/SupabaseConnectModal";
import CodePanel from "@/components/CodePanel";
import { ProjectFile } from "@/lib/projects";

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
  projectId: string | null;
  onSaveFile: (path: string, content: string) => void;
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
  onSaveFile,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [openSupabaseModal, setOpenSupabaseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("preview");

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      const message = { type: 'toggleSelectionMode', payload: { isActive: isSelectionModeActive } };
      iframe.contentWindow.postMessage(message, '*');
    }
  }, [isSelectionModeActive]);

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden relative">
      {/* Barra de Pestañas Superior */}
      <div className="flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur-sm z-20 shrink-0">
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

        <div className="flex items-center gap-2">
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

      {/* Contenido Flexible */}
      <div className="flex-1 relative min-h-0 w-full overflow-hidden flex flex-col">
        {activeTab === "preview" && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Barra de Direcciones Estilo Navegador */}
            <div className="h-11 bg-muted/30 border-b flex items-center px-4 gap-4 shrink-0">
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh}><RefreshCw className="h-3.5 w-3.5" /></Button>
              </div>
              
              <div className="flex-1 bg-background border rounded-full h-7 flex items-center px-4 gap-2 text-[11px] text-muted-foreground font-medium shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                <span className="truncate">{previewUrl.startsWith('data:') ? 'localhost:preview' : previewUrl}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Maximize2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-white">
              {loading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                  <Loader />
                  <p className="mt-4 text-xs font-bold tracking-widest text-muted-foreground animate-pulse uppercase">
                    Iniciando Node.js...
                  </p>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={previewUrl.startsWith('data:') ? previewUrl : previewUrl}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        )}

        {activeTab === "code" && (
          <div className="flex-1 overflow-hidden bg-background">
             <CodePanel files={files} onSaveFile={onSaveFile} />
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="flex-1 bg-background overflow-auto p-8">
             <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-xl font-bold">Ajustes del Proyecto</h2>
                <div className="p-6 border rounded-xl bg-card">
                   <h3 className="font-semibold mb-2">Conexión con Supabase</h3>
                   <p className="text-sm text-muted-foreground mb-4">Configura tu base de datos cloud y autenticación.</p>
                   <Button onClick={() => setOpenSupabaseModal(true)}>Abrir Configuración</Button>
                </div>
             </div>
             <SupabaseConnectModal open={openSupabaseModal} onOpenChange={setOpenSupabaseModal} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Upload, MousePointerClick } from "lucide-react";
import Loader from "./Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSupabaseConfig, setSupabaseConfig, clearSupabaseConfig, isSupabaseConfigured } from "@/integrations/supabase/config";

interface PreviewPanelProps {
  previewUrl: string;
  code?: string | null;
  loading: boolean;
  onRefresh: () => void;
  isSelectionModeActive: boolean;
  onToggleSelectionMode: () => void;
  onElementSelected: (description: string) => void;
}

const SUPABASE_PROJECT_ID = "xkcnbvcjzezhjaoxojsv";
const SUPABASE_AUTH_ID = "bydamian-app";

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  previewUrl,
  code,
  loading,
  onRefresh,
  isSelectionModeActive,
  onToggleSelectionMode,
  onElementSelected,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [sbUrl, setSbUrl] = useState("");
  const [sbAnonKey, setSbAnonKey] = useState("");
  const [configured, setConfigured] = useState<boolean>(false);

  const handleRefresh = () => {
    onRefresh();
  };

  // Cargar configuración inicial
  useEffect(() => {
    const cfg = getSupabaseConfig();
    if (cfg) {
      setSbUrl(cfg.url);
      setSbAnonKey(cfg.anonKey);
    }
    setConfigured(isSupabaseConfigured());
  }, []);

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
  }, [isSelectionModeActive, code]);

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

  const openSupabaseAuthorization = () => {
    const url = `https://supabase.com/dashboard/project/${encodeURIComponent(
      SUPABASE_PROJECT_ID
    )}/settings/api?auth_id=${encodeURIComponent(SUPABASE_AUTH_ID)}`;
    window.open(url, "_blank", "noopener");
  };

  const validateUrl = (val: string) => {
    try {
      const u = new URL(val);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  };

  const handleSaveConfig = () => {
    const urlOk = validateUrl(sbUrl);
    const keyOk = sbAnonKey.trim().length > 20; // simple sanity check
    if (!urlOk) {
      toast.error("Invalid Supabase URL", { description: "It must be a valid URL like https://your-project.supabase.co" });
      return;
    }
    if (!keyOk) {
      toast.error("Invalid anon key", { description: "Please paste the full anon/public key." });
      return;
    }
    setSupabaseConfig({ url: sbUrl, anonKey: sbAnonKey });
    setConfigured(true);
    toast.success("Supabase configuration saved");
  };

  const handleClearConfig = () => {
    clearSupabaseConfig();
    setSbUrl("");
    setSbAnonKey("");
    setConfigured(false);
    toast.message("Supabase configuration cleared");
  };

  return (
    <div className="h-full flex flex-col bg-muted/40">
      <Tabs defaultValue="preview" className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between p-2 border-b bg-background flex-shrink-0">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSelectionMode}
              title="Select element"
              className={cn(isSelectionModeActive && "bg-accent text-accent-foreground")}
            >
              <MousePointerClick className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh preview">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
        
        <TabsContent value="preview" className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader />
            </div>
          )}
          <iframe
            ref={iframeRef}
            srcDoc={code ?? undefined}
            src={!code ? previewUrl : undefined}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts"
          />
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
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Code changes are applied directly to the project files.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Integrations</h2>
                <div className={cn("text-xs px-2 py-1 rounded-md border", configured ? "border-green-600 text-green-400 bg-green-500/10" : "border-yellow-600 text-yellow-300 bg-yellow-500/10")}>
                  {configured ? "Configured" : "Not configured"}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Paste your Supabase project URL and anon/public API key to connect your app.
              </p>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sb-url">Supabase URL</Label>
                  <Input
                    id="sb-url"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    placeholder="https://YOUR-PROJECT.supabase.co"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sb-anon">Anon/Public API Key</Label>
                  <Input
                    id="sb-anon"
                    type="password"
                    value={sbAnonKey}
                    onChange={(e) => setSbAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={handleSaveConfig}>Save</Button>
                  <Button variant="outline" onClick={handleClearConfig}>Clear</Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 space-y-3">
              <div className="text-sm">
                <div className="text-muted-foreground">Provider</div>
                <div className="font-medium">Supabase</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Project: {SUPABASE_PROJECT_ID}
                </div>
              </div>
              <div>
                <Button onClick={openSupabaseAuthorization}>
                  Open Supabase API Settings
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This opens your Supabase dashboard to review API settings and authorize this app (auth_id).
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PreviewPanel;
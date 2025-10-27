"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Upload, MousePointerClick } from "lucide-react";
import Loader from "./Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleRefresh = () => {
    onRefresh();
  };

  // Effect to notify iframe about selection mode changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      const message = {
        type: 'toggleSelectionMode',
        payload: { isActive: isSelectionModeActive },
      };
      const post = () => iframe.contentWindow?.postMessage(message, '*');
      iframe.addEventListener('load', post);
      post(); // Also try immediately
      return () => iframe.removeEventListener('load', post);
    }
  }, [isSelectionModeActive, code]);

  // Effect to listen for messages from the iframe
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
    // Llevamos al usuario a la página de API/Autorización del proyecto con un auth_id identificable para la app
    const url = `https://supabase.com/dashboard/project/${encodeURIComponent(
      SUPABASE_PROJECT_ID
    )}/settings/api?auth_id=${encodeURIComponent(SUPABASE_AUTH_ID)}`;
    window.open(url, "_blank", "noopener");
    setShowConnectDialog(false);
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
          <div className="max-w-3xl mx-auto p-6">
            <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 space-y-4">
              <h2 className="text-xl font-semibold">Integrations</h2>
              <p className="text-sm text-muted-foreground">
                Connect your Supabase organization to enable authentication, database and edge functions in your generated web app.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="text-muted-foreground">Provider</div>
                  <div className="font-medium">Supabase</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Project: {SUPABASE_PROJECT_ID}
                  </div>
                </div>
                <Button onClick={() => { setTermsAccepted(false); setShowConnectDialog(true); }}>
                  Connect Supabase
                </Button>
              </div>
            </div>
          </div>

          <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Authorize Supabase access</DialogTitle>
                <DialogDescription>
                  To continue, please review and accept the terms to connect your organization to this app.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
                  />
                  <Label htmlFor="terms" className="text-sm leading-6">
                    I accept the terms to allow this app to access my Supabase project APIs.
                  </Label>
                </div>
                <div className="rounded-md border border-border p-3 text-xs text-muted-foreground">
                  You will be redirected to Supabase to complete the authorization. 
                  On that page, review the permissions and confirm to connect. 
                  We use the auth_id parameter to link your organization with this app.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
                  Cancel
                </Button>
                <Button disabled={!termsAccepted} onClick={openSupabaseAuthorization}>
                  Accept and connect
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PreviewPanel;
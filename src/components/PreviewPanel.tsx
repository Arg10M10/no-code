"use client";

import React, { useEffect, useRef, useState } from 'react';
import IntegrationsDialog from './IntegrationsDialog';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

type PreviewPanelProps = {
  previewUrl: string;
  code: string | null;
  loading: boolean;
  onRefresh: () => void;
  isSelectionModeActive: boolean;
  onToggleSelectionMode: () => void;
  onElementSelected: (description: string) => void;
};

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  previewUrl,
  code,
  loading,
  onRefresh,
  isSelectionModeActive,
  onToggleSelectionMode,
  onElementSelected,
}) => {
  const [openIntegrations, setOpenIntegrations] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Recibir selección de elementos desde el iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'elementSelected' && event.data?.payload?.description) {
        onElementSelected(event.data.payload.description);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelected]);

  // Enviar estado de selección al iframe
  useEffect(() => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.postMessage({ type: 'toggleSelectionMode', payload: { isActive: isSelectionModeActive } }, '*');
  }, [isSelectionModeActive]);

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b bg-background flex-shrink-0">
          <div className="flex items-center gap-2">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
            <Button variant="secondary" size="sm" onClick={() => setOpenIntegrations(true)}>
              Integrations
            </Button>
          </div>
        </div>

        <TabsContent value="preview" className="flex-1 overflow-hidden">
          <div className="relative h-full">
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Refresh
              </Button>
              <Button
                variant={isSelectionModeActive ? 'default' : 'secondary'}
                size="sm"
                onClick={onToggleSelectionMode}
              >
                {isSelectionModeActive ? 'Selecting…' : 'Select element'}
              </Button>
            </div>

            {code ? (
              <iframe
                ref={iframeRef}
                title="Generated Preview"
                className="w-full h-full border-0 bg-white"
                // allow-forms para no bloquear eventos internos aunque prevenimos navegación en script de selección
                sandbox="allow-scripts allow-same-origin allow-forms"
                srcDoc={code}
              />
            ) : (
              <iframe
                ref={iframeRef}
                title="Preview"
                className="w-full h-full border-0 bg-white"
                src={previewUrl}
              />
            )}

            {loading && (
              <div className="preview-loading-overlay">
                <div className="loader">
                  <div className="box box-1">
                    <div className="side-left" />
                    <div className="side-right" />
                    <div className="side-top" />
                  </div>
                  <div className="box box-2">
                    <div className="side-left" />
                    <div className="side-right" />
                    <div className="side-top" />
                  </div>
                  <div className="box box-3">
                    <div className="side-left" />
                    <div className="side-right" />
                    <div className="side-top" />
                  </div>
                  <div className="box box-4">
                    <div className="side-left" />
                    <div className="side-right" />
                    <div className="side-top" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="flex-1 overflow-auto">
          <div className="p-4 text-sm text-muted-foreground">No issues found.</div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 overflow-auto">
          {code ? (
            <pre className="p-4 text-xs whitespace-pre overflow-auto">{code}</pre>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No code yet.</div>
          )}
        </TabsContent>
      </Tabs>

      <IntegrationsDialog open={openIntegrations} onOpenChange={setOpenIntegrations} />
    </div>
  );
};

export default PreviewPanel;
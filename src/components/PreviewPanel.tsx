"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Upload, MousePointerClick } from "lucide-react";
import Loader from "./Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PreviewPanelProps {
  previewUrl: string;
  previewLoading: boolean;
  onRefresh: () => void;
  isSelectionModeActive: boolean;
  onToggleSelectionMode: () => void;
  onElementSelected: (description: string) => void;
  generatedCode: string | null;
  codeLoading: boolean;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  previewUrl,
  previewLoading,
  onRefresh,
  isSelectionModeActive,
  onToggleSelectionMode,
  onElementSelected,
  generatedCode,
  codeLoading,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    onRefresh();
  };

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
  }, [isSelectionModeActive]);

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

  return (
    <div className="h-full flex flex-col bg-muted/40">
      <Tabs defaultValue="preview" className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between p-2 border-b bg-background flex-shrink-0">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
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
          {previewLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
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
          {codeLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader />
            </div>
          ) : generatedCode ? (
            <ScrollArea className="h-full">
              <pre className="text-sm p-4"><code className="font-mono">{generatedCode}</code></pre>
            </ScrollArea>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Generated code will appear here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PreviewPanel;
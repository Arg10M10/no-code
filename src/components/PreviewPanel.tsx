"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Upload } from "lucide-react";
import Loader from "./Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PreviewPanelProps {
  previewUrl: string;
  loading: boolean;
  onRefresh: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ previewUrl, loading, onRefresh }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    if (iframeRef.current) {
      // A more robust way to refresh an iframe
      iframeRef.current.src = iframeRef.current.src;
    }
    onRefresh();
  };

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
           <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
                Code changes are applied directly to the project files.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PreviewPanel;
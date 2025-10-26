import React, { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import Loader from "./Loader";

interface PreviewPanelProps {
  code: string | null;
  loading: boolean;
  onApply: (code: string) => void; // Prop se mantiene por compatibilidad, aunque no se use aquí
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ code, loading }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = code || "<html><body></body></html>";
    }
  }, [code]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      // Una forma sencilla de forzar la recarga del iframe
      iframeRef.current.srcdoc = iframeRef.current.srcdoc;
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/40">
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <div className="text-sm font-medium">Preview</div>
        <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh preview">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <Loader />
            <p className="mt-24 text-muted-foreground text-sm">Building your app...</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          title="Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default PreviewPanel;
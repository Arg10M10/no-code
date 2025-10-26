import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { useProject } from "@/hooks/useProject";
import { useEffect, useRef, useState } from "react";
import { getPreviewUrl } from "@/lib/projects";
import Loader from "./Loader";

interface PreviewPanelProps {
  projectId: string;
}

const PreviewPanel = ({ projectId }: PreviewPanelProps) => {
  const { project, isLoading, error } = useProject(projectId);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(Date.now());

  const previewUrl = getPreviewUrl(projectId);

  const handleRefresh = () => {
    if (iframeRef.current) {
      // Option 1: Simple reload
      // iframeRef.current.src = previewUrl;

      // Option 2: Force reload without cache
      // iframeRef.current.contentWindow?.location.reload(true);

      // Option 3: Remount the iframe by changing its key
      setIframeKey(Date.now());
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-destructive">Error loading project: {error.message}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Project not found.</div>
      </div>
    );
  }

  const isBuilding = project.status === "building";

  return (
    <div className="h-full flex flex-col bg-muted/40">
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <div className="text-sm font-medium">Preview</div>
        <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh preview">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 relative">
        {isBuilding && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <Loader />
            <p className="mt-24 text-muted-foreground text-sm">Building your app...</p>
          </div>
        )}
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={previewUrl}
          title="Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default PreviewPanel;
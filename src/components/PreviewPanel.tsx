import React from "react";
import { Button } from "@/components/ui/button";
import { Code, RefreshCw, Check, X } from "lucide-react";
import { toast } from "sonner";

interface PreviewPanelProps {
  code: string | null;
  loading: boolean;
  onApply: (code: string) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ code, loading, onApply }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [showCode, setShowCode] = React.useState(false);
  const [localCode, setLocalCode] = React.useState(code || "");
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    if (code !== null) {
      setLocalCode(code);
      setIsDirty(false);
    }
  }, [code]);

  React.useEffect(() => {
    if (iframeRef.current && code) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }, [code]);

  const handleApply = () => {
    onApply(localCode);
    setIsDirty(false);
  };

  const handleReset = () => {
    if (code) {
      setLocalCode(code);
      setIsDirty(false);
      toast.info("Código restablecido");
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalCode(e.target.value);
    setIsDirty(e.target.value !== code);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Barra superior del Preview */}
      <div className="p-2 border-b border-border/60 bg-card/60 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Live Preview</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowCode(!showCode)} className="h-8 px-2">
          <Code className="h-4 w-4 mr-1.5" />
          {showCode ? "Ocultar Código" : "Mostrar Código"}
        </Button>
      </div>

      {/* Contenido principal: Preview o Editor */}
      <div className="flex-grow relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-sm text-muted-foreground flex items-center">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generando Preview...
            </div>
          </div>
        )}

        {showCode ? (
          <div className="h-full flex flex-col">
            <textarea
              value={localCode}
              onChange={handleCodeChange}
              className="flex-grow p-4 font-mono text-xs bg-gray-900 text-white resize-none focus:outline-none"
              placeholder="El código HTML generado aparecerá aquí..."
            />
            <div className="p-2 border-t border-border/60 bg-card/60 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} disabled={!isDirty}>
                <X className="h-4 w-4 mr-1.5" />
                Descartar
              </Button>
              <Button size="sm" onClick={handleApply} disabled={!isDirty}>
                <Check className="h-4 w-4 mr-1.5" />
                Aplicar
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="Live Preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
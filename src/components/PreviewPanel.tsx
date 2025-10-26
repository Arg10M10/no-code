"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";

interface PreviewPanelProps {
  code: string | null;
  loading?: boolean;
  onApply: (nextCode: string) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ code, loading = false, onApply }) => {
  const [draft, setDraft] = React.useState<string>(code || "");

  React.useEffect(() => {
    setDraft(code || "");
  }, [code]);

  const canApply = draft.trim().length > 0 && draft !== (code || "");

  return (
    <div className="relative h-full p-2 sm:p-3">
      <div className="h-full w-full rounded-xl border border-border/60 bg-black/40 overflow-hidden flex flex-col">
        {/* Mini editor */}
        <div className="p-2 border-b border-border/60 bg-card/60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Mini editor (HTML/CSS/JS)</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDraft(code || "")}
                disabled={!code || draft === code}
              >
                Descartar cambios
              </Button>
              <Button size="sm" onClick={() => onApply(draft)} disabled={!canApply}>
                Aplicar al Preview
              </Button>
            </div>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Aquí aparecerá el código generado por la IA…"
            className="w-full h-40 md:h-48 bg-background rounded-md p-3 text-[13px] font-mono leading-relaxed border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="relative flex-1">
          {loading && (
            <div className="preview-loading-overlay">
              <div className="flex flex-col items-center gap-4">
                <Loader aria-label="Cargando vista previa" />
                <div className="text-xs text-muted-foreground">Cargando vista previa…</div>
              </div>
            </div>
          )}
          <iframe
            title="Preview"
            className="w-full h-full border-0"
            srcDoc={code || "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'><title>Preview</title></head><body style='background:#0b0f14;color:#9db2c3;font:14px/1.6 system-ui, sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><div style=\"opacity:.7;text-align:center\">Aún no hay contenido<br/><small>Escribe en el chat para generar tu web</small></div></body></html>"}
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
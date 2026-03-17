"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ProjectFile } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { Copy, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodePanelProps {
  files?: ProjectFile[] | null;
}

const CodePanel: React.FC<CodePanelProps> = ({ files }) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    if (files && files.length > 0 && !selectedPath) {
      setSelectedPath(files[0].path);
    } else if (files && selectedPath && !files.find(f => f.path === selectedPath)) {
      setSelectedPath(files.length > 0 ? files[0].path : null);
    }
  }, [files, selectedPath]);

  const selectedFile = useMemo(() => {
    if (!selectedPath || !files) return null;
    return files.find((f) => f.path === selectedPath) || null;
  }, [files, selectedPath]);

  const handleCopy = async () => {
    if (selectedFile?.content) {
      await navigator.clipboard.writeText(selectedFile.content);
      toast.success(`Copiado al portapapeles`);
    }
  };

  return (
    <div className="h-full w-full flex flex-col animate-fade-in bg-background">
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Explorador</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-xs font-semibold truncate max-w-[200px]">{selectedPath || "Sin archivo"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-[10px] font-bold" disabled={!selectedFile}>
          <Copy className="h-3 w-3 mr-2" />
          COPIAR
        </Button>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Sidebar de archivos */}
        <aside className="w-56 border-r bg-muted/10 overflow-y-auto hidden md:block shrink-0">
          <div className="p-2 space-y-0.5">
            {files && files.length > 0 ? (
              files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  className={cn(
                    "w-full text-left text-[11px] px-2 py-1.5 rounded flex items-center gap-2 transition-colors",
                    selectedPath === file.path
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-[11px] text-muted-foreground italic text-center">No hay archivos.</div>
            )}
          </div>
        </aside>

        {/* Visor de código */}
        <main className="flex-1 min-w-0 bg-[#0d0d0d] relative">
          <ScrollArea className="h-full w-full">
            <div className="p-6">
              <pre className="m-0 text-[12px] font-mono leading-relaxed text-zinc-300 whitespace-pre overflow-visible">
                {selectedFile ? selectedFile.content : "Selecciona un archivo para ver el código."}
              </pre>
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default CodePanel;
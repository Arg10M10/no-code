"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProjectFile } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { Copy, FileText, ChevronRight, Save, FileCode } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodePanelProps {
  files?: ProjectFile[] | null;
  onSaveFile?: (path: string, content: string) => void;
}

const CodePanel: React.FC<CodePanelProps> = ({ files, onSaveFile }) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);

  // Inicializar el primer archivo al cargar
  useEffect(() => {
    if (files && files.length > 0 && !selectedPath) {
      const first = files[0];
      setSelectedPath(first.path);
      setEditContent(first.content);
    }
  }, [files, selectedPath]);

  // Sincronizar contenido al cambiar de archivo
  const handleSelectFile = (file: ProjectFile) => {
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Deseas descartarlos?")) {
      return;
    }
    setSelectedPath(file.path);
    setEditContent(file.content);
    setIsDirty(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (selectedPath && onSaveFile) {
      onSaveFile(selectedPath, editContent);
      setIsDirty(false);
      toast.success(`Archivo "${selectedPath}" guardado con éxito.`);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editContent);
    toast.success(`Código copiado al portapapeles`);
  };

  if (!files || files.length === 0) {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-background text-muted-foreground p-8 text-center">
            <FileCode className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">No hay archivos en este proyecto todavía.</p>
            <p className="text-xs mt-1">Genera código con la IA para empezar.</p>
        </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* Toolbar Superior */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Editor</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            <span className="text-xs font-semibold truncate text-primary">{selectedPath}</span>
            {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-[10px] font-bold">
                <Copy className="h-3 w-3 mr-2" /> COPIAR
            </Button>
            <Button 
                variant="default" 
                size="sm" 
                onClick={handleSave} 
                disabled={!isDirty}
                className="h-7 text-[10px] font-bold bg-primary hover:bg-primary/90"
            >
                <Save className="h-3 w-3 mr-2" /> GUARDAR
            </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Explorador de archivos lateral */}
        <aside className="w-52 border-r bg-muted/5 overflow-y-auto hidden md:block shrink-0">
          <div className="p-2 space-y-0.5">
            {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => handleSelectFile(file)}
                  className={cn(
                    "w-full text-left text-[11px] px-2 py-1.5 rounded flex items-center gap-2 transition-all",
                    selectedPath === file.path
                      ? "bg-primary/10 text-primary font-bold shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <FileText className={cn("h-3.5 w-3.5 shrink-0", selectedPath === file.path ? "text-primary" : "text-muted-foreground/50")} />
                  <span className="truncate">{file.path}</span>
                </button>
            ))}
          </div>
        </aside>

        {/* Área del Editor (Textarea con estilo de código) */}
        <main className="flex-1 min-w-0 bg-[#0d0d0d] flex flex-col relative group">
          <textarea
            value={editContent}
            onChange={handleContentChange}
            spellCheck={false}
            className="flex-1 w-full h-full p-6 bg-transparent text-zinc-300 font-mono text-[13px] leading-relaxed resize-none outline-none focus:ring-0 selection:bg-primary/30"
            placeholder="Escribe tu código aquí..."
          />
          <div className="absolute bottom-4 right-6 text-[10px] font-mono text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {editContent.length} caracteres | {editContent.split('\n').length} líneas
          </div>
        </main>
      </div>
    </div>
  );
};

export default CodePanel;
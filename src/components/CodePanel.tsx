"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProjectFile } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { Copy, FileText, ChevronRight, Save, FileCode, Search } from "lucide-react";
import { toast } from "sonner";

interface CodePanelProps {
  files?: ProjectFile[] | null;
  onSaveFile?: (path: string, content: string) => void;
}

const CodePanel: React.FC<CodePanelProps> = ({ files, onSaveFile }) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Al cargar archivos por primera vez, seleccionar el archivo principal
  useEffect(() => {
    if (files && files.length > 0 && !selectedPath) {
      const mainFile = files.find(f => f.path.includes("App.tsx")) || files[0];
      setSelectedPath(mainFile.path);
      setEditContent(mainFile.content);
    }
  }, [files, selectedPath]);

  const handleSelectFile = (file: ProjectFile) => {
    if (isDirty && !window.confirm("Hay cambios sin guardar. ¿Deseas descartarlos?")) {
      return;
    }
    setSelectedPath(file.path);
    setEditContent(file.content);
    setIsDirty(false);
  };

  const handleSave = () => {
    if (selectedPath && onSaveFile) {
      onSaveFile(selectedPath, editContent);
      setIsDirty(false);
      toast.success(`Archivo "${selectedPath}" actualizado.`);
    }
  };

  const filteredFiles = files?.filter(f => 
    f.path.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center bg-background">
        <FileCode className="h-16 w-16 mb-4 opacity-10" />
        <h3 className="text-lg font-medium">Sin archivos todavía</h3>
        <p className="text-sm max-w-xs">La IA generará los archivos de tu proyecto aquí en un momento.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden border-t">
      {/* Explorador de Archivos (Sidebar) */}
      <aside className="w-64 border-r flex flex-col bg-muted/5 shrink-0">
        <div className="p-3 border-b bg-muted/10">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border rounded-md pl-7 pr-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {filteredFiles.map((file) => (
            <button
              key={file.path}
              onClick={() => handleSelectFile(file)}
              className={cn(
                "w-full text-left text-[11px] px-3 py-2 rounded-md flex items-center gap-2 transition-all group",
                selectedPath === file.path
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <FileText className={cn("h-3.5 w-3.5 shrink-0 opacity-50", selectedPath === file.path && "opacity-100")} />
              <span className="truncate">{file.path}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Área del Editor */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0d0d0d]">
        {/* Barra de herramientas del Editor */}
        <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-black/40">
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 overflow-hidden">
            <span className="uppercase tracking-widest opacity-50">SRC</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-300 truncate font-semibold">{selectedPath}</span>
            {isDirty && (
              <span className="flex items-center gap-1.5 ml-2 text-amber-500/80 animate-pulse">
                <div className="h-1.5 w-1.5 rounded-full bg-current" />
                Sin guardar
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                navigator.clipboard.writeText(editContent);
                toast.success("Copiado al portapapeles");
              }}
              className="h-7 text-[10px] text-zinc-400 hover:text-white"
            >
              <Copy className="h-3 w-3 mr-1.5" /> COPIAR
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={!isDirty}
              className="h-7 text-[10px] font-bold bg-primary hover:bg-primary/90"
            >
              <Save className="h-3 w-3 mr-1.5" /> GUARDAR
            </Button>
          </div>
        </div>

        {/* Editor de Texto (Textarea) */}
        <div className="flex-1 relative">
          <textarea
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              setIsDirty(true);
            }}
            spellCheck={false}
            className="absolute inset-0 w-full h-full p-6 bg-transparent text-zinc-300 font-mono text-[13px] leading-relaxed resize-none outline-none focus:ring-0 selection:bg-primary/30 custom-scrollbar"
            placeholder="Selecciona un archivo para editar..."
          />
        </div>
      </main>
    </div>
  );
};

export default CodePanel;
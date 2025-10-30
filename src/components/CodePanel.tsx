"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ProjectFile } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { Copy, FileText } from "lucide-react";
import { toast } from "sonner";

interface CodePanelProps {
  files?: ProjectFile[] | null;
}

const CodePanel: React.FC<CodePanelProps> = ({ files }) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    if (files && files.length > 0 && !selectedPath) {
      setSelectedPath(files[0].path);
    } else if (files && !files.find(f => f.path === selectedPath)) {
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
      toast.success(`Copied ${selectedFile.path} to clipboard!`);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-background/70">
        <div className="text-sm font-medium">Generated Files</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} title="Copy code" disabled={!selectedFile}>
            <Copy className="h-3.5 w-3.5 mr-2" />
            Copy Code
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden md:block border-r bg-background/50 p-3 overflow-y-auto">
          <div className="text-xs text-muted-foreground mb-2 px-2">Files</div>
          {files && files.length > 0 ? (
            <ul className="space-y-1">
              {files.map((file) => (
                <li key={file.path}>
                  <button
                    onClick={() => setSelectedPath(file.path)}
                    className={cn(
                      "w-full text-left text-sm px-2 py-1.5 rounded-md cursor-pointer truncate flex items-center gap-2",
                      selectedPath === file.path
                        ? "bg-secondary/60 border border-border/60 font-medium text-foreground"
                        : "text-muted-foreground hover:bg-secondary/40"
                    )}
                    title={file.path}
                  >
                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-muted-foreground px-2 py-1">No code generated yet.</div>
          )}
        </aside>

        <section className="min-w-0 overflow-hidden">
          <div className="h-full w-full overflow-auto">
            <pre className="m-0 p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-mono bg-background text-foreground">
              {selectedFile ? selectedFile.content : "Select a file to view its content."}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CodePanel;
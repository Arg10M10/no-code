"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodePanelProps {
  files?: Record<string, string> | null;
}

const CodePanel: React.FC<CodePanelProps> = ({ files }) => {
  const [activeFile, setActiveFile] = useState<string>("index.html");

  useEffect(() => {
    // Si los archivos cambian y el activo ya no existe, selecciona el primero.
    if (files && !files[activeFile]) {
      const firstFile = Object.keys(files)[0];
      if (firstFile) {
        setActiveFile(firstFile);
      }
    }
  }, [files, activeFile]);

  const handleCopy = async () => {
    if (files && files[activeFile]) {
      await navigator.clipboard.writeText(files[activeFile]);
    }
  };

  const fileList = Object.keys(files || {});

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-background/70">
        <div className="text-sm font-medium">Generated Files</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} title="Copy code" disabled={!files || !files[activeFile]}>
            Copy Code
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden md:block border-r bg-background/50 p-3 overflow-y-auto">
          <div className="text-xs text-muted-foreground mb-2">Files</div>
          {fileList.length > 0 ? (
            <ul className="space-y-1">
              {fileList.map((path) => (
                <li
                  key={path}
                  onClick={() => setActiveFile(path)}
                  className={cn(
                    "text-sm px-2 py-1 rounded-md cursor-pointer truncate",
                    activeFile === path
                      ? "bg-secondary/60 border border-border/60 font-medium"
                      : "hover:bg-secondary/40"
                  )}
                  title={path}
                >
                  {path}
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
              {(files && files[activeFile]) ?? "AI is generating code..."}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CodePanel;
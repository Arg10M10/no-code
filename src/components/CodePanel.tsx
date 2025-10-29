"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { projectFiles } from "@/lib/project-files";
import { cn } from "@/lib/utils";

const CodePanel: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState(projectFiles[0]);

  const handleCopy = async () => {
    if (selectedFile) {
      await navigator.clipboard.writeText(selectedFile.content);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-background/70">
        <div className="text-sm font-medium">Project Files</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} title="Copy code">
            Copy Code
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sidebar de archivos */}
        <aside className="hidden md:block border-r bg-background/50 p-3 overflow-y-auto">
          <div className="text-xs text-muted-foreground mb-2">Files</div>
          <ul className="space-y-1">
            {projectFiles.map((file) => (
              <li
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={cn(
                  "text-sm px-2 py-1 rounded-md cursor-pointer truncate",
                  selectedFile.path === file.path
                    ? "bg-secondary/60 border border-border/60 font-medium"
                    : "hover:bg-secondary/40"
                )}
                title={file.path}
              >
                {file.path}
              </li>
            ))}
          </ul>
        </aside>

        {/* Viewer de código */}
        <section className="min-w-0 overflow-hidden">
          <div className="h-full w-full overflow-auto">
            <pre className="m-0 p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-mono bg-background text-foreground">
              {selectedFile?.content || "Select a file to view its content."}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CodePanel;
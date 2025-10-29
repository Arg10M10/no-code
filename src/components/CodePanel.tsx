"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface CodePanelProps {
  code?: string | null;
}

const CodePanel: React.FC<CodePanelProps> = ({ code }) => {
  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
    }
  };

  // FIX: Check for null/undefined explicitly, not just falsiness.
  // An empty string "" is a valid state (an empty file) and should be displayed.
  const file = code != null ? { path: "index.html", content: code } : null;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-background/70">
        <div className="text-sm font-medium">Generated Files</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} title="Copy code" disabled={!code}>
            Copy Code
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden md:block border-r bg-background/50 p-3 overflow-y-auto">
          <div className="text-xs text-muted-foreground mb-2">Files</div>
          {file ? (
            <ul className="space-y-1">
              <li
                key={file.path}
                className="text-sm px-2 py-1 rounded-md cursor-pointer truncate bg-secondary/60 border border-border/60 font-medium"
                title={file.path}
              >
                {file.path}
              </li>
            </ul>
          ) : (
            <div className="text-xs text-muted-foreground px-2 py-1">No code generated yet.</div>
          )}
        </aside>

        <section className="min-w-0 overflow-hidden">
          <div className="h-full w-full overflow-auto">
            <pre className="m-0 p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-mono bg-background text-foreground">
              {/* FIX: Render file.content directly if file exists, otherwise show the loading message. */}
              {file ? file.content : "AI is generating code..."}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CodePanel;
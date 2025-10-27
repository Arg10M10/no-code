"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type CodePanelProps = {
  code: string | null;
  projectName?: string;
};

const CodePanel: React.FC<CodePanelProps> = ({ code, projectName }) => {
  const fileName = (projectName?.trim() || "project").replace(/[^\w.-]+/g, "-").toLowerCase();
  const indexHtml = code || "<!DOCTYPE html>\n<html><head><meta charset=\"utf-8\" /><title>Empty</title></head><body><h1>No code yet</h1></body></html>";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(indexHtml);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    // Estructura mínima del sitio: index.html
    zip.file("index.html", indexHtml);
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${fileName || "site"}.zip`);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([indexHtml], { type: "text/html;charset=utf-8" });
    saveAs(blob, `${fileName || "index"}.html`);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-background/70">
        <div className="text-sm font-medium">Files</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} title="Copiar código">
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadHtml} title="Descargar index.html">
            Download HTML
          </Button>
          <Button size="sm" onClick={handleDownloadZip} title="Descargar sitio como .zip">
            Download ZIP
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sidebar de archivos */}
        <aside className="hidden md:block border-r bg-background/50 p-3">
          <div className="text-xs text-muted-foreground mb-2">Proyecto</div>
          <div className="text-sm font-medium truncate mb-3">{projectName || "Project"}</div>
          <div className="text-xs text-muted-foreground mb-1">Archivos</div>
          <ul className="space-y-1">
            <li className="text-sm px-2 py-1 rounded-md bg-secondary/60 border border-border/60">index.html</li>
          </ul>
        </aside>

        {/* Viewer de código */}
        <section className="min-w-0 overflow-hidden">
          <div className="h-full w-full overflow-auto">
            <pre className="m-0 p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-mono bg-background text-foreground">
{indexHtml}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CodePanel;
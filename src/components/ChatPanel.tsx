"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Globe } from "lucide-react";
import { webSearch, WebResult } from "@/lib/webSearch";

// Props esperadas por Editor; las tipamos de forma laxa para no depender de tipos internos.
type ChatPanelProps = {
  messages?: any[];
  loading?: boolean;
  credits?: number;
  onSend?: (text: string, image?: File) => Promise<void>;
  selectedElement?: string;
  onClearSelection?: () => void;
};

const ChatPanel: React.FC<ChatPanelProps> = (_props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [webOn, setWebOn] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  // Intercepta el submit del primer form del panel para añadir contexto web si está activo.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const form: HTMLFormElement | null = root.querySelector("form");
    if (!form) return;

    const handler = async (e: Event) => {
      if (!webOn || busy) return;

      const alreadyAugmented = (form as any).__web_augmented === true;
      if (alreadyAugmented) return;

      const input = form.querySelector<HTMLTextAreaElement | HTMLInputElement>(
        "textarea, input[type='text']"
      );
      if (!input) return;

      const original = input.value?.trim?.() ?? "";
      if (!original) return;

      e.preventDefault();
      e.stopPropagation();

      setBusy(true);
      toast.message("Buscando en internet…", {
        description: "Añadiendo contexto al mensaje antes de enviarlo.",
      });

      try {
        const results: WebResult[] = await webSearch(original);
        const top = results.slice(0, 3);

        if (top.length === 0) {
          toast.warning("No se encontraron resultados relevantes");
          (form as any).__web_augmented = true;
          form.requestSubmit();
          return;
        }

        const contexto =
          [
            "Contexto web (resumen):",
            ...top.map((r) => {
              const t = r.title?.trim() || "Resultado";
              const u = r.url?.trim() || "";
              const s = (r.text || "").trim();
              return `- ${t}${u ? ` (${u})` : ""}${s ? `: ${s}` : ""}`;
            }),
            "",
          ].join("\n");

        input.value = `${contexto}${original}`;

        (form as any).__web_augmented = true;
        form.requestSubmit();
        toast.success("Contexto web añadido");
      } catch (err: any) {
        toast.error("Error en la búsqueda web", {
          description:
            err?.message ||
            "Revisa tu conexión. Si persiste, intenta de nuevo más tarde.",
        });
        (form as any).__web_augmented = true;
        form.requestSubmit();
      } finally {
        setBusy(false);
        setTimeout(() => {
          if ((form as any).__web_augmented) {
            delete (form as any).__web_augmented;
          }
        }, 2000);
      }
    };

    form.addEventListener("submit", handler, true);
    return () => {
      form.removeEventListener("submit", handler, true);
    };
  }, [webOn, busy]);

  const btnClass =
    "inline-flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors";
  const activeClass = webOn
    ? "bg-blue-600/10 text-blue-400 border-blue-600"
    : "bg-transparent text-muted-foreground border-border hover:bg-accent/50";

  return (
    <div ref={rootRef} className="h-full flex flex-col">
      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 justify-start flex-wrap">
            <span className="text-xs font-medium opacity-80">Pro</span>
            <button
              type="button"
              onClick={() => setWebOn((v) => !v)}
              className={`${btnClass} ${activeClass}`}
              title="Buscar en internet para este mensaje"
              aria-pressed={webOn}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Web</span>
            </button>
            {webOn && (
              <span className="text-[10px] text-blue-400">
                activo: se añadirá contexto web al enviar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end flex-wrap">
            {/* Mantén aquí otros controles existentes del panel si los tienes */}
          </div>
        </div>
      </div>

      {/* Mantén el resto del ChatPanel existente (lista de mensajes, input, etc.) */}
    </div>
  );
};

export default ChatPanel;
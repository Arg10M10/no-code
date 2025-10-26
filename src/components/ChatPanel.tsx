"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUp } from "lucide-react";
import Loader from "@/components/Loader";
import { StoredMessage } from "@/lib/projects";

interface ChatPanelProps {
  messages: StoredMessage[];
  loading: boolean;
  credits: number;
  onSend: (text: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, loading, credits, onSend }) => {
  const [input, setInput] = React.useState<string>("");

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading || credits <= 0) return;
    setInput("");
    onSend(text);
  };

  return (
    <div className="relative h-full">
      <ScrollArea className="h-full pr-1">
        <div className="px-3 sm:px-4 pb-28 pt-3 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Empieza enviando un mensaje a la IA: describe qué web quieres generar o modificar.
            </p>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={[
                  "rounded-xl border p-3 text-sm leading-relaxed",
                  m.role === "user" ? "bg-secondary/60 border-border/60" : "bg-card/60 border-border/60",
                ].join(" ")}
              >
                <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {m.role === "user" ? "Tú" : "Asistente"}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))
          )}

          {loading && (
            <div className="rounded-xl border border-border/60 p-4 bg-card/60 flex items-center gap-4">
              <Loader aria-label="Generando respuesta de la IA" />
              <div className="text-sm text-muted-foreground">Generando respuesta…</div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Composer flotante */}
      <div className="absolute left-2 right-2 bottom-2">
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60 p-2 shadow-lg">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe qué quieres construir o cambiar…"
              className="w-full h-24 bg-transparent rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="absolute left-3 bottom-2 flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full border bg-background/60">Chat</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full border bg-background/60">Ctrl/⌘ + Enter</span>
            </div>
            <div className="absolute right-2 bottom-2">
              <Button
                size="icon"
                className="rounded-full"
                onClick={handleSend}
                disabled={loading || !input.trim() || credits <= 0}
                title={credits <= 0 ? "Sin créditos disponibles" : "Enviar"}
              >
                <ArrowUp className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground px-1">
            Créditos restantes: <span className="text-foreground font-medium">{credits}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
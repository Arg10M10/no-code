"use client";

import React, { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoredMessage } from "@/lib/projects";

type ChatPanelProps = {
  messages: StoredMessage[];
  loading?: boolean;
  credits?: number;
  onSend: (text: string, image?: File | null) => void;
  selectedElement?: string | null;
  onClearSelection?: () => void;
};

const LoadingDots: React.FC = () => {
  return (
    <div className="flex items-center space-x-1">
      <span
        className="w-2 h-2 bg-gray-400 rounded-full inline-block animate-bounce"
        style={{ animationDelay: "0s" }}
        aria-hidden
      />
      <span
        className="w-2 h-2 bg-gray-400 rounded-full inline-block animate-bounce"
        style={{ animationDelay: "150ms" }}
        aria-hidden
      />
      <span
        className="w-2 h-2 bg-gray-400 rounded-full inline-block animate-bounce"
        style={{ animationDelay: "300ms" }}
        aria-hidden
      />
    </div>
  );
};

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  loading = false,
  credits = 0,
  onSend,
  selectedElement,
  onClearSelection,
}) => {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.scrollTop = el.scrollHeight;
    }, 50);
    return () => clearTimeout(t);
  }, [messages, loading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text && !file) return;
    onSend(text, file);
    setInput("");
    setFile(null);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0">
        <div
          ref={scrollRef}
          className="p-4 space-y-4"
          aria-live="polite"
        >
          {messages.map((msg, index) => {
            const isAssistant = msg.role === "assistant";
            return (
              <div key={`${msg.createdAt}-${index}`} className="min-w-0">
                <div
                  className={`rounded-lg p-3 ${
                    isAssistant ? "bg-slate-800 text-slate-100" : "bg-white/5 text-white"
                  }`}
                >
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </pre>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="min-w-0">
              <div className="rounded-lg p-3 bg-slate-800 text-slate-100 flex items-center">
                <LoadingDots />
                <span className="ml-2 text-sm text-slate-200">Generando...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t px-4 py-3 flex-shrink-0">
        {selectedElement ? (
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-muted-foreground truncate">
              Seleccionado: {selectedElement}
            </div>
            <button
              onClick={() => onClearSelection && onClearSelection()}
              className="text-sm text-blue-400 hover:underline"
            >
              Limpiar
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-md border px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="hidden"
              aria-hidden
            />
            <span className="px-2 py-1 rounded bg-muted text-xs">📎</span>
          </label>
          <button
            type="submit"
            className="ml-1 rounded bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm text-white"
          >
            Enviar
          </button>
        </form>

        <div className="mt-2 text-xs text-muted-foreground">
          Créditos: {credits}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
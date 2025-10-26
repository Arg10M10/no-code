"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StoredMessage } from "@/lib/projects";

type ChatPanelProps = {
  messages: StoredMessage[];
  loading?: boolean;
  credits?: number;
  onSend: (text: string) => void;
};

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, loading = false, credits = 0, onSend }) => {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    const el = document.getElementById("chat-list");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
    setSelectedImage(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedImage(file);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="text-sm font-semibold">Chat</div>
        <div className="text-sm text-muted-foreground">Créditos: {credits}</div>
      </div>

      <div id="chat-list" className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">No hay mensajes aún. Empieza la conversación.</div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`max-w-full ${m.role === "user" ? "ml-auto text-right" : "mr-auto text-left"}`}>
            <div className={`inline-block px-3 py-2 rounded-lg ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {m.content}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 pt-2 border-t">
        <div className="mb-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Escribe un mensaje..."
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Left side: removed the tip text as requested */}
          <div className="text-xs text-muted-foreground flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <span className="text-sm underline">Adjuntar imagen</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              {selectedImage ? `${selectedImage.name}` : ""}
            </div>
            <Button onClick={handleSend} disabled={loading || input.trim() === ""}>
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
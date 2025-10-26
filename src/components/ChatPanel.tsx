"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Plus, Monitor, ImageUp, History } from "lucide-react";
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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || credits <= 0) return;
    setInput("");
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              {msg.role === "assistant" && (
                <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm shrink-0">
                  D
                </div>
              )}
              <div
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <p className="font-bold text-sm mb-1">
                  {msg.role === "user" ? "Tú" : "Asistente"}
                </p>
                <div
                  className={`p-3 rounded-lg max-w-md ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
              {msg.role === "user" && (
                <div className="bg-muted text-muted-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm shrink-0">
                  T
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm shrink-0">
                D
              </div>
              <div className="flex flex-col items-start">
                <p className="font-bold text-sm mb-1">Asistente</p>
                <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                  <Loader aria-label="Generando respuesta..." />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border/40 bg-background/80 backdrop-blur-sm flex-shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe los cambios que quieres hacer..."
            className="pr-20 pl-12 min-h-[48px] resize-none"
            rows={1}
            disabled={loading}
          />
          <div className="absolute left-2 bottom-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  disabled={loading}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-2 mb-2"
                side="top"
                align="start"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    className="justify-start px-2 py-1.5 h-auto text-sm font-normal"
                    type="button"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Subir screenshot
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start px-2 py-1.5 h-auto text-sm font-normal"
                    type="button"
                  >
                    <ImageUp className="h-4 w-4 mr-2" />
                    Subir foto
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start px-2 py-1.5 h-auto text-sm font-normal"
                    type="button"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Ver historial
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 bottom-2 h-8 w-8"
            disabled={loading || !input.trim() || credits <= 0}
            title={credits <= 0 ? "Sin créditos disponibles" : "Enviar"}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="mt-2 text-center text-[11px] text-muted-foreground">
          Créditos restantes: <span className="text-foreground font-medium">{credits}</span>. Presiona <kbd className="px-1.5 py-0.5 text-xs font-semibold text-foreground bg-muted border rounded">⌘</kbd> + <kbd className="px-1.5 py-0.5 text-xs font-semibold text-foreground bg-muted border rounded">Enter</kbd> para enviar.
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
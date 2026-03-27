"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { StoredMessage } from "@/lib/projects";
import { ArrowUp, X, Cpu, Paperclip, Globe, Zap, Sparkles, RotateCcw, Eye, Undo2, Smile } from "lucide-react";
import { ThinkingProcess } from "./ThinkingProcess";
import { FileChangeList, FileChange } from "./FileChangeList";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ModelsPopover from "./ModelsPopover";
import { getSelectedModelLabel, setSelectedModelLabel } from "@/lib/settings";
import { cn } from "@/lib/utils";

type ChatPanelProps = {
  messages: StoredMessage[];
  loading: boolean;
  credits: number;
  onSend: (text: string, images?: File[]) => void;
  onCancel: () => void;
  selectedElement: string | null;
  onClearSelection: () => void;
  generationLogs?: string[];
  thought?: string;
  codeStream?: string;
  onRetry?: (text: string, images?: string[]) => void;
};

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  loading,
  onSend,
  onCancel,
  selectedElement,
  onClearSelection,
  generationLogs = [],
  thought,
  codeStream,
}) => {
  const [text, setText] = React.useState("");
  const [selectedImages, setSelectedImages] = React.useState<File[]>([]);
  const [selectedModel, setSelectedModel] = React.useState<string>(getSelectedModelLabel());
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, generationLogs]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading || !text.trim()) return;
    onSend(text.trim(), selectedImages);
    setText("");
    setSelectedImages([]);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-8 p-6">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-4 animate-fade-in-up", msg.role === 'user' ? "justify-end" : "justify-start")}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div className={cn(
                "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' ? "bg-secondary text-foreground rounded-tr-sm" : "text-foreground/90"
              )}>
                {msg.content.split('---CHANGES---')[0]}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 animate-fade-in-up">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                <Cpu className="h-4 w-4 text-muted-foreground animate-pulse" />
              </div>
              <div className="flex-1">
                <ThinkingProcess logs={generationLogs} thought={thought} codeStream={codeStream} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area Rediseñado */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t">
        <form onSubmit={handleSubmit} className="relative bg-secondary/50 border rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
            placeholder="Pregunta o describe un cambio..."
            className="w-full min-h-[44px] max-h-32 bg-transparent text-sm resize-none outline-none px-3 py-2"
            rows={1}
          />
          
          <div className="flex items-center justify-between mt-2 px-2">
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Smile className="h-4 w-4" /></Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-muted-foreground gap-1.5 px-2">
                    <Cpu className="h-3 w-3" /> {selectedModel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="top">
                  <ModelsPopover selectedModel={selectedModel} onSelectModel={(m) => (setSelectedModel(m), setSelectedModelLabel(m))} />
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" size="icon" className="h-8 w-8 rounded-xl bg-primary text-white" disabled={loading || !text.trim()}>
              {loading ? <X className="h-4 w-4" onClick={onCancel} /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
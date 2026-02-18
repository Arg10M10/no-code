"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { StoredMessage } from "@/lib/projects";
import { ArrowUp, X, Cpu, Square, Plus, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import TypingIndicator from "./TypingIndicator";
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
};

const MODEL_TOKEN_LIMIT = 1_000_000;

const isErrorMessage = (content: string) => {
  const lowerContent = content.toLowerCase();
  return lowerContent.includes('ha fallado') || 
         lowerContent.includes('atención!') || 
         lowerContent.includes('missing api key') ||
         lowerContent.includes('cancelled');
};

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  loading,
  credits,
  onSend,
  onCancel,
  selectedElement,
  onClearSelection,
}) => {
  const navigate = useNavigate();
  const [text, setText] = React.useState("");
  const [chatMode, setChatMode] = React.useState<'build' | 'ask'>('build');

  const [selectedImages, setSelectedImages] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const [selectedModel, setSelectedModel] = React.useState<string>(getSelectedModelLabel());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  React.useEffect(() => {
    const urls = selectedImages.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [selectedImages]);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(Boolean);
    e.currentTarget.value = "";

    if (files.length === 0) return;
    setSelectedImages((prev) => [...prev, ...files]);
  };

  const removeImageAt = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearImages = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImages([]);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading || (!text.trim() && selectedImages.length === 0)) return;
    
    const messageToSend = chatMode === 'ask' ? `[ASK] ${text.trim()}` : text.trim();
    
    onSend(messageToSend, selectedImages.length ? selectedImages : undefined);
    
    setText("");
    clearImages();
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Extract short model name for the button (e.g. "GPT-5" from "OpenAI - GPT-5")
  const shortModelName = selectedModel.split(" - ")[1] || selectedModel;

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {messages.map((msg, index) => {
            const isAssistant = msg.role === "assistant";
            const isUser = msg.role === "user";
            const key = msg.createdAt ? `${msg.createdAt}-${index}` : `${index}`;
            const isError = isAssistant && isErrorMessage(msg.content);

            return (
              <div key={key} className="min-w-0 animate-fade-in-up">
                <div
                  className={[
                    "p-3 rounded-lg border shadow-sm",
                    isError
                      ? "bg-yellow-500/10 border-yellow-500/60"
                      : isAssistant
                      ? "bg-muted/50 border-border" // More neutral for assistant
                      : isUser
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted-foreground/5 border-transparent",
                  ].join(" ")}
                >
                  {isUser && msg.images && msg.images.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {msg.images.map((url, idx) => (
                        <div key={idx} className="relative h-16 w-16 rounded-md overflow-hidden border border-white/10 shrink-0 group cursor-pointer">
                          <img 
                            src={url} 
                            alt={`Attachment ${idx + 1}`} 
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110 bg-black/5" 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <p
                    className={[
                      "text-sm leading-relaxed break-words whitespace-pre-wrap",
                      isError
                        ? "text-yellow-500 dark:text-yellow-400"
                        : "text-foreground",
                    ].join(" ")}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="min-w-0 animate-fade-in-up">
              <div
                className="p-3 rounded-lg bg-muted/50 border border-border flex items-center w-fit"
              >
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {selectedElement && (
        <div className="px-4 pt-2">
          <div className="bg-secondary/50 border border-border rounded-md p-2 flex items-center justify-between gap-2 text-sm animate-fade-in-up">
            <span className="text-muted-foreground truncate flex items-center gap-2">
              <CornerDownLeft className="h-3 w-3" />
              Editing: <code className="text-foreground font-medium bg-background px-1.5 py-0.5 rounded">{selectedElement}</code>
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={onClearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 bg-background">
        <div className="rounded-2xl border border-border bg-card/40 p-3 shadow-sm focus-within:ring-1 focus-within:ring-ring/50 focus-within:border-ring/50 transition-all">
          
          {/* Top Suggestion (Visual match) */}
          <div className="mb-2">
             <button 
                type="button"
                onClick={() => setText("Keep going")}
                className="text-[10px] font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground px-2 py-1 rounded-md transition-colors border border-border/50"
             >
                Keep going
             </button>
          </div>

          {/* Attachments Preview */}
          {selectedImages.length > 0 && (
            <div className="mb-2 px-1 flex flex-wrap gap-2">
              {selectedImages.map((file, idx) => (
                <div key={idx} className="group relative flex items-center gap-2 bg-secondary/50 border border-border rounded-lg p-1.5 pr-2">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-background">
                    <img src={previewUrls[idx]} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] truncate max-w-[100px]">{file.name}</span>
                      <span className="text-[9px] text-muted-foreground">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImageAt(idx)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                      <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Input Row */}
          <div className="flex gap-2 relative min-h-[40px]">
             <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={selectedElement ? "Describe changes..." : "Ask Framio to build..."}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-sm leading-relaxed py-1.5 max-h-32 scrollbar-hide"
              rows={1}
              disabled={loading}
              style={{ minHeight: '24px' }}
            />
            <div className="flex items-start pt-1">
               {loading ? (
                <Button
                  type="button"
                  onClick={onCancel}
                  size="icon"
                  className="h-7 w-7 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Square className="h-3 w-3" fill="currentColor" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!text.trim() && selectedImages.length === 0}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-transparent"
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between mt-3 pt-2">
            <div className="flex items-center gap-2">
              {/* Build/Ask Toggle */}
              <button
                type="button"
                className={cn(
                  "h-7 px-3 text-xs font-medium rounded-lg transition-all border select-none",
                  chatMode === 'build' 
                    ? "bg-foreground text-background border-foreground hover:opacity-90" 
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                )}
                onClick={() => setChatMode(prev => (prev === 'build' ? 'ask' : 'build'))}
              >
                {chatMode === 'build' ? 'Build' : 'Ask'}
              </button>

              {/* Model Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-7 px-3 text-xs font-medium rounded-lg transition-all border border-transparent hover:bg-secondary hover:text-foreground bg-transparent text-muted-foreground flex items-center gap-1.5 select-none"
                  >
                    <span>{shortModelName}</span>
                    {/* Intentionally hidden 'Pro' badge logic here based on request */}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="top">
                  <ModelsPopover
                    selectedModel={selectedModel}
                    onSelectModel={(label) => {
                      setSelectedModel(label);
                      setSelectedModelLabel(label);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Attachments Button */}
            <div className="flex items-center gap-1">
               <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                onClick={handleAttachClick}
                title="Add attachment"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
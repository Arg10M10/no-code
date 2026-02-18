"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { StoredMessage } from "@/lib/projects";
import { ArrowUp, X, Cpu, Square, Plus, Paperclip, Globe, Zap, Image as ImageIcon } from "lucide-react";
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

const MODEL_TOKEN_LIMIT = 100_000; // Adjusted based on typical usage

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
  const [showCredits, setShowCredits] = React.useState(false);

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

  // Logic: Show USAGE (filling up). 
  // Used = Limit - Remaining(credits)
  const usedCredits = Math.max(0, MODEL_TOKEN_LIMIT - credits);
  const percentUsed = Math.min(100, Math.max(0, (usedCredits / MODEL_TOKEN_LIMIT) * 100));

  return (
    <div className="flex flex-col h-full">
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
                      ? "bg-green-500/10 border-green-500/60"
                      : isUser
                      ? "bg-blue-500/10 border-blue-500/60"
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
                            title="Click to view full size"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <p
                    className={[
                      "text-sm leading-relaxed break-words",
                      isError
                        ? "text-yellow-200"
                        : isAssistant
                        ? "text-green-200"
                        : isUser
                        ? "text-blue-200"
                        : "text-muted-foreground",
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
                className="p-3 rounded-lg bg-green-500/10 border border-green-500/60 flex items-center"
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
          <div className="bg-secondary border border-border rounded-md p-2 flex items-center justify-between gap-2 text-sm animate-fade-in-up">
            <span className="text-muted-foreground truncate">
              Editing: <code className="text-foreground font-medium bg-background/50 px-1.5 py-0.5 rounded">{selectedElement}</code>
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={onClearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4">
        <div className="rounded-xl bg-secondary border border-border shadow-sm flex flex-col">
          {selectedImages.length > 0 ? (
            <div className="pt-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground font-medium">
                  {selectedImages.length} {selectedImages.length === 1 ? 'image' : 'images'} attached
                </div>
                <button
                  type="button"
                  onClick={clearImages}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedImages.map((file, idx) => (
                  <div key={idx} className="group relative flex items-center gap-2 bg-secondary/40 border border-white/5 rounded-lg p-1.5 pr-2 transition-all hover:bg-secondary/60">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-white/10">
                      <img src={previewUrls[idx]} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] text-muted-foreground font-medium">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImageAt(idx)}
                      className="ml-1 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-white/10"
                    >
                       <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Text Area and Send Button Row */}
          <div className="flex items-start gap-2 p-3">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={selectedElement ? "Describe the changes..." : (chatMode === 'build' ? "Ask AI to build..." : "Ask AI a question...")}
              className="resize-none flex-1 min-h-[44px] max-h-36 bg-transparent text-foreground placeholder:text-muted-foreground outline-none px-2 py-2 text-sm"
              rows={1}
              aria-label="Message"
              disabled={loading}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              aria-hidden
            />

            {loading ? (
              <Button
                type="button"
                onClick={onCancel}
                className="h-8 w-8 rounded-lg p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 mt-1.5 flex-shrink-0"
                aria-label="Cancel Generation"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!text.trim() && selectedImages.length === 0}
                className="h-8 w-8 rounded-lg p-0 bg-primary text-primary-foreground hover:bg-primary/90 mt-1.5 flex-shrink-0"
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="px-3 pb-2 border-t border-border/50">
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-xs font-medium px-3 py-1.5 rounded-full transition-all select-none bg-background/50 border border-border text-foreground hover:bg-background shadow-sm hover:shadow"
                  onClick={() => {
                    setChatMode(prev => (prev === 'build' ? 'ask' : 'build'));
                  }}
                >
                  {chatMode === 'build' ? 'Build' : 'Ask'}
                </button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto gap-1.5 px-3 py-1.5 text-xs font-medium transition-all bg-background/50 border-border text-foreground select-none hover:bg-background rounded-full shadow-sm hover:shadow"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[100px]">{selectedModel}</span>
                    </Button>
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

              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md p-0 text-muted-foreground hover:text-foreground hover:bg-background/50"
                      title="More Actions"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="end" className="w-[200px] p-1.5">
                    <div className="space-y-0.5">
                      <button
                        className="w-full flex items-center gap-2.5 px-2 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors text-left"
                        onClick={handleAttachClick}
                      >
                         <Paperclip className="w-4 h-4 text-muted-foreground" />
                         <span>Attach Image</span>
                      </button>

                      <button
                        className="w-full flex items-center gap-2.5 px-2 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors text-left"
                        onClick={() => setShowCredits(!showCredits)}
                      >
                         <Zap className={cn("w-4 h-4", showCredits ? "text-primary" : "text-muted-foreground")} />
                         <span>{showCredits ? "Hide Token Usage" : "Show Token Usage"}</span>
                      </button>

                      <button
                        className="w-full flex items-center gap-2.5 px-2 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors text-left"
                        onClick={() => {
                          toast.info("Web search coming soon!");
                        }}
                      >
                         <Globe className="w-4 h-4 text-muted-foreground" />
                         <span>Web Search</span>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Token/Credits Bar (Collapsible & Usage Logic) */}
            {showCredits && (
              <div className="mt-3 mb-1 animate-fade-in">
                 <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1.5 px-0.5">
                    <span className="flex items-center gap-1.5">
                      Usage: <span className="text-foreground font-medium">{usedCredits.toLocaleString()}</span> / {MODEL_TOKEN_LIMIT.toLocaleString()}
                    </span>
                    <span className="opacity-70">{percentUsed.toFixed(0)}%</span>
                 </div>
                 <div className="h-1 w-full bg-background/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-indigo-400 to-pink-400 transition-all duration-500 ease-out"
                      style={{ width: `${percentUsed}%` }}
                    />
                 </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
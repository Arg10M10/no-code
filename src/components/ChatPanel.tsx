"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { StoredMessage } from "@/lib/projects";
import { ArrowUp, X, Cpu, Plus, Paperclip, Globe, Zap, Sparkles, RotateCcw, Eye, Undo2 } from "lucide-react";
import { toast } from "sonner";
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
  codeStream?: string; // NEW PROP
  onRetry?: (text: string, images?: string[]) => void;
};

const MODEL_TOKEN_LIMIT = 100_000;

const isErrorMessage = (content: string) => {
  const lowerContent = content.toLowerCase();
  return lowerContent.includes('ha fallado') || 
         lowerContent.includes('atención!') || 
         lowerContent.includes('missing api key') ||
         lowerContent.includes('cancelled');
};

// Simple Markdown Parser for Bold (**text**) and Lists (* item)
const SimpleMarkdown = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  
  return (
    <div className="text-sm leading-relaxed text-foreground/90 space-y-1">
      {lines.map((line, i) => {
        // List item detection
        const isListItem = line.trim().startsWith('* ') || line.trim().startsWith('- ');
        const cleanLine = isListItem ? line.trim().substring(2) : line;

        // Bold parsing logic
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        
        const content = parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (isListItem) {
          return (
            <div key={i} className="flex items-start gap-2 ml-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
              <span>{content}</span>
            </div>
          );
        }

        // Empty line
        if (!cleanLine.trim()) return <div key={i} className="h-2" />;

        return <div key={i} className="min-h-[1.2em]">{content}</div>;
      })}
    </div>
  );
};

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  loading,
  credits,
  onSend,
  onCancel,
  selectedElement,
  onClearSelection,
  generationLogs = [],
  thought,
  codeStream,
  onRetry,
}) => {
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
  }, [messages, loading, generationLogs, thought]);

  React.useEffect(() => {
    const urls = selectedImages.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(u => URL.revokeObjectURL(u));
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

  // --- RENDERING LOGIC ---

  const renderAssistantMessage = (content: string) => {
    const parts = content.split("---CHANGES---");
    const summaryText = parts[0].trim();
    const changesJson = parts[1] ? parts[1].trim() : "[]";
    
    let changes: FileChange[] = [];
    try {
        if (changesJson) changes = JSON.parse(changesJson);
    } catch (e) {
        console.error("Error parsing changes JSON", e);
    }

    const hasChanges = changes.length > 0;
    const isError = isErrorMessage(content);

    if (isError) {
        return (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-relaxed">
                {summaryText}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ETAPA 2: CAMBIOS (Si existen) */}
            {hasChanges && <FileChangeList changes={changes} />}

            {/* ETAPA 3: RESULTADO FINAL (Con Markdown) */}
            <div className="space-y-3">
                <SimpleMarkdown text={summaryText} />
                
                {hasChanges && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" size="sm" className="h-8 gap-2 bg-background hover:bg-secondary/80">
                            <Eye className="w-3.5 h-3.5" />
                            Ver cambios
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => toast.info("Función de revertir próximamente disponible")}
                        >
                            <Undo2 className="w-3.5 h-3.5" />
                            Revertir
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-8 p-6">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const key = msg.createdAt ? `${msg.createdAt}-${index}` : `${index}`;

            if (isUser) {
              return (
                <div key={key} className="flex justify-end animate-fade-in-up group">
                  <div className="flex items-center gap-2 max-w-[85%]">
                    {onRetry && !loading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={() => onRetry(msg.content, msg.images)}
                        title="Retry"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <div className="bg-secondary text-secondary-foreground px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm border border-border/50">
                      {msg.images && msg.images.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2 justify-end">
                          {msg.images.map((url, idx) => (
                            <div key={idx} className="relative h-20 w-20 rounded-md overflow-hidden border border-black/5 shrink-0 bg-background">
                              <img src={url} alt="Attachment" className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            }

            // Assistant Message
            return (
              <div key={key} className="flex gap-4 animate-fade-in-up pr-2 max-w-full">
                <div className="flex-shrink-0 mt-1">
                   <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm">
                      <Sparkles className="h-4 w-4" />
                   </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    {renderAssistantMessage(msg.content)}
                </div>
              </div>
            );
          })}

          {/* ETAPA 1: THINKING (LOADING STATE) */}
          {loading && (
            <div className="flex gap-4 animate-fade-in-up pr-2">
                <div className="flex-shrink-0 mt-1">
                   <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                      <Cpu className="h-4 w-4 text-muted-foreground animate-pulse" />
                   </div>
                </div>
                <div className="min-w-0 flex-1">
                   <ThinkingProcess logs={generationLogs} thought={thought} codeStream={codeStream} />
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* FOOTER / INPUT */}
      <div className="p-4 pt-2 border-t border-border/40 bg-background/50 backdrop-blur-sm z-10">
        {selectedElement && (
            <div className="bg-secondary/40 border border-border/60 rounded-lg p-2 flex items-center justify-between gap-2 text-xs mb-3 animate-fade-in-up">
                <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Elemento seleccionado</span>
                    <span className="text-foreground truncate max-w-[200px]">{selectedElement}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-background" onClick={onClearSelection}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className={cn(
            "rounded-xl bg-background border shadow-sm transition-all duration-200",
            loading ? "opacity-60 pointer-events-none border-border" : "border-border hover:border-border/80 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
          )}>
            {selectedImages.length > 0 && (
              <div className="pt-3 px-3">
                <div className="flex flex-wrap gap-2">
                  {selectedImages.map((file, idx) => (
                    <div key={idx} className="relative flex items-center gap-2 bg-secondary/30 border border-border rounded-md p-1 pr-2">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded border border-border/50">
                        <img src={previewUrls[idx]} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium max-w-[60px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeImageAt(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                         <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-border/40 w-full mt-3" />
              </div>
            )}

            <div className="flex items-end gap-2 p-2">
              <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground mb-1"
                  onClick={handleAttachClick}
              >
                  <Paperclip className="h-4 w-4" />
              </Button>
              
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={selectedElement ? "Describe los cambios para este elemento..." : "Describe lo que quieres construir..."}
                className="flex-1 min-h-[44px] max-h-36 bg-transparent text-sm resize-none outline-none py-2.5 placeholder:text-muted-foreground/60"
                rows={1}
                disabled={loading}
              />

              <Button
                type="submit"
                disabled={loading || (!text.trim() && selectedImages.length === 0)}
                size="icon"
                className={cn(
                    "h-8 w-8 rounded-lg mb-1 transition-all duration-300",
                    loading ? "bg-destructive text-destructive-foreground hover:bg-destructive" : "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5"
                )}
                onClick={loading ? onCancel : undefined}
              >
                {loading ? <X className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex justify-between items-center mt-2 px-1">
             <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors border border-transparent hover:border-border/50">
                       <Cpu className="w-3 h-3" />
                       {selectedModel}
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
                
                <button 
                    onClick={() => setChatMode(prev => prev === 'build' ? 'ask' : 'build')}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors border border-transparent hover:border-border/50"
                >
                    {chatMode === 'build' ? <Zap className="w-3 h-3 text-amber-500" /> : <Globe className="w-3 h-3 text-blue-500" />}
                    {chatMode === 'build' ? "Modo Constructor" : "Modo Chat"}
                </button>
             </div>

             <div className="text-[10px] text-muted-foreground opacity-60">
                {text.length > 0 && `${text.length} caracteres`}
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
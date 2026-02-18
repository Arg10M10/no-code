"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { StoredMessage } from "@/lib/projects";
import { ArrowUp, X, Plus, Paperclip, Globe, Zap, Sparkles, RotateCcw, Eye, Undo2, Coins, Cpu } from "lucide-react";
import { toast } from "sonner";
import { ThinkingProcess } from "./ThinkingProcess";
import { FileChangeList, FileChange } from "./FileChangeList";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ModelsPopover from "./ModelsPopover";
import { getSelectedModelLabel, setSelectedModelLabel } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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

const isErrorMessage = (content: string) => {
  const lowerContent = content.toLowerCase();
  return lowerContent.includes('ha fallado') || 
         lowerContent.includes('atención!') || 
         lowerContent.includes('missing api key') ||
         lowerContent.includes('cancelled');
};

const SimpleMarkdown = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  
  return (
    <div className="text-sm leading-relaxed text-foreground/90 space-y-1">
      {lines.map((line, i) => {
        const isListItem = line.trim().startsWith('* ') || line.trim().startsWith('- ');
        const cleanLine = isListItem ? line.trim().substring(2) : line;

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
            {hasChanges && <FileChangeList changes={changes} />}
            <div className="space-y-3">
                <SimpleMarkdown text={summaryText} />
                {hasChanges && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" size="sm" className="h-8 gap-2 bg-background hover:bg-secondary/80">
                            <Eye className="w-3.5 h-3.5" />
                            Ver cambios
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-6 p-4 pb-0">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const key = msg.createdAt ? `${msg.createdAt}-${index}` : `${index}`;

            if (isUser) {
              return (
                <div key={key} className="flex justify-end animate-fade-in-up group">
                  <div className="flex items-center gap-2 max-w-[90%]">
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
                    <div className="bg-secondary/80 text-secondary-foreground px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm border border-border/50 backdrop-blur-sm">
                      {msg.images && msg.images.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2 justify-end">
                          {msg.images.map((url, idx) => (
                            <div key={idx} className="relative h-16 w-16 rounded-md overflow-hidden border border-black/5 shrink-0 bg-background">
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

            return (
              <div key={key} className="flex gap-3 animate-fade-in-up pr-1 max-w-full">
                <div className="flex-shrink-0 mt-1">
                   <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                   </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    {renderAssistantMessage(msg.content)}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 animate-fade-in-up pr-1 pb-4">
                <div className="flex-shrink-0 mt-1">
                   <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center border border-border">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
                   </div>
                </div>
                <div className="min-w-0 flex-1">
                   <ThinkingProcess logs={generationLogs} thought={thought} codeStream={codeStream} />
                </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </ScrollArea>

      {/* FOOTER / INPUT */}
      <div className="p-3 bg-background border-t border-border z-10">
        
        {selectedElement && (
            <div className="bg-secondary/40 border border-border/60 rounded-lg p-2 flex items-center justify-between gap-2 text-xs mb-2 animate-fade-in-up">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium whitespace-nowrap">Editando</span>
                    <span className="text-foreground truncate">{selectedElement}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-background shrink-0" onClick={onClearSelection}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className={cn(
            "rounded-[24px] bg-background border shadow-lg shadow-black/5 transition-all duration-200",
            loading ? "opacity-60 pointer-events-none border-border" : "border-border/60 hover:border-border focus-within:ring-1 focus-within:ring-ring/20 focus-within:border-ring/30"
          )}>
             {selectedImages.length > 0 && (
              <div className="pt-3 px-3">
                <div className="flex flex-wrap gap-2">
                  {selectedImages.map((file, idx) => (
                    <div key={idx} className="relative flex items-center gap-2 bg-secondary/30 border border-border rounded-md p-1 pr-2">
                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded border border-border/50">
                        <img src={previewUrls[idx]} alt="Preview" className="h-full w-full object-cover" />
                      </div>
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
                <Separator className="mt-2 mb-1" />
              </div>
            )}

            <div className="flex items-end gap-2 p-2">
              {/* PLUS BUTTON (Stats & Model) */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 shrink-0 mb-1"
                  >
                      <Plus className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[280px] p-3 shadow-xl" side="top">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Modelo Activo</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium truncate max-w-[160px]">{selectedModel}</span>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => toast.info("Cambia el modelo en el menú superior o ajustes.")}>
                                    Cambiar
                                </Button>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Coins className="w-4 h-4 text-yellow-500" />
                                    <span>Créditos</span>
                                </div>
                                <span className="font-mono font-medium">{credits.toLocaleString()}</span>
                             </div>
                             <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                                Costo aprox. por mensaje: ~1000 créditos (dependiendo de la longitud y el modelo).
                             </div>
                        </div>
                    </div>
                </PopoverContent>
              </Popover>
              
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={selectedElement ? "Describe los cambios..." : "Escribe instrucciones..."}
                className="flex-1 min-h-[40px] max-h-[120px] bg-transparent text-sm resize-none outline-none py-2.5 placeholder:text-muted-foreground/50"
                rows={1}
                disabled={loading}
              />
              
              <div className="flex gap-1 mb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={handleAttachClick}
                    title="Adjuntar imagen"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading || (!text.trim() && selectedImages.length === 0)}
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-full transition-all duration-300 shadow-sm",
                        loading ? "bg-muted text-muted-foreground" : "bg-foreground text-background hover:opacity-90"
                    )}
                    onClick={loading ? onCancel : undefined}
                  >
                    {loading ? <X className="h-4 w-4" /> : <ArrowUp className="h-5 w-5" />}
                  </Button>
              </div>
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
          
          <div className="flex justify-between items-center mt-2 px-2">
               <button 
                  onClick={() => setChatMode(prev => prev === 'build' ? 'ask' : 'build')}
                  className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                  {chatMode === 'build' ? <Zap className="w-3 h-3 text-amber-500" /> : <Globe className="w-3 h-3 text-blue-500" />}
                  {chatMode === 'build' ? "Modo Constructor" : "Modo Chat"}
              </button>
              <span className="text-[10px] text-muted-foreground/60">
                 {selectedModel.split(' - ')[1] || selectedModel}
              </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
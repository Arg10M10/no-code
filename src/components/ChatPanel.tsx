"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { StoredMessage } from "@/lib/projects";
import { ArrowUp, X, Cpu, Square } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import TypingIndicator from "./TypingIndicator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ModelsPopover from "./ModelsPopover";
import { getSelectedModelLabel, setSelectedModelLabel, getUserPlan } from "@/lib/settings";
import { ChartNoAxes } from "./ChartNoAxes";
import { Paperclip } from "./Paperclip";
import { Earth } from "./Earth";

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

const FREE_MAX_IMAGES = 3;
const PRO_MAX_IMAGES = 10;

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
  const userPlan = getUserPlan();
  const maxImages = userPlan === "pro" ? PRO_MAX_IMAGES : FREE_MAX_IMAGES;

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

    const remainingSlots = Math.max(0, maxImages - selectedImages.length);
    const allowedFiles = files.slice(0, remainingSlots);

    if (allowedFiles.length < files.length) {
      const msg =
        userPlan === "pro"
          ? `Máximo ${PRO_MAX_IMAGES} imágenes por mensaje en Pro.`
          : `Máximo ${FREE_MAX_IMAGES} imágenes por mensaje en el plan gratuito.`;
      toast.warning("Límite de adjuntos alcanzado", {
        description: msg,
        action: userPlan === "pro" ? undefined : {
          label: "Ir a Pro",
          onClick: () => navigate("/pricing"),
        },
      });
    }

    if (allowedFiles.length === 0) return;
    setSelectedImages((prev) => [...prev, ...allowedFiles]);
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

  const percentOfLimit = Math.round((credits / MODEL_TOKEN_LIMIT) * 100);
  const progressWidth = `${Math.max(0, Math.min(100, percentOfLimit))}%`;

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
                    <div className="mb-2 grid grid-cols-3 gap-2">
                      {msg.images.map((url, idx) => (
                        <div key={idx} className="relative rounded-md overflow-hidden border border-white/10">
                          <img src={url} alt={`Attachment ${idx + 1}`} className="w-full aspect-square object-cover bg-black/5" />
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
        <div className="rounded-xl bg-secondary border border-border p-3 shadow-sm">
          {selectedImages.length > 0 ? (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground">
                  Adjuntos: {selectedImages.length}/{maxImages} {userPlan === "pro" ? "(Pro)" : "(Free)"}
                </div>
                <button
                  type="button"
                  onClick={clearImages}
                  className="inline-flex items-center justify-center text-xs rounded-md px-2 py-1 bg-white/10 hover:bg-white/15"
                >
                  Quitar todos
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative rounded-md overflow-hidden border border-white/10">
                    <img src={url} alt={`Adjunto ${idx + 1}`} className="w-full aspect-square object-cover bg-black/5" />
                    <button
                      type="button"
                      onClick={() => removeImageAt(idx)}
                      className="absolute top-1 right-1 inline-flex items-center justify-center rounded-md bg-black/60 hover:bg-black/70 p-1"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5 text-white/90" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={selectedElement ? "Describe the changes..." : (chatMode === 'build' ? "Ask AI to build..." : "Ask AI a question...")}
              className="resize-none flex-1 min-h-[44px] max-h-36 bg-transparent text-foreground placeholder:text-muted-foreground outline-none px-3 py-2 rounded-md"
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
                className="h-9 w-9 rounded-md p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                aria-label="Cancel Generation"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!text.trim() && selectedImages.length === 0}
                className="h-9 w-9 rounded-md p-0 bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 justify-start flex-wrap">
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-sm font-medium px-3 py-1 rounded-md transition-all select-none bg-transparent border border-border text-foreground hover:bg-muted"
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
                      className="h-auto gap-2 px-3 py-1 text-sm font-medium transition-all bg-transparent border-border text-foreground select-none hover:bg-muted"
                    >
                      <Cpu className="w-4 w-4" />
                      <span className="truncate max-w-[120px]">{selectedModel}</span>
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

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-md p-0 text-foreground flex items-center justify-center hover:bg-transparent"
                  onClick={handleAttachClick}
                  aria-label="Adjuntar imágenes"
                  title="Adjuntar imágenes"
                >
                  <Paperclip width={16} height={16} strokeWidth={2} />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-md p-0 text-foreground hover:bg-transparent"
                    >
                      <ChartNoAxes width={20} height={20} strokeWidth={1.5} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="end"
                    className="w/[260px] max-w-[95vw] rounded-md bg-[#0b0b0b] border-neutral-700 p-3 text-sm text-white shadow-lg"
                  >
                    <div className="flex items-center justify-between text-xs text-white/90 mb-2">
                      <div className="truncate">Tokens: <span className="font-medium">{credits.toLocaleString()}</span></div>
                      <div className="text-right text-[11px] text-white/70">
                        {percentOfLimit}% of {MODEL_TOKEN_LIMIT.toLocaleString()}
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-md bg-white/6 overflow-hidden mb-2">
                      <div
                        className="h-2 rounded-md bg-gradient-to-r from-emerald-400 via-indigo-400 to-pink-400"
                        style={{ width: progressWidth }}
                        aria-hidden
                      />
                    </div>

                    <div className="pt-2 border-t border-white/6 space-y-2">
                      <div className="text-xs text-white/80">
                        Límite de imágenes por mensaje: {maxImages} {userPlan === "pro" ? "(Pro)" : "(Free)"}
                      </div>
                      {userPlan !== "pro" && (
                        <button
                          type="button"
                          onClick={() => navigate('/pricing')}
                          className="w-full text-left text-xs text-sky-400 hover:underline"
                        >
                          Sube a Pro para hasta 10 imágenes por mensaje
                        </button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-md p-0 text-foreground hover:bg-transparent"
                  onClick={() => {
                    toast.info("Web search coming soon!");
                  }}
                  aria-label="Web Search"
                  title="Web Search"
                >
                  <Earth width={16} height={16} strokeWidth={2} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
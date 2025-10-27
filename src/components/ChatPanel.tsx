"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { StoredMessage } from "@/lib/projects";
import { ArrowUp, X, Paperclip, Settings, Info } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import TypingIndicator from "./TypingIndicator";

type ChatPanelProps = {
  messages: StoredMessage[];
  loading: boolean;
  credits: number;
  onSend: (text: string, image?: File | null) => void;
  selectedElement: string | null;
  onClearSelection: () => void;
};

const MODEL_TOKEN_LIMIT = 1_000_000;

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  loading,
  credits,
  onSend,
  selectedElement,
  onClearSelection,
}) => {
  const navigate = useNavigate();
  const [text, setText] = React.useState("");
  const [chatMode, setChatMode] = React.useState<'build' | 'ask'>('build');
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Popup state + refs
  const [showTokensPopup, setShowTokensPopup] = React.useState(false);
  const tokenButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  React.useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  // Close popup on outside click or Escape
  React.useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (showTokensPopup) {
        if (
          popupRef.current &&
          !popupRef.current.contains(target) &&
          tokenButtonRef.current &&
          !tokenButtonRef.current.contains(target)
        ) {
          setShowTokensPopup(false);
        }
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowTokensPopup(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showTokensPopup]);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      setSelectedImage(f);
    }
    e.currentTarget.value = "";
  };

  const removeImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() && !selectedImage) return;
    
    const messageToSend = chatMode === 'ask' ? `[ASK] ${text.trim()}` : text.trim();
    
    onSend(messageToSend, selectedImage ?? undefined);
    
    setText("");
    removeImage();
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const chips = [
    { id: "pro", label: "Pro", filled: true, tokens: MODEL_TOKEN_LIMIT },
  ];

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

            return (
              <div key={key} className="min-w-0">
                <div
                  className={[
                    "p-3 rounded-lg transition-shadow",
                    isAssistant
                      ? "bg-white/3 border border-green-600/30 ring-2 ring-green-500/20 shadow-sm"
                      : isUser
                      ? "bg-white/3 border border-blue-500/10 shadow-[0_8px_30px_rgba(59,130,246,0.18)]"
                      : "bg-muted-foreground/5 border border-transparent",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "text-sm leading-relaxed break-words",
                      isAssistant ? "text-green-100" : isUser ? "text-blue-100" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="min-w-0">
              <div
                className="p-3 rounded-lg bg-white/3 border border-green-600/30 ring-2 ring-green-500/20 shadow-sm flex items-center"
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
          <div className="bg-secondary border border-border rounded-md p-2 flex items-center justify-between gap-2 text-sm">
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
          {previewUrl ? (
            <div className="relative rounded-md overflow-hidden border border-white/6 mb-3">
              <img src={previewUrl} alt="Preview" className="w-full max-h-40 object-contain bg-black/5" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 inline-flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 p-1"
                aria-label="Remove attached image"
              >
                <X className="h-4 w-4 text-white/90" />
              </button>
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
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              aria-hidden
            />

            <Button
              type="submit"
              disabled={loading || (!text.trim() && !selectedImage)}
              className="h-9 w-9 rounded-md p-0 bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 justify-start flex-wrap">
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-sm font-medium px-3 py-1 rounded-md transition-all select-none bg-transparent border border-border text-primary hover:bg-primary/5"
                  onClick={() => {
                    setChatMode(prev => (prev === 'build' ? 'ask' : 'build'));
                  }}
                >
                  {chatMode === 'build' ? 'Build' : 'Ask'}
                </button>
                {chips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={[
                      "inline-flex items-center justify-center text-sm font-medium px-3 py-1 rounded-md transition-all select-none",
                      c.filled
                        ? "bg-primary text-primary-foreground hover:brightness-95"
                        : "bg-transparent border border-border text-primary hover:bg-primary/5",
                    ].join(" ")}
                    onClick={() => {
                      if (c.id === 'pro') {
                        navigate('/pricing');
                      }
                    }}
                    aria-pressed={c.filled}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleAttachClick}
                  className="h-9 w-9 rounded-md p-0 text-primary"
                  aria-label="Attach image"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-md p-0 text-primary"
                  onClick={() => {
                    // settings action placeholder
                  }}
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>

                <Button
                  ref={tokenButtonRef}
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTokensPopup((s) => !s)}
                  className="h-9 w-9 rounded-md p-0 text-primary"
                  aria-label="Show tokens"
                  title="Show available tokens"
                >
                  <Info className="h-4 w-4" />
                </Button>

                {showTokensPopup ? (
                  <div
                    ref={popupRef}
                    className="absolute right-0 bottom-full mb-3 w-[260px] max-w-[95vw] z-50 rounded-md bg-[#0b0b0b] border border-neutral-700 p-3 shadow-lg text-sm text-white"
                    role="dialog"
                    aria-label="Available tokens"
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

                    <div className="pt-2 border-t border-white/6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTokensPopup(false);
                          navigate('/pricing');
                        }}
                        className="w-full text-left text-xs text-sky-400 hover:underline"
                      >
                        Optimize your tokens with Pro Plan
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
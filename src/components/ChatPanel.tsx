"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StoredMessage } from "@/lib/projects";
import { ImagePlus, Send, X } from "lucide-react";

type ChatPanelProps = {
  messages: StoredMessage[];
  loading: boolean;
  credits: number;
  // onSend accepts optional image file
  onSend: (text: string, image?: File | null) => void;
};

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, loading, credits, onSend }) => {
  const [text, setText] = React.useState("");
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      setSelectedImage(f);
    }
    // reset input so same file can be selected again later if needed
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
    // call onSend with text and optional image
    onSend(text.trim(), selectedImage ?? undefined);
    // clear input
    setText("");
    removeImage();
    // focus back to textarea
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl/Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-0 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Tokens restantes: <span className="font-medium text-foreground">{credits}</span>
        </div>
        {loading ? <div className="text-sm text-foreground/80 italic">Generando...</div> : null}
      </div>

      {/* Fixed-height scroll area so the chat doesn't resize or move */}
      <ScrollArea className="h-80 md:h-96 lg:h-[28rem] flex-none">
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
                  <p className={["text-sm leading-relaxed break-words", isAssistant ? "text-green-100" : isUser ? "text-blue-100" : "text-muted-foreground"].join(" ")}>
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Glass-style input area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t bg-transparent"
        aria-label="Send message"
      >
        <div
          className="w-full rounded-xl p-3 backdrop-blur-md bg-white/6 border border-white/10 shadow-sm flex flex-col gap-2"
          style={{ boxShadow: "0 6px 30px rgba(2,6,23,0.35)" }}
        >
          {/* image preview (if any) */}
          {previewUrl ? (
            <div className="relative rounded-md overflow-hidden border border-white/8">
              <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-contain bg-black/5" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-1"
                aria-label="Remove attached image"
              >
                <X className="h-4 w-4 text-white/90" />
              </button>
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe un mensaje para la IA..."
              className="resize-none w-full min-h-[44px] max-h-40 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-2 py-2"
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

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleAttachClick}
                title="Adjuntar imagen"
                aria-label="Attach image"
                className="h-9 w-9 p-2"
              >
                <ImagePlus className="h-4 w-4" />
              </Button>

              <Button
                type="submit"
                disabled={loading || (!text.trim() && !selectedImage)}
                className="h-9 rounded-md px-3"
              >
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  <span className="text-sm">Enviar</span>
                </div>
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <div>Tip: Ctrl/Cmd + Enter para enviar</div>
            <div>{selectedImage ? `${selectedImage.name}` : ""}</div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
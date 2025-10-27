"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { StoredMessage } from "@/lib/projects";
import { ArrowUp, X, Paperclip, Settings, Info, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type ChatPanelProps = {
  messages: StoredMessage[];
  loading: boolean;
  credits: number;
  onSend: (text: string, images?: File[]) => void;
  selectedElement: string | null;
  onClearSelection: () => void;
};

const MODEL_TOKEN_LIMIT = 1_000_000;
const MAX_IMAGES = 5;
const LONG_TEXT_WORD_COUNT = 500;

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
  const [longText, setLongText] = React.useState<string | null>(null);
  const [selectedImages, setSelectedImages] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [chatMode, setChatMode] = React.useState<'build' | 'ask'>('build');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const [showTokensPopup, setShowTokensPopup] = React.useState(false);
  const tokenButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const popupRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (selectedImages.length === 0) {
      setPreviewUrls([]);
      return;
    }
    const urls = selectedImages.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedImages]);

  React.useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (showTokensPopup && popupRef.current && !popupRef.current.contains(target) && tokenButtonRef.current && !tokenButtonRef.current.contains(target)) {
        setShowTokensPopup(false);
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
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    if (selectedImages.length + newFiles.length > MAX_IMAGES) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} images.`);
      const remainingSlots = MAX_IMAGES - selectedImages.length;
      if (remainingSlots > 0) {
        setSelectedImages(prev => [...prev, ...newFiles.slice(0, remainingSlots)]);
      }
    } else {
      setSelectedImages(prev => [...prev, ...newFiles]);
    }
    
    e.currentTarget.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const wordCount = newText.split(/\s+/).filter(Boolean).length;

    if (wordCount > LONG_TEXT_WORD_COUNT && !longText) {
      setLongText(newText);
      setText("");
      toast.info("Long text attached.", {
        description: "You can now write a short prompt to go with it.",
      });
    } else {
      setText(newText);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() && !longText && selectedImages.length === 0) return;

    let promptText = text.trim();
    let combinedText = promptText;

    if (longText) {
      combinedText = `[Attached Text Content]\n\n${longText}\n\n---\n\n[Prompt]\n\n${promptText}`;
    }
    
    if (selectedElement) {
      combinedText = `Regarding the element "${selectedElement}", please do the following:\n\n${combinedText}`;
    }
    
    const messageToSend = chatMode === 'ask' ? `[ASK] ${combinedText}` : combinedText;
    
    onSend(messageToSend, selectedImages);
    
    setText("");
    setLongText(null);
    setSelectedImages([]);
    onClearSelection();
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const chips = [{ id: "pro", label: "Pro", filled: true, tokens: MODEL_TOKEN_LIMIT }];
  const percentOfLimit = Math.round((credits / MODEL_TOKEN_LIMIT) * 100);
  const progressWidth = `${Math.max(0, Math.min(100, percentOfLimit))}%`;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={`${msg.createdAt}-${index}`} className="min-w-0">
              <div className={`p-3 rounded-lg transition-shadow ${msg.role === "assistant" ? "bg-white/3 border border-green-600/30 ring-2 ring-green-500/20 shadow-sm" : "bg-white/3 border border-blue-500/10 shadow-[0_8px_30px_rgba(59,130,246,0.18)]"}`}>
                <p className={`text-sm leading-relaxed break-words ${msg.role === "assistant" ? "text-green-100" : "text-blue-100"}`}>{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {selectedElement && (
        <div className="px-4 pt-2">
          <div className="bg-secondary border border-border rounded-md p-2 flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground truncate">Editing: <code className="text-foreground font-medium bg-background/50 px-1.5 py-0.5 rounded">{selectedElement}</code></span>
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={onClearSelection}><X className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4">
        <div className="rounded-xl bg-secondary border border-border p-3 shadow-sm">
          {(longText || selectedImages.length > 0) && (
            <div className="mb-3 space-y-2">
              {longText && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/50 p-2 text-sm">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">Attached text ({longText.split(/\s+/).filter(Boolean).length} words)</span>
                  </div>
                  <button type="button" onClick={() => setLongText(null)} className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted" aria-label="Remove attached text"><X className="h-4 w-4" /></button>
                </div>
              )}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-white/6">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 p-0.5" aria-label={`Remove image ${index + 1}`}><X className="h-3 w-3 text-white" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={onKeyDown}
              placeholder={longText ? "Add a short prompt..." : (chatMode === 'build' ? "Ask AI to build..." : "Ask AI a question...")}
              className="resize-none flex-1 min-h-[44px] max-h-36 bg-transparent text-foreground placeholder:text-muted-foreground outline-none px-3 py-2 rounded-md"
              rows={1}
              aria-label="Message"
            />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} multiple aria-hidden />
            <Button type="submit" disabled={loading || (!text.trim() && !longText && selectedImages.length === 0)} className="h-9 w-9 rounded-md p-0 bg-primary text-primary-foreground hover:bg-primary/90" aria-label="Send"><ArrowUp className="h-4 w-4" /></Button>
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 justify-start flex-wrap">
                <button type="button" className="inline-flex items-center justify-center text-sm font-medium px-3 py-1 rounded-md transition-all select-none bg-transparent border border-border text-primary hover:bg-primary/5" onClick={() => setChatMode(prev => (prev === 'build' ? 'ask' : 'build'))}>{chatMode === 'build' ? 'Build' : 'Ask'}</button>
                {chips.map((c) => (<button key={c.id} type="button" className={`inline-flex items-center justify-center text-sm font-medium px-3 py-1 rounded-md transition-all select-none ${c.filled ? "bg-primary text-primary-foreground hover:brightness-95" : "bg-transparent border border-border text-primary hover:bg-primary/5"}`} onClick={() => { if (c.id === 'pro') navigate('/pricing'); }} aria-pressed={c.filled}>{c.label}</button>))}
              </div>
              <div className="relative flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" onClick={handleAttachClick} className="h-9 w-9 rounded-md p-0 text-primary" aria-label="Attach image"><Paperclip className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-md p-0 text-primary" aria-label="Settings"><Settings className="h-4 w-4" /></Button>
                <Button ref={tokenButtonRef} type="button" variant="ghost" size="icon" onClick={() => setShowTokensPopup((s) => !s)} className="h-9 w-9 rounded-md p-0 text-primary" aria-label="Show tokens" title="Show available tokens"><Info className="h-4 w-4" /></Button>
                {showTokensPopup && (<div ref={popupRef} className="absolute right-0 bottom-full mb-3 w-[260px] max-w-[95vw] z-50 rounded-md bg-[#0b0b0b] border border-neutral-700 p-3 shadow-lg text-sm text-white" role="dialog" aria-label="Available tokens"><div className="flex items-center justify-between text-xs text-white/90 mb-2"><div className="truncate">Tokens: <span className="font-medium">{credits.toLocaleString()}</span></div><div className="text-right text-[11px] text-white/70">{percentOfLimit}% of {MODEL_TOKEN_LIMIT.toLocaleString()}</div></div><div className="w-full h-2 rounded-md bg-white/6 overflow-hidden mb-2"><div className="h-2 rounded-md bg-gradient-to-r from-emerald-400 via-indigo-400 to-pink-400" style={{ width: progressWidth }} aria-hidden /></div><div className="pt-2 border-t border-white/6"><button type="button" onClick={() => { setShowTokensPopup(false); navigate('/pricing'); }} className="w-full text-left text-xs text-sky-400 hover:underline">Optimize your tokens with Pro Plan</button></div></div>)}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
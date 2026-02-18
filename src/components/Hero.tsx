"use client";

import React, { useRef, useState, useEffect, ClipboardEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Cpu, ArrowUp, File, X, Clipboard as ClipboardIcon, Clipboard as ClipboardPasteIcon, Figma, Camera, Upload, Check, GitBranch, Paperclip } from "lucide-react";
import ModelsPopover from "./ModelsPopover";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createProjectFromPrompt, addMessage } from "@/lib/projects";
import { getSelectedModelLabel, setSelectedModelLabel } from "@/lib/settings";
import ProjectsGallery from "@/components/ProjectsGallery";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
  });
}

const Hero: React.FC = () => {
  const projectFileInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [selectedModel, setSelectedModel] = useState<string>(getSelectedModelLabel());
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  // We keep previewUrls in case we want to support image pasting/logic, though we won't display them as thumbnails anymore
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [pastedTextInfo, setPastedTextInfo] = useState<{ wordCount: number; content: string } | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [copyOk, setCopyOk] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  const navigate = useNavigate();

  const examplePrompts = [
    {
      title: "SaaS landing page",
      prompt:
        "Create a modern landing page for a SaaS that helps teams manage projects. Include a hero, features, pricing, and footer. Provide basic HTML + Tailwind and a list of improvements.",
    },
    {
      title: "Todo app",
      prompt:
        "Design a todo app in React + TypeScript with state, add, complete, and delete. Include components and explain how to structure the hooks.",
    },
    {
      title: "Initial business plan",
      prompt:
        "Help me create a lean business plan for a B2B app: customer segments, value proposition, initial pricing, key metrics, and experiments.",
    },
    {
      title: "Clone design from screenshot",
      prompt:
        "Given a reference screenshot, outline the steps to clone the layout in Tailwind and how to break it down into reusable components.",
    },
  ];

  useEffect(() => {
    const urls = selectedImages.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedImages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 400)}px`; // Max height limit logic
    }
  }, [prompt]);

  const handleUploadProjectClick = () => projectFileInputRef.current?.click();
  const handleAttachImageClick = () => imageFileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'project' | 'image') => {
    if (type === 'project') {
       const file = event.target.files?.[0];
       if (file) {
         toast.info(`Selected project file: ${file.name}`);
       }
    } else {
       const files = Array.from(event.target.files || []);
       if (files.length > 0) {
         setSelectedImages(prev => [...prev, ...files]);
       }
    }
    event.currentTarget.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearPastedText = () => setPastedTextInfo(null);

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData("text");
    if (event.clipboardData.files && event.clipboardData.files.length > 0) {
        const files = Array.from(event.clipboardData.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            event.preventDefault();
            setSelectedImages(prev => [...prev, ...files]);
            return;
        }
    }

    const wordCount = pastedText.split(/\s+/).filter(Boolean).length;

    if (wordCount > 20000) {
      event.preventDefault();
      toast.error("Word limit exceeded", {
        description: "Upgrade to Pro for unlimited context.",
        action: {
          label: "See plans",
          onClick: () => navigate("/pricing"),
        },
      });
      return;
    }

    if (wordCount > 500) {
      event.preventDefault();
      setPastedTextInfo({ wordCount, content: pastedText });
    }
  };

  const handleSend = async () => {
    if (!prompt.trim() && selectedImages.length === 0) {
      toast.message("Write a prompt or attach images", { description: "Tell me what you want to build or improve." });
      return;
    }
    setLoading(true);

    const proj = createProjectFromPrompt(prompt);
    
    const fullPrompt = pastedTextInfo?.content
        ? `${prompt}\n\nPasted context (${pastedTextInfo.wordCount} words):\n${pastedTextInfo.content}`
        : prompt;

    try {
        let dataUrls: string[] = [];
        if (selectedImages.length > 0) {
            dataUrls = await Promise.all(selectedImages.map(fileToDataUrl));
        }

        addMessage(proj.id, { role: "user", content: fullPrompt, images: dataUrls.length > 0 ? dataUrls : undefined });
        navigate(`/editor?id=${encodeURIComponent(proj.id)}`);
    } catch (error) {
        console.error("Error processing request", error);
        toast.error("Could not process request.");
        setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!answer) return;
    await navigator.clipboard.writeText(answer);
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 1200);
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="min-h-full flex flex-col items-center px-6 pt-12 pb-20">
      <div className="max-w-4xl mx-auto text-center space-y-8 mt-12 sm:mt-24">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight opacity-0 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            What should we build?
          </h1>
          <p className="text-lg text-muted-foreground opacity-0 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Start building with a single prompt. No coding needed.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          {/* Main Input Container */}
          <div className="flex flex-col w-full bg-secondary border border-border rounded-xl focus-within:ring-2 focus-within:ring-ring transition-all duration-300 ease-in-out hover:shadow-lg overflow-hidden relative">
            
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Describe what you want to build or improve (website, app, business, code...)"
              className="w-full min-h-[140px] max-h-[400px] p-6 bg-transparent border-none text-base resize-none focus:outline-none placeholder:text-muted-foreground/60"
            />

            {/* Attachments Area (Chips) */}
            {(selectedImages.length > 0 || pastedTextInfo) && (
               <div className="px-6 pb-4 flex flex-wrap gap-2 animate-fade-in">
                  {selectedImages.map((file, idx) => (
                      <div key={idx} className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-background/40 hover:bg-background/60 border border-white/5 rounded-md text-sm text-muted-foreground transition-all">
                          <span className="truncate max-w-[180px] font-medium text-xs">{file.name}</span>
                          <button
                              onClick={() => removeImage(idx)}
                              className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded-full hover:bg-white/10 transition-colors"
                              title="Remove"
                          >
                              <X className="h-3.5 w-3.5" />
                          </button>
                      </div>
                  ))}
                  
                  {pastedTextInfo && (
                      <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-background/40 hover:bg-background/60 border border-white/5 rounded-md text-sm text-muted-foreground">
                           <ClipboardPasteIcon className="h-3.5 w-3.5" />
                           <span className="text-xs font-medium">Text ({pastedTextInfo.wordCount}w)</span>
                           <button onClick={handleClearPastedText} className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded-full hover:bg-white/10 transition-colors">
                              <X className="h-3.5 w-3.5" />
                           </button>
                      </div>
                  )}
               </div>
            )}

            {/* Footer Toolbar */}
            <div className="flex items-center justify-between px-4 pb-4 pt-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg hover:bg-background/40" onClick={handleAttachImageClick}>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg hover:bg-background/40">
                      <Cpu className="h-4 w-4 mr-2" />
                      {selectedModel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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

              <Button
                size="icon"
                className="rounded-xl h-9 w-9 transition-transform hover:scale-105 active:scale-95 shadow-sm"
                onClick={handleSend}
                disabled={loading || (!prompt.trim() && selectedImages.length === 0)}
              >
                <ArrowUp className={`h-5 w-5 ${loading ? "animate-pulse" : ""}`} />
              </Button>
            </div>
            
            {/* Loading Overlay (Optional visual cue) */}
            {loading && (
               <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-xl pointer-events-none transition-opacity">
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium animate-pulse border border-primary/20">
                     Generating...
                  </div>
               </div>
            )}
          </div>

          {answer && (
            <div className="text-left border border-border rounded-xl bg-card/60 p-4 md:p-5 space-y-3 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">AI response</h3>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleCopy}>
                  {copyOk ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="h-4 w-4 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-[15px]">{answer}</div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-center gap-3">
              <input type="file" ref={projectFileInputRef} onChange={(e) => handleFileChange(e, 'project')} className="hidden" />
              <input type="file" ref={imageFileInputRef} onChange={(e) => handleFileChange(e, 'image')} className="hidden" accept="image/*" multiple />

              <Button variant="outline" size="sm" className="rounded-full bg-secondary border-border hover:bg-muted" onClick={handleUploadProjectClick}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Project
              </Button>

              <Button variant="outline" size="sm" className="rounded-full bg-secondary border-border hover:bg-muted" onClick={() => navigate("/pricing")}>
                <GitBranch className="h-4 w-4 mr-2" />
                Connect a Repo
              </Button>

              <Button variant="outline" size="sm" className="rounded-full bg-secondary border-border hover:bg-muted" onClick={() => toast.message("Coming soon!", { description: "Figma integration is under development." })}>
                <Figma className="h-4 w-4 mr-2" />
                Import from Figma
              </Button>

              <Button variant="outline" size="sm" className="rounded-full bg-secondary border-border hover:bg-muted" onClick={handleAttachImageClick}>
                <Camera className="h-4 w-4 mr-2" />
                Clone a Screenshot
              </Button>
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">Or try one of these examples:</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {examplePrompts.map((example) => (
                  <Button key={example.title} variant="outline" size="sm" className="rounded-full bg-secondary border-border hover:bg-muted" onClick={() => setPrompt(example.prompt)}>
                    {example.title}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto mt-[50px] opacity-0 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
        <ProjectsGallery />
      </div>
    </section>
  );
};

export default Hero;
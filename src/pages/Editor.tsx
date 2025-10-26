import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Cpu, ArrowUp, Globe, Maximize2, RotateCcw, Share2, Rocket } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ModelsPopover from "@/components/ModelsPopover";
import { storage } from "@/lib/storage";
import {
  getProjectById,
  getMessages,
  addMessage,
  setMessages,
  StoredMessage,
  touchProject,
  getCredits,
  decrementCredits,
} from "@/lib/projects";
import { generateChat, ChatMessage, getProviderFromLabel } from "@/services/ai";
import { toast } from "sonner";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Loader from "@/components/Loader";

const COST_PER_MESSAGE = 1;

const SYSTEM_PROMPT = [
  "You are a technical-strategic assistant. You help build and improve websites, apps, and businesses: architecture, UX, launch plans, metrics, marketing, and code (React, Tailwind, Node, SQL).",
  "When the user asks to build or change UI, include a single full HTML document for live preview in a fenced code block labeled `html`.",
  "Keep code minimal and production-friendly; prefer Tailwind classes.",
].join(" ");

function extractPreviewHtml(text: string): string | null {
  // Prefer ```html ... ```
  const htmlFence = text.match(/```html\s*([\s\S]*?)```/i);
  if (htmlFence && htmlFence[1] && htmlFence[1].includes("<html")) {
    return htmlFence[1].trim();
  }
  // Any fenced block containing full HTML
  const fences = text.match(/```[\w-]*\s*([\s\S]*?)```/g);
  if (fences) {
    for (const block of fences) {
      const inner = block.replace(/```[\w-]*\s*/, "").replace(/```$/, "");
      if (inner.includes("<html") && inner.includes("</html>")) {
        return inner.trim();
      }
    }
  }
  // Custom markers (fallback)
  const marker = text.match(/<!--\s*PREVIEW_HTML_START\s*-->([\s\S]*?)<!--\s*PREVIEW_HTML_END\s*-->/i);
  if (marker && marker[1]) return marker[1].trim();
  return null;
}

const EditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("id") || "";

  // Header / state
  const [projectName, setProjectName] = React.useState<string>("");
  const [selectedModel, setSelectedModel] = React.useState<string>("OpenAI - GPT-5");
  const [credits, setCreditsState] = React.useState<number>(0);

  // Chat
  const [messages, setLocalMessages] = React.useState<StoredMessage[]>([]);
  const [input, setInput] = React.useState<string>("");

  // Preview
  const [previewHtml, setPreviewHtml] = React.useState<string | null>(null);
  const [previewPath, setPreviewPath] = React.useState<string>("/");
  const [iframeKey, setIframeKey] = React.useState<number>(0);

  // Loaders
  const [loading, setLoading] = React.useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = React.useState<boolean>(false);

  // Init
  React.useEffect(() => {
    if (!projectId) return;
    const p = getProjectById(projectId);
    if (!p) {
      toast.error("Project not found");
      navigate("/");
      return;
    }
    setProjectName(p.name);
    setLocalMessages(getMessages(projectId));
    setCreditsState(getCredits(projectId));
  }, [projectId, navigate]);

  // Auto-ask if last message is user
  React.useEffect(() => {
    if (!projectId) return;
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === "user") {
      void askAssistant();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const onBack = () => navigate(-1);

  const refreshPreview = () => {
    if (previewHtml) {
      // Re-apply srcDoc to reload sandbox
      setPreviewHtml((h) => (h ? `${h}` : h));
    } else {
      setIframeKey((k) => k + 1);
    }
  };

  const askAssistant = async () => {
    const apiKeys = storage.getJSON<Record<string, string>>("api-keys", {});
    const provider = getProviderFromLabel(selectedModel);
    if (!apiKeys[provider]) {
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      toast.error("Missing API Key", { description: `Set your ${providerName} key in Settings > API Keys.` });
      return;
    }
    if (!projectId) return;

    if (credits <= 0) {
      toast.error("Out of credits", { description: "Upgrade to Pro to get more credits." });
      return;
    }

    const toastId = toast.loading("Asking the AI...");
    setLoading(true);
    setPreviewLoading(true);

    const chatMsgs: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const reply = await generateChat({
      messages: chatMsgs,
      selectedModelLabel: selectedModel,
      apiKeys,
    });

    const assistantMsg: StoredMessage = { role: "assistant", content: reply, createdAt: Date.now() };
    const next = [...messages, assistantMsg];
    setLocalMessages(next);
    setMessages(projectId, next);

    // Update preview if HTML provided
    const html = extractPreviewHtml(reply);
    if (html) {
      setPreviewHtml(html);
    }

    // Consume credits
    const left = decrementCredits(projectId, COST_PER_MESSAGE);
    setCreditsState(left);

    toast.success("Done", { id: toastId, description: "Response generated." });
    setLoading(false);
    setPreviewLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !projectId) return;
    const userMsg: StoredMessage = { role: "user", content: input.trim(), createdAt: Date.now() };
    const next = [...messages, userMsg];
    setLocalMessages(next);
    setMessages(projectId, next);
    setInput("");
    touchProject(projectId);
    await askAssistant();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-3 sm:px-4 h-12">
          <Button variant="ghost" size="sm" onClick={onBack} className="px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="truncate text-sm font-semibold leading-none">{projectName || "Project"}</div>
            <div className="text-[11px] text-muted-foreground">
              {previewLoading ? "Loading Live Preview…" : ""}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 ml-auto sm:ml-4">
            <div className="text-xs text-muted-foreground">
              Credits: <span className="text-foreground font-medium">{credits}</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Cpu className="h-4 w-4 mr-2" />
                  {selectedModel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <ModelsPopover selectedModel={selectedModel} onSelectModel={setSelectedModel} />
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="secondary">Preview</Button>
          </div>
        </div>

        {/* Address bar */}
        <div className="px-3 sm:px-4 pb-2">
          <div className="mx-auto max-w-xl">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card/50 px-2 py-1.5">
              <Globe className="h-4 w-4 text-muted-foreground ml-1" />
              <Input
                value={previewPath}
                onChange={(e) => setPreviewPath(e.target.value)}
                className="h-7 border-0 bg-transparent focus-visible:ring-0 text-sm"
                placeholder="/"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setPreviewHtml(null)}
                title="Open path in preview"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={refreshPreview}
                title="Refresh preview"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main split */}
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-4.5rem)]">
        {/* Left: Chat column */}
        <ResizablePanel defaultSize={38} minSize={26} maxSize={60}>
          <div className="relative h-full">
            <ScrollArea className="h-full pr-1">
              <div className="px-3 sm:px-4 pb-28 pt-3 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Start by sending a prompt to the assistant.</p>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={[
                        "rounded-xl border p-3 text-sm leading-relaxed",
                        m.role === "user" ? "bg-secondary/60 border-border/60" : "bg-card/60 border-border/60",
                      ].join(" ")}
                    >
                      <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {m.role === "user" ? "You" : "Assistant"}
                      </div>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  ))
                )}

                {loading && (
                  <div className="rounded-xl border border-border/60 p-4 bg-card/60 flex items-center gap-4">
                    <Loader aria-label="Loading assistant reply" />
                    <div className="text-sm text-muted-foreground">Generating response…</div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Floating composer */}
            <div className="absolute left-2 right-2 bottom-2">
              <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60 p-2 shadow-lg">
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI…"
                    className="w-full h-24 bg-transparent rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none"
                  />
                  <div className="absolute left-3 bottom-2 flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-background/60">Edit</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-background/60">Chat</span>
                  </div>
                  <div className="absolute right-2 bottom-2">
                    <Button
                      size="icon"
                      className="rounded-full"
                      onClick={handleSend}
                      disabled={loading || !input.trim() || credits <= 0}
                      title={credits <= 0 ? "No credits left" : "Send"}
                    >
                      <ArrowUp className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between px-1">
                  <div className="text-[11px] text-muted-foreground">
                    Credits: <span className="text-foreground font-medium">{credits}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-[12px]">
                      <Share2 className="h-3.5 w-3.5 mr-1" />
                      Share
                    </Button>
                    <Button variant="secondary" size="sm" className="h-7 text-[12px]">
                      Upgrade
                    </Button>
                    <Button size="sm" className="h-7 text-[12px]">
                      <Rocket className="h-3.5 w-3.5 mr-1" />
                      Publish
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Preview column */}
        <ResizablePanel defaultSize={62} minSize={40}>
          <div className="relative h-full p-2 sm:p-3">
            <div className="relative h-full w-full rounded-xl border border-border/60 bg-black/40 overflow-hidden">
              {previewLoading && (
                <div className="preview-loading-overlay">
                  <div className="flex flex-col items-center gap-4">
                    <Loader aria-label="Loading live preview" />
                    <div className="text-xs text-muted-foreground">Loading Live Preview…</div>
                  </div>
                </div>
              )}
              <iframe
                key={iframeKey}
                title="Preview"
                className="w-full h-full border-0"
                src={previewHtml ? undefined : previewPath || "/"}
                srcDoc={previewHtml || undefined}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default EditorPage;
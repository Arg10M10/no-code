import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cpu, ArrowUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ModelsPopover from "@/components/ModelsPopover";
import { storage } from "@/lib/storage";
import { getProjectById, getMessages, addMessage, setMessages, StoredMessage, touchProject, getCredits, decrementCredits } from "@/lib/projects";
import { generateChat, ChatMessage, getProviderFromLabel } from "@/services/ai";
import { toast } from "sonner";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Loader from "@/components/Loader";

const COST_PER_MESSAGE = 1;

const SYSTEM_PROMPT =
  [
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
  const [projectName, setProjectName] = React.useState<string>("");
  const [selectedModel, setSelectedModel] = React.useState<string>("OpenAI - GPT-5");
  const [messages, setLocalMessages] = React.useState<StoredMessage[]>([]);
  const [input, setInput] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = React.useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = React.useState<string | null>(null);
  const [credits, setCreditsState] = React.useState<number>(0);

  React.useEffect(() => {
    if (!projectId) return;
    const p = getProjectById(projectId);
    if (!p) {
      toast.error("Project not found");
      navigate("/");
      return;
    }
    setProjectName(p.name);
    const msgs = getMessages(projectId);
    setLocalMessages(msgs);
    setCreditsState(getCredits(projectId));
  }, [projectId, navigate]);

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

    const id = toast.loading("Asking the AI...");
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

    // Parse preview HTML if present
    const html = extractPreviewHtml(reply);
    if (html) {
      setPreviewHtml(html);
    }

    // Consume credits
    const left = decrementCredits(projectId, COST_PER_MESSAGE);
    setCreditsState(left);

    toast.success("Done", { id, description: "Response generated." });
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
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 h-12">
          <Button variant="ghost" size="sm" onClick={onBack} className="px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-sm font-medium">{projectName || "Editor"}</h1>
          </div>
          <div className="text-xs text-muted-foreground mr-2">
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
        </div>
      </div>

      {/* Split view full height */}
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-3rem)]">
        {/* Left: Chat */}
        <ResizablePanel defaultSize={42} minSize={30} maxSize={60}>
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Start by sending a prompt to the assistant.</p>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={[
                        "rounded-lg border border-border/60 p-3 text-sm leading-relaxed",
                        m.role === "user" ? "bg-secondary/60" : "bg-card/60",
                      ].join(" ")}
                    >
                      <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                        {m.role === "user" ? "You" : "Assistant"}
                      </div>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  ))
                )}

                {/* Loader message bubble while assistant is thinking */}
                {loading && (
                  <div className="rounded-lg border border-border/60 p-4 bg-card/60 flex items-center gap-4">
                    <Loader aria-label="Loading assistant reply" />
                    <div className="text-sm text-muted-foreground">Generating response…</div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="border-t border-border/40 p-3">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe what to change or build..."
                  className="w-full h-28 bg-secondary border border-border rounded-xl p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="absolute right-2 bottom-2">
                  <Button size="icon" className="rounded-full" onClick={handleSend} disabled={loading || !input.trim() || credits <= 0}>
                    <ArrowUp className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Preview */}
        <ResizablePanel defaultSize={58} minSize={40}>
          <div className="relative h-full bg-black/40 rounded-none">
            {previewLoading && (
              <div className="preview-loading-overlay">
                <div className="flex flex-col items-center gap-4">
                  <Loader aria-label="Loading live preview" />
                  <div className="text-xs text-muted-foreground">Loading Live Preview…</div>
                </div>
              </div>
            )}
            <iframe
              title="Preview"
              className="w-full h-full border-0 rounded-none"
              src={previewHtml ? undefined : "/"}
              srcDoc={previewHtml || undefined}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default EditorPage;
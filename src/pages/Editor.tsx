import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cpu, ArrowLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ModelsPopover from "@/components/ModelsPopover";
import { toast } from "sonner";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import CreditManager from "@/components/CreditManager";
import {
  getProjectById,
  getMessages,
  setMessages,
  StoredMessage,
  getCredits,
  decrementCredits,
  getCode,
  setCode,
} from "@/lib/projects";
import { storage } from "@/lib/storage";
import { generateChat, ChatMessage, getProviderFromLabel } from "@/services/ai";
import { useSelectedModel } from "@/hooks/useSelectedModel";

const COST_PER_MESSAGE = 1;

const SYSTEM_PROMPT = [
  "You are a technical-strategic assistant. You help build and improve websites, apps, and businesses: architecture, UX, launch plans, metrics, marketing, and code (React, Tailwind, Node, SQL).",
  "When the user asks to build or change UI, include a single full HTML document for live preview in a fenced code block labeled `html`.",
  "Keep code minimal and production-friendly; prefer Tailwind classes.",
].join(" ");

function extractPreviewHtml(text: string): string | null {
  const htmlFence = text.match(/```html\s*([\s\S]*?)```/i);
  if (htmlFence && htmlFence[1] && htmlFence[1].includes("<html")) {
    return htmlFence[1].trim();
  }
  const fences = text.match(/```[\w-]*\s*([\s\S]*?)```/g);
  if (fences) {
    for (const block of fences) {
      const inner = block.replace(/```[\w-]*\s*/, "").replace(/```$/, "");
      if (inner.includes("<html") && inner.includes("</html>")) {
        return inner.trim();
      }
    }
  }
  const marker = text.match(/<!--\s*PREVIEW_HTML_START\s*-->([\s\S]*?)<!--\s*PREVIEW_HTML_END\s*-->/i);
  if (marker && marker[1]) return marker[1].trim();
  return null;
}

const Editor: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("id") || "";

  const [projectName, setProjectName] = React.useState<string>("");
  const { selectedModel, setSelectedModel } = useSelectedModel();
  const [messages, setLocalMessages] = React.useState<StoredMessage[]>([]);
  const [credits, setCreditsState] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = React.useState<boolean>(false);
  const [code, setCodeState] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!projectId) return;
    const p = getProjectById(projectId);
    if (!p) {
      toast.error("Proyecto no encontrado");
      navigate("/");
      return;
    }
    setProjectName(p.name);
    setLocalMessages(getMessages(projectId));
    setCreditsState(getCredits(projectId));
    setCodeState(getCode(projectId));
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
      toast.error("Falta API Key", { description: `Configura tu clave de ${providerName} en Settings > API Keys.` });
      return;
    }
    if (!projectId) return;

    if (credits <= 0) {
      toast.error("Sin créditos", { description: "Mejora tu plan para obtener más créditos." });
      return;
    }

    const tId = toast.loading("Consultando a la IA…");
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

    const html = extractPreviewHtml(reply);
    if (html) {
      setCodeState(html);
      setCode(projectId, html);
    }

    const left = decrementCredits(projectId, COST_PER_MESSAGE);
    setCreditsState(left);

    toast.success("Listo", { id: tId, description: "Respuesta generada y renderizada." });
    setLoading(false);
    setPreviewLoading(false);
  };

  const onSend = async (text: string) => {
    if (!projectId) return;
    const msg: StoredMessage = { role: "user", content: text, createdAt: Date.now() };
    const next = [...messages, msg];
    setLocalMessages(next);
    setMessages(projectId, next);
    await askAssistant();
  };

  const onApplyCode = (nextCode: string) => {
    if (!projectId) return;
    setCodeState(nextCode);
    setCode(projectId, nextCode);
    toast.success("Preview actualizado");
  };

  return (
    <div className="fixed inset-0 bg-background">
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-3 sm:px-4 h-12">
          <Button variant="ghost" size="sm" onClick={onBack} className="px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="truncate text-sm font-semibold leading-none">{projectName || "Proyecto"}</div>
            <div className="text-[11px] text-muted-foreground">
              {previewLoading ? "Cargando Preview…" : ""}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <CreditManager credits={credits} />
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
      </div>

      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-3rem)]">
        <ResizablePanel defaultSize={42} minSize={30} maxSize={60}>
          <ChatPanel messages={messages} loading={loading} credits={credits} onSend={onSend} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={58} minSize={40}>
          <PreviewPanel code={code} loading={previewLoading} onApply={onApplyCode} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Editor;
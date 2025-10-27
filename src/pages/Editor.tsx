"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { getProjectById, StoredMessage, setMessages, getMessages, addMessage, getCode, setCode } from "@/lib/projects";
import { storage } from "@/lib/storage";
import { getSelectedModelLabel } from "@/lib/settings";
import { getProviderFromLabel, generateAnswer } from "@/services/ai";

// Helper function to escape HTML for safe embedding
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Simple fallback generator (returns a complete HTML string).
function generateHtmlFromPrompt(promptText: string, modelLabel?: string) {
  const safePrompt = escapeHtml(promptText).replace(/\n/g, "<br/>");
  const modelBadge = modelLabel ? `<div class="text-xs text-muted-foreground">Generated with: ${escapeHtml(modelLabel)}</div>` : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Generated Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { background: linear-gradient(180deg,#0f172a,#020617); color: #fff; }</style>
</head>
<body class="min-h-screen flex items-center justify-center p-8">
  <main class="max-w-4xl w-full bg-white/5 rounded-lg border border-white/10 p-8 shadow-lg">
    <header class="mb-6">
      <h1 class="text-4xl font-bold mb-2">Generated Page</h1>
      ${modelBadge}
      <p class="text-sm text-muted-foreground mt-1">Prompt used to generate this page:</p>
      <div class="mt-2 p-3 bg-white/3 rounded text-sm break-words">${safePrompt}</div>
    </header>
    <section class="space-y-6">
      <p class="text-center">This is a locally generated fallback page.</p>
    </section>
  </main>
</body>
</html>`.trim();
}

const EditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("id");

  const [projectName, setProjectName] = useState("");
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [messages, setMessagesState] = useState<StoredMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [code, setCodeState] = useState<string | null>(null);
  
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const triggerInitialGeneration = useCallback(async (projId: string, prompt: string) => {
    setLoading(true);
    setPreviewLoading(true);

    const apiKeys = storage.getJSON<Record<string, string>>("api-keys", {});
    const selectedModel = getSelectedModelLabel();
    const provider = getProviderFromLabel(selectedModel);

    if (!apiKeys[provider]) {
      toast.warning("Falta la clave de API", {
        description: "Por favor, configúrala en los ajustes para usar la IA.",
      });
      addMessage(projId, {
        role: "assistant",
        content: `¡Atención! Para generar la página web con la IA, necesitas configurar tu clave de API para el proveedor '${provider}'.\n\nPuedes hacerlo en 'Settings' > 'API Keys'.\n\nMientras tanto, he creado una página de ejemplo para que veas cómo funciona.`
      });
      const fallbackCode = generateHtmlFromPrompt(prompt, selectedModel);
      setCode(projId, fallbackCode);
      setCodeState(fallbackCode);
      setMessagesState(getMessages(projId));
      setLoading(false);
      setPreviewLoading(false);
      return;
    }

    addMessage(projId, {
      role: "assistant",
      content: "Clave de API encontrada. Empezando a generar tu página con la IA...",
    });
    setMessagesState(getMessages(projId));

    try {
      const generatedCode = await generateAnswer({ prompt, selectedModelLabel: selectedModel, apiKeys });
      if (!generatedCode || generatedCode.trim().length === 0) {
        toast.message("Generado localmente (respuesta de la IA vacía).");
        const fallbackCode = generateHtmlFromPrompt(prompt, selectedModel);
        setCode(projId, fallbackCode);
        setCodeState(fallbackCode);
      } else {
        toast.success("Generación completada");
        setCode(projId, generatedCode);
        setCodeState(generatedCode);
      }
      addMessage(projId, { role: "assistant", content: "Generación completada — la previsualización está lista." });
    } catch (err: any) {
      console.error("La generación con IA ha fallado, usando fallback local:", err);
      toast.error("La petición a la IA ha fallado — se ha usado un fallback local.");
      const fallbackCode = generateHtmlFromPrompt(prompt, selectedModel);
      setCode(projId, fallbackCode);
      setCodeState(fallbackCode);
      addMessage(projId, {
        role: "assistant",
        content: "La generación contra el servicio de IA remoto ha fallado — se ha creado una página de fallback local.",
      });
    } finally {
      setLoading(false);
      setPreviewLoading(false);
      setMessagesState(getMessages(projId));
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      if (project) {
        setProjectName(project.name);
        const loadedMessages = getMessages(projectId);
        setMessagesState(loadedMessages);
        setCodeState(getCode(projectId));
        setCredits(0);

        if (loadedMessages.length === 1 && loadedMessages[0].role === 'user') {
          triggerInitialGeneration(projectId, loadedMessages[0].content);
        }
      } else {
        console.error("Proyecto no encontrado");
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [projectId, navigate, triggerInitialGeneration]);

  const handleNewMessage = useCallback((text: string, image?: File | null) => {
    if (!projectId) return;

    let messageContent = text;
    if (selectedElement) {
      messageContent = `Respecto al elemento "${selectedElement}", por favor haz lo siguiente: ${text}`;
      setSelectedElement(null);
    }

    const userMessage: StoredMessage = { role: "user", content: messageContent, createdAt: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessagesState(newMessages);
    setMessages(projectId, newMessages);
    setLoading(true);

    setTimeout(() => {
      const aiResponse: StoredMessage = {
        role: "assistant",
        content: "Entendido. Estoy trabajando en tus cambios. Verás la previsualización actualizada en breve.",
        createdAt: Date.now(),
      };
      const finalMessages = [...newMessages, aiResponse];
      setMessagesState(finalMessages);
      setMessages(projectId, finalMessages);
      setLoading(false);
      
      setPreviewLoading(true);
      setTimeout(() => setPreviewLoading(false), 1500);
    }, 1000);
  }, [messages, projectId, selectedElement]);

  const handleRefreshPreview = () => {
    setPreviewLoading(true);
    setTimeout(() => setPreviewLoading(false), 1500);
  };

  const handleElementSelected = (description: string) => {
    setSelectedElement(description);
    setIsSelectionModeActive(false);
  };

  if (!projectId) {
    return <div>Cargando proyecto...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold truncate" title={projectName}>
            {projectName || "Cargando..."}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Salir
          </Button>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            defaultSize={30}
            minSize={20}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsLeftPanelCollapsed(true)}
            onExpand={() => setIsLeftPanelCollapsed(false)}
            className={isLeftPanelCollapsed ? "hidden" : ""}
          >
            <ChatPanel
              messages={messages}
              loading={loading}
              credits={credits}
              onSend={handleNewMessage}
              selectedElement={selectedElement}
              onClearSelection={() => setSelectedElement(null)}
            />
          </ResizablePanel>
          <div
            aria-hidden="true"
            className="h-full w-px bg-border/40"
            role="separator"
          />
          <ResizablePanel defaultSize={70}>
            <PreviewPanel
              previewUrl="/preview"
              code={code}
              loading={previewLoading}
              onRefresh={handleRefreshPreview}
              isSelectionModeActive={isSelectionModeActive}
              onToggleSelectionMode={() => setIsSelectionModeActive(prev => !prev)}
              onElementSelected={handleElementSelected}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default EditorPage;
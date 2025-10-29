"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { getProjectById, StoredMessage, setMessages, getMessages, addMessage, getCode, setCode, getCredits, decrementCredits } from "@/lib/projects";
import { storage } from "@/lib/storage";
import { getSelectedModelLabel } from "@/lib/settings";
import { getProviderFromLabel, generateAnswer, generateChat } from "@/services/ai";
import { cn } from "@/lib/utils";
import { Github } from "lucide-react";
import { publishToGitHub } from "@/lib/github";
import { supabase } from "@/integrations/supabase/client";

function includesSupabaseIntent(text: string): boolean {
  const t = (text || "").toLowerCase();
  if (!t.includes("supabase")) return false;
  const keys = ["conectar", "conéct", "connect", "integrar", "integration", "auth", "database"];
  return keys.some((k) => t.includes(k));
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

  const [supabaseIntentCounter, setSupabaseIntentCounter] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const triggerInitialGeneration = useCallback(async (projId: string, prompt: string) => {
    setLoading(true);
    setPreviewLoading(true);
    setCodeState(null);
    abortControllerRef.current = new AbortController();

    const apiKeys = storage.getJSON<Record<string, string>>("api-keys", {});
    const selectedModel = getSelectedModelLabel();
    const provider = getProviderFromLabel(selectedModel);

    if (!apiKeys[provider]) {
      toast.warning("Falta la clave de API", {
        description: "Por favor, configúrala en los ajustes para usar la IA.",
      });
      addMessage(projId, {
        role: "assistant",
        content: `¡Atención! Para generar la página web con la IA, necesitas configurar tu clave de API para el proveedor '${provider}'.\n\nPuedes hacerlo en 'Settings' > 'API Keys'.`
      });
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
      const generatedCode = await generateAnswer({ prompt, selectedModelLabel: selectedModel, apiKeys, signal: abortControllerRef.current.signal });
      
      if (includesSupabaseIntent(generatedCode)) {
        setSupabaseIntentCounter((c) => c + 1);
      }

      toast.success("Generación completada");
      setCode(projId, generatedCode);
      setCodeState(generatedCode);
      addMessage(projId, { role: "assistant", content: "Generación completada — la previsualización está lista." });

      const cost = Math.floor(Math.random() * 4001) + 1000;
      const newCredits = decrementCredits(projId, cost);
      setCredits(newCredits);
      toast.info(`${cost.toLocaleString()} tokens used.`);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Initial generation aborted.');
        return;
      }
      const errorMessage = err.message || "Ocurrió un error desconocido.";
      console.error("La generación con IA ha fallado:", err);
      
      toast.error("La petición a la IA ha fallado", {
        description: errorMessage,
      });
      
      addMessage(projId, {
        role: "assistant",
        content: `La generación con IA ha fallado con el siguiente error:\n\n> ${errorMessage}\n\nPor favor, revisa tu clave de API y la configuración del modelo.`,
      });
    } finally {
      setLoading(false);
      setPreviewLoading(false);
      setMessagesState(getMessages(projId));
      abortControllerRef.current = null;
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
        setCredits(getCredits(projectId));

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

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
    setPreviewLoading(false);
    if (projectId) {
      addMessage(projectId, {
        role: 'assistant',
        content: 'Generación cancelada por el usuario.',
      });
      setMessagesState(getMessages(projectId));
    }
  };

  const handleNewMessage = useCallback(async (text: string, images?: File[]) => {
    if (!projectId) return;
    abortControllerRef.current = new AbortController();

    const isAsk = text.trim().startsWith("[ASK]");
    const cleanedText = isAsk ? text.replace(/^\[ASK\]\s*/i, "") : text;

    let messageContent = cleanedText;
    if (selectedElement) {
      messageContent = `Respecto al elemento "${selectedElement}", por favor haz lo siguiente: ${cleanedText}`;
      setSelectedElement(null);
    }

    if (includesSupabaseIntent(messageContent)) {
      setSupabaseIntentCounter((c) => c + 1);
    }

    const userMessage: StoredMessage = { role: "user", content: messageContent, createdAt: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessagesState(newMessages);
    setMessages(projectId, newMessages);
    setLoading(true);

    const apiKeys = storage.getJSON<Record<string, string>>("api-keys", {});
    const selectedModel = getSelectedModelLabel();

    try {
      let aiResponseContent: string;
      if (isAsk) {
        aiResponseContent = await generateChat({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          selectedModelLabel: selectedModel,
          apiKeys,
          signal: abortControllerRef.current.signal,
        });
      } else {
        setPreviewLoading(true);
        const generatedCode = await generateAnswer({
          prompt: messageContent,
          selectedModelLabel: selectedModel,
          apiKeys,
          codeContext: code,
          signal: abortControllerRef.current.signal,
        });
        
        if (includesSupabaseIntent(generatedCode)) {
          setSupabaseIntentCounter((c) => c + 1);
        }

        setCode(projectId, generatedCode);
        setCodeState(generatedCode);
        aiResponseContent = "Listo. He aplicado tus cambios y actualizado la previsualización.";
      }

      if (includesSupabaseIntent(aiResponseContent)) {
        setSupabaseIntentCounter((c) => c + 1);
      }

      const cost = Math.floor(Math.random() * 4001) + 1000;
      const newCredits = decrementCredits(projectId, cost);
      setCredits(newCredits);

      const aiResponse: StoredMessage = {
        role: "assistant",
        content: aiResponseContent,
        createdAt: Date.now(),
      };
      const finalMessages = [...newMessages, aiResponse];
      setMessagesState(finalMessages);
      setMessages(projectId, finalMessages);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation aborted by user.');
        return;
      }
      const errorMessage = err?.message || "Ocurrió un error desconocido.";
      console.error("Error en la operación de IA:", err);
      const nowAsk = text.trim().startsWith("[ASK]");
      toast.error(nowAsk ? "La pregunta a la IA ha fallado" : "La generación con IA ha fallado", {
        description: errorMessage,
      });
      const aiResponse: StoredMessage = {
        role: "assistant",
        content: `La operación de IA ha fallado:\n\n> ${errorMessage}`,
        createdAt: Date.now(),
      };
      const finalMessages = [...newMessages, aiResponse];
      setMessagesState(finalMessages);
      setMessages(projectId, finalMessages);
    } finally {
      setLoading(false);
      if (!isAsk) setPreviewLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, projectId, selectedElement, code]);

  const handleRefreshPreview = () => {
    setPreviewLoading(true);
    setTimeout(() => setPreviewLoading(false), 1500);
  };

  const handleElementSelected = (description: string) => {
    setSelectedElement(description);
    setIsSelectionModeActive(false);
  };

  const handlePublish = async () => {
    if (!code) {
      toast.error("Nothing to publish", { description: "There is no code generated yet." });
      return;
    }
  
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.provider_token) {
      toast.error("Authentication required", {
        description: "Please connect your Supabase account and sign in with GitHub to publish.",
        action: {
          label: "Connect",
          onClick: () => setSupabaseIntentCounter(c => c + 1),
        },
      });
      return;
    }
  
    setIsPublishing(true);
    const sanitizedProjectName = projectName.trim().replace(/[^a-zA-Z0-9-._]/g, '-').toLowerCase() || 'brimy-project';
    const toastId = toast.loading("Publishing to GitHub...", { description: `Preparing repository '${sanitizedProjectName}'...` });
  
    try {
      const repoUrl = await publishToGitHub(projectName, code);
      toast.success("Published successfully!", {
        id: toastId,
        description: `Project available at ${sanitizedProjectName}`,
        action: {
          label: "Open Repository",
          onClick: () => window.open(repoUrl, "_blank"),
        },
      });
    } catch (error: any) {
      console.error("Failed to publish to GitHub:", error);
      toast.error("Publishing failed", {
        id: toastId,
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (!projectId) {
    return <div>Cargando proyecto...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground animate-fade-in">
      <header className="h-14 border-b flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold truncate" title={projectName}>
            {projectName || "Cargando..."}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
            <Github className="h-4 w-4 mr-2" />
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Salir
          </Button>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            defaultSize={25}
            minSize={15}
            maxSize={30}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsLeftPanelCollapsed(true)}
            onExpand={() => setIsLeftPanelCollapsed(false)}
            className={cn("max-w-[400px]", isLeftPanelCollapsed ? "hidden" : "")}
          >
            <ChatPanel
              messages={messages}
              loading={loading}
              credits={credits}
              onSend={handleNewMessage}
              onCancel={handleCancelGeneration}
              selectedElement={selectedElement}
              onClearSelection={() => setSelectedElement(null)}
            />
          </ResizablePanel>
          <div
            aria-hidden="true"
            className="h-full w-px bg-border/40"
            role="separator"
          />
          <ResizablePanel defaultSize={75}>
            <PreviewPanel
              previewUrl="/preview"
              code={code}
              loading={previewLoading}
              onRefresh={handleRefreshPreview}
              isSelectionModeActive={isSelectionModeActive}
              onToggleSelectionMode={() => setIsSelectionModeActive(prev => !prev)}
              onElementSelected={handleElementSelected}
              projectName={projectName}
              supabaseIntent={supabaseIntentCounter}
              projectId={projectId}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default EditorPage;
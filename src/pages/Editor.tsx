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
import { getProviderFromLabel, streamAnswer, streamChat } from "@/services/ai";
import { cn } from "@/lib/utils";
import { Github } from "lucide-react";

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
      content: "", // Start with an empty message for streaming
    });
    setMessagesState(getMessages(projId));

    let accumulatedCode = "";
    streamAnswer({
      prompt,
      selectedModelLabel: selectedModel,
      apiKeys,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk) => {
        accumulatedCode += chunk;
        setMessagesState(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content += chunk;
          return newMessages;
        });
      },
      onComplete: () => {
        if (includesSupabaseIntent(accumulatedCode)) {
          setSupabaseIntentCounter((c) => c + 1);
        }
        toast.success("Generación completada");
        setCode(projId, accumulatedCode);
        setCodeState(accumulatedCode);
        
        const finalMessages = getMessages(projId);
        finalMessages[finalMessages.length - 1].content = "Generación completada — la previsualización está lista.";
        setMessages(projId, finalMessages);
        setMessagesState(finalMessages);

        const cost = Math.floor(Math.random() * 4001) + 1000;
        const newCredits = decrementCredits(projId, cost);
        setCredits(newCredits);
        toast.info(`${cost.toLocaleString()} tokens used.`);
        
        setLoading(false);
        setPreviewLoading(false);
        abortControllerRef.current = null;
      },
      onError: (err) => {
        const errorMessage = err.message || "Ocurrió un error desconocido.";
        console.error("La generación con IA ha fallado:", err);
        toast.error("La petición a la IA ha fallado", { description: errorMessage });
        
        const finalMessages = getMessages(projId);
        finalMessages[finalMessages.length - 1].content = `La generación con IA ha fallado con el siguiente error:\n\n> ${errorMessage}\n\nPor favor, revisa tu clave de API y la configuración del modelo.`;
        setMessages(projId, finalMessages);
        setMessagesState(finalMessages);

        setLoading(false);
        setPreviewLoading(false);
        abortControllerRef.current = null;
      }
    });
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
      const finalMessages = getMessages(projectId);
      if (finalMessages.length > 0 && finalMessages[finalMessages.length - 1].role === 'assistant') {
        finalMessages[finalMessages.length - 1].content += '\n\nGeneración cancelada por el usuario.';
      } else {
        addMessage(projectId, { role: 'assistant', content: 'Generación cancelada por el usuario.' });
      }
      setMessages(projectId, finalMessages);
      setMessagesState(finalMessages);
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

    addMessage(projectId, { role: "user", content: messageContent });
    addMessage(projectId, { role: "assistant", content: "" }); // Placeholder for streaming
    setMessagesState(getMessages(projectId));
    setLoading(true);

    const apiKeys = storage.getJSON<Record<string, string>>("api-keys", {});
    const selectedModel = getSelectedModelLabel();

    const onChunk = (chunk: string) => {
      setMessagesState(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content += chunk;
        return newMessages;
      });
    };

    const onComplete = (finalContent: string) => {
      if (includesSupabaseIntent(finalContent)) {
        setSupabaseIntentCounter((c) => c + 1);
      }
      const finalMessages = getMessages(projectId);
      finalMessages[finalMessages.length - 1].content = finalContent;
      setMessages(projectId, finalMessages);

      const cost = Math.floor(Math.random() * 4001) + 1000;
      const newCredits = decrementCredits(projectId, cost);
      setCredits(newCredits);

      setLoading(false);
      if (!isAsk) setPreviewLoading(false);
      abortControllerRef.current = null;
    };

    const onError = (err: Error) => {
      const errorMessage = err?.message || "Ocurrió un error desconocido.";
      console.error("Error en la operación de IA:", err);
      toast.error(isAsk ? "La pregunta a la IA ha fallado" : "La generación con IA ha fallado", {
        description: errorMessage,
      });
      const finalMessages = getMessages(projectId);
      finalMessages[finalMessages.length - 1].content = `La operación de IA ha fallado:\n\n> ${errorMessage}`;
      setMessages(projectId, finalMessages);
      setMessagesState(finalMessages);
      setLoading(false);
      if (!isAsk) setPreviewLoading(false);
      abortControllerRef.current = null;
    };

    if (isAsk) {
      let accumulatedResponse = "";
      streamChat({
        messages: getMessages(projectId).slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        selectedModelLabel: selectedModel,
        apiKeys,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk) => {
          accumulatedResponse += chunk;
          onChunk(chunk);
        },
        onComplete: () => onComplete(accumulatedResponse),
        onError,
      });
    } else {
      setPreviewLoading(true);
      let accumulatedCode = "";
      streamAnswer({
        prompt: messageContent,
        selectedModelLabel: selectedModel,
        apiKeys,
        codeContext: code,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk) => {
          accumulatedCode += chunk;
          onChunk(chunk);
        },
        onComplete: () => {
          setCode(projectId, accumulatedCode);
          setCodeState(accumulatedCode);
          onComplete("Listo. He aplicado tus cambios y actualizado la previsualización.");
        },
        onError,
      });
    }
  }, [projectId, selectedElement, code]);

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
    <div className="h-screen w-screen flex flex-col bg-background text-foreground animate-fade-in">
      <header className="h-14 border-b flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold truncate" title={projectName}>
            {projectName || "Cargando..."}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate(`/publish/${projectId}`)}>
            <Github className="h-4 w-4 mr-2" />
            Publish
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
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
import { 
  getProjectById, 
  StoredMessage, 
  setMessages, 
  getMessages, 
  addMessage, 
  getPreviewHtml, 
  setPreviewHtml as persistPreviewHtml, 
  getCredits, 
  decrementCredits, 
  ProjectFile, 
  getProjectFiles, 
  setProjectFiles as persistProjectFiles 
} from "@/lib/projects";
import { storage } from "@/lib/storage";
import { getSelectedModelLabel } from "@/lib/settings";
import { getProviderFromLabel, generateAnswer, generateChat } from "@/services/ai";
import { cn } from "@/lib/utils";
import { Github } from "lucide-react";

function includesSupabaseIntent(text: string): boolean {
  const t = (text || "").toLowerCase();
  if (!t.includes("supabase")) return false;
  const keys = ["conectar", "conéct", "connect", "integrar", "integration", "auth", "database"];
  return keys.some((k) => t.includes(k));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
  });
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
  
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[] | null>(null);
  
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Estado para los logs en tiempo real
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);

  const [supabaseIntentCounter, setSupabaseIntentCounter] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Función para añadir logs únicos
  const addLog = (text: string) => {
    setGenerationLogs(prev => {
      // Evitar duplicados consecutivos
      if (prev.length > 0 && prev[prev.length - 1] === text) return prev;
      return [...prev, text];
    });
  };

  const triggerInitialGeneration = useCallback(async (projId: string, initialMessages: StoredMessage[]) => {
    setLoading(true);
    setPreviewLoading(true);
    setProjectFiles(null);
    setGenerationLogs(["Iniciando generación..."]); // Reset logs
    abortControllerRef.current = new AbortController();

    const firstMessage = initialMessages[0];
    if (!firstMessage) {
        setLoading(false);
        setPreviewLoading(false);
        return;
    }

    const apiKeys = storage.getJSON<Record<string, string>>("api-keys", {});
    const selectedModel = getSelectedModelLabel();
    const provider = getProviderFromLabel(selectedModel);

    if (!apiKeys[provider]) {
      toast.warning("Falta la clave de API", { description: "Por favor, configúrala en los ajustes para usar la IA." });
      addMessage(projId, { role: "assistant", content: `¡Atención! Para generar la página web con la IA, necesitas configurar tu clave de API para el proveedor '${provider}'.\n\nPuedes hacerlo en 'Settings' > 'API Keys'.` });
      setMessagesState(getMessages(projId));
      setLoading(false);
      setPreviewLoading(false);
      return;
    }

    addMessage(projId, { role: "assistant", content: "Clave de API encontrada. Empezando a generar tu proyecto con la IA..." });
    setMessagesState(getMessages(projId));

    try {
      const { files, previewHtml } = await generateAnswer({ 
        prompt: firstMessage.content, 
        images: firstMessage.images,
        selectedModelLabel: selectedModel, 
        apiKeys, 
        signal: abortControllerRef.current.signal,
        onStatusUpdate: (status) => addLog(status)
      });
      
      addLog("Finalizando procesamiento...");
      
      if (includesSupabaseIntent(previewHtml)) {
        setSupabaseIntentCounter((c) => c + 1);
      }

      setProjectFiles(files);
      persistProjectFiles(projId, files);
      setPreviewHtml(previewHtml);
      persistPreviewHtml(projId, previewHtml);
      
      setPreviewLoading(false);
      toast.success("Generación completada");
      addMessage(projId, { role: "assistant", content: "Generación completada — la previsualización y los archivos del proyecto están listos." });

      const cost = Math.floor(Math.random() * 4001) + 1000;
      const newCredits = decrementCredits(projId, cost);
      setCredits(newCredits);
      
      setLoading(false);
      setMessagesState(getMessages(projId));
      abortControllerRef.current = null;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Initial generation aborted.');
        setLoading(false);
        setPreviewLoading(false);
        return;
      }
      const errorMessage = err.message || "Ocurrió un error desconocido.";
      console.error("La generación con IA ha fallado:", err);
      
      toast.error("La petición a la IA ha fallado", { description: errorMessage });
      
      addMessage(projId, { role: "assistant", content: `La generación con IA ha fallado con el siguiente error:\n\n> ${errorMessage}\n\nPor favor, revisa tu clave de API y la configuración del modelo.` });
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
        setPreviewHtml(getPreviewHtml(projectId));
        setProjectFiles(getProjectFiles(projectId));
        setCredits(getCredits(projectId));

        if (loadedMessages.length === 1 && loadedMessages[0].role === 'user') {
          triggerInitialGeneration(projectId, loadedMessages);
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
      addMessage(projectId, { role: 'assistant', content: 'Generación cancelada por el usuario.' });
      setMessagesState(getMessages(projectId));
    }
  };

  const handleNewMessage = useCallback(async (text: string, images?: (File | string)[]) => {
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
    
    if (images && images.length > 0) {
        const dataUrls = await Promise.all(images.map(img => {
            if (typeof img === 'string') return Promise.resolve(img);
            return fileToDataUrl(img);
        }));
        userMessage.images = dataUrls;
    }

    const newMessages = [...messages, userMessage];
    setMessagesState(newMessages);
    setMessages(projectId, newMessages);
    setLoading(true);
    setGenerationLogs(["Analizando solicitud..."]);

    const apiKeys = storage.getJSON<Record<string, string>>("api-keys", {});
    const selectedModel = getSelectedModelLabel();

    try {
      if (isAsk) {
        const aiResponseContent = await generateChat({
          messages: newMessages,
          selectedModelLabel: selectedModel,
          apiKeys,
          signal: abortControllerRef.current.signal,
        });
        const aiResponse: StoredMessage = { role: "assistant", content: aiResponseContent, createdAt: Date.now() };
        const finalMessages = [...newMessages, aiResponse];
        setMessagesState(finalMessages);
        setMessages(projectId, finalMessages);
        setLoading(false);
      } else {
        setPreviewLoading(true);
        setProjectFiles(null);
        
        const currentFiles = getProjectFiles(projectId) || [];
        const codeContext = currentFiles.length > 0 ? JSON.stringify(currentFiles) : null;

        const { files: newFiles, previewHtml } = await generateAnswer({
          prompt: messageContent,
          images: userMessage.images,
          selectedModelLabel: selectedModel,
          apiKeys,
          codeContext: codeContext,
          signal: abortControllerRef.current.signal,
          onStatusUpdate: (status) => addLog(status)
        });
        
        addLog("Aplicando cambios...");
        
        if (includesSupabaseIntent(previewHtml)) {
          setSupabaseIntentCounter((c) => c + 1);
        }

        // Calculate Diffs
        const changes: { type: 'create' | 'update', path: string }[] = [];
        newFiles.forEach(nf => {
            const old = currentFiles.find(of => of.path === nf.path);
            if (!old) {
                changes.push({ type: 'create', path: nf.path });
            } else if (old.content !== nf.content) {
                changes.push({ type: 'update', path: nf.path });
            }
        });

        setProjectFiles(newFiles);
        persistProjectFiles(projectId, newFiles);
        setPreviewHtml(previewHtml);
        persistPreviewHtml(projectId, previewHtml);
        setPreviewLoading(false);

        const changesJson = JSON.stringify(changes);
        const aiResponseContent = `Listo. He aplicado tus cambios.\n---CHANGES---${changesJson}`;
        
        const cost = Math.floor(Math.random() * 4001) + 1000;
        const newCredits = decrementCredits(projectId, cost);
        setCredits(newCredits);

        const aiResponse: StoredMessage = { role: "assistant", content: aiResponseContent, createdAt: Date.now() };
        const finalMessages = [...newMessages, aiResponse];
        setMessagesState(finalMessages);
        setMessages(projectId, finalMessages);
        setLoading(false);
        abortControllerRef.current = null;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation aborted by user.');
        setLoading(false);
        if (!isAsk) setPreviewLoading(false);
        return;
      }
      const errorMessage = err?.message || "Ocurrió un error desconocido.";
      console.error("Error en la operación de IA:", err);
      toast.error(isAsk ? "La pregunta a la IA ha fallado" : "La generación con IA ha fallado", { description: errorMessage });
      const aiResponse: StoredMessage = { role: "assistant", content: `La operación de IA ha fallado:\n\n> ${errorMessage}`, createdAt: Date.now() };
      const finalMessages = [...newMessages, aiResponse];
      setMessagesState(finalMessages);
      setMessages(projectId, finalMessages);
      setLoading(false);
      if (!isAsk) setPreviewLoading(false);
    }
  }, [messages, projectId, selectedElement]);

  const handleRefreshPreview = () => {
    setPreviewLoading(true);
    setTimeout(() => setPreviewLoading(false), 1500);
  };

  const handleElementSelected = (description: string) => {
    setSelectedElement(description);
    setIsSelectionModeActive(false);
  };

  const handleRetry = (text: string, images?: string[]) => {
    handleNewMessage(text, images);
  };

  if (!projectId) {
    return <div>Cargando proyecto...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground animate-fade-in">
      <header className="h-14 border-b flex items-center px-4 justify-between flex-shrink-0 bg-background">
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
              generationLogs={generationLogs}
              onRetry={handleRetry}
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
              code={previewHtml}
              files={projectFiles}
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
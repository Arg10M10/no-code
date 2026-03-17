"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
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
import { getSelectedModelLabel } from "@/lib/settings";
import { getProviderFromLabel, generateAnswer, generateChat } from "@/services/ai";
import { cn } from "@/lib/utils";
import { Github, Save } from "lucide-react";
import { getApiKeysFromLocalStorage } from "@/lib/storage";

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

  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [thoughtProcess, setThoughtProcess] = useState<string>("");
  const [codeStream, setCodeStream] = useState<string>("");

  const [supabaseIntentCounter, setSupabaseIntentCounter] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Estados de Terminal y Node.js
  const [localhostUrl, setLocalhostUrl] = useState<string | null>(null);
  const [npmOutput, setNpmOutput] = useState<string[]>([]);
  const [npmError, setNpmError] = useState<string[]>([]);
  const [isNpmRunning, setIsNpmRunning] = useState(false);
  const isElectron = typeof window.electronAPI !== 'undefined';

  const addLog = (text: string) => {
    setGenerationLogs(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === text) return prev;
      return [...prev, text];
    });
  };

  // Escuchar salida de la terminal de Electron
  useEffect(() => {
    if (!isElectron) return;

    const unsubscribeOutput = window.electronAPI.onProjectDevServerOutput((data) => {
        setNpmOutput(prev => [...prev, data]);
    });

    const unsubscribeError = window.electronAPI.onProjectDevServerError((data) => {
        setNpmError(prev => [...prev, data]);
    });

    const unsubscribeReady = window.electronAPI.onProjectDevServerReady((url) => {
        setLocalhostUrl(url);
        setPreviewLoading(false);
        setIsNpmRunning(true);
        toast.success(`Servidor listo en ${url}`, { duration: 5000 });
    });

    const unsubscribeStopped = window.electronAPI.onProjectDevServerStopped(() => {
        setLocalhostUrl(null);
        setIsNpmRunning(false);
        setPreviewLoading(false);
        toast.info("Servidor detenido.");
    });

    // Consultar estado inicial
    window.electronAPI.getProjectDevServerUrl().then(url => {
        if (url) {
            setLocalhostUrl(url);
            setIsNpmRunning(true);
        }
    });

    return () => {
        unsubscribeOutput();
        unsubscribeError();
        unsubscribeReady();
        unsubscribeStopped();
    };
  }, [isElectron]);

  const executeNpmCommand = useCallback(async (command: string, args: string[], showToast = true) => {
    if (!isElectron) {
        toast.error("Terminal no disponible en navegador.");
        return;
    }
    const fullCmd = `${command} ${args.join(' ')}`;
    setNpmOutput(prev => [...prev, `\n> ${fullCmd}`]);
    
    try {
        const result = await window.electronAPI.runNpmCommand(command, args);
        if (showToast && result) toast.success(`Comando completado: ${command}`);
    } catch (error: any) {
        console.error(`Error ejecuciòn:`, error);
        if (showToast) toast.error(`Error en terminal: ${error.message}`);
    }
  }, [isElectron]);

  const handleRebuild = useCallback(async () => {
      if (!isElectron || !projectId) return;
      toast.info("Reinstalando dependencias y reiniciando servidor...");
      setPreviewLoading(true);
      setNpmOutput(prev => [...prev, "\n--- INICIANDO REBUILD ---"]);
      
      try {
        const userProjectsBasePath = await window.electronAPI.getProjectPath();
        await window.electronAPI.runNpmCommand('npm', ['install']);
        await window.electronAPI.startProjectDevServer(userProjectsBasePath, projectId);
      } catch (error: any) {
        toast.error(`Rebuild falló: ${error.message}`);
        setPreviewLoading(false);
      }
  }, [isElectron, projectId]);

  const handleRestart = useCallback(async () => {
      if (!isElectron || !projectId) return;
      toast.info("Reiniciando servidor de desarrollo...");
      setPreviewLoading(true);
      setLocalhostUrl(null);
      try {
        const userProjectsBasePath = await window.electronAPI.getProjectPath();
        await window.electronAPI.startProjectDevServer(userProjectsBasePath, projectId);
      } catch (error: any) {
        toast.error(`Error al iniciar: ${error.message}`);
        setPreviewLoading(false);
      }
  }, [isElectron, projectId]);

  const handleStopDevServer = useCallback(async () => {
    if (!isElectron) return;
    await window.electronAPI.stopProjectDevServer();
  }, [isElectron]);

  const triggerInitialGeneration = useCallback(async (projId: string, initialMessages: StoredMessage[]) => {
    setLoading(true);
    setPreviewLoading(true);
    setProjectFiles(null);
    setGenerationLogs([]); 
    setThoughtProcess("");
    setCodeStream("");
    abortControllerRef.current = new AbortController();

    const firstMessage = initialMessages[0];
    if (!firstMessage) {
        setLoading(false);
        setPreviewLoading(false);
        return;
    }

    const apiKeys = getApiKeysFromLocalStorage();
    const selectedModel = getSelectedModelLabel();
    const provider = getProviderFromLabel(selectedModel);

    if (!apiKeys[provider]) {
      toast.warning(`Falta clave de API de ${provider}`, { description: "Ve a Configuración > API Keys para añadirla." });
      addMessage(projId, { role: "assistant", content: `Para empezar a construir, necesito que configures tu **API Key** de **${provider}** en la pestaña de Configuración.` });
      setMessagesState(getMessages(projId));
      setLoading(false);
      setPreviewLoading(false);
      return;
    }
    
    try {
      const { files, previewHtml, thoughtProcess: finalThought } = await generateAnswer({ 
        prompt: firstMessage.content, 
        images: firstMessage.images,
        selectedModelLabel: selectedModel, 
        apiKeys, 
        signal: abortControllerRef.current.signal,
        onStatusUpdate: (status) => {
            if (status.includes("Writing")) addLog(status);
        },
        onThoughtUpdate: (text) => setThoughtProcess(text),
        onCodeStreamUpdate: (code) => setCodeStream(code)
      });
      
      setProjectFiles(files);
      persistProjectFiles(projId, files);
      
      if (isElectron) {
        await window.electronAPI.saveProjectFiles(projId, files);
      }

      setPreviewHtml(previewHtml);
      persistPreviewHtml(projId, previewHtml);
      setPreviewLoading(false);
      
      addMessage(projId, { role: "assistant", content: finalThought || "Proyecto generado con éxito." });
      setCredits(decrementCredits(projId, 1000));
      setLoading(false);
      setMessagesState(getMessages(projId));

      if (isElectron) handleRestart();

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast.error("Error de IA", { description: err.message });
      addMessage(projId, { role: "assistant", content: `Lo siento, algo ha fallado: ${err.message}` });
      setLoading(false);
      setPreviewLoading(false);
      setMessagesState(getMessages(projId));
    } finally {
      abortControllerRef.current = null;
    }
  }, [isElectron, handleRestart]);

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
      messageContent = `[Elemento: ${selectedElement}] ${cleanedText}`;
      setSelectedElement(null);
    }

    const userMessage: StoredMessage = { role: "user", content: messageContent, createdAt: Date.now() };
    
    if (images && images.length > 0) {
        const dataUrls = await Promise.all(images.map(img => typeof img === 'string' ? Promise.resolve(img) : fileToDataUrl(img)));
        userMessage.images = dataUrls;
    }

    const newMessages = [...messages, userMessage];
    setMessagesState(newMessages);
    setMessages(projectId, newMessages);
    setLoading(true);
    setGenerationLogs([]); 
    setThoughtProcess("");
    setCodeStream("");

    const apiKeys = getApiKeysFromLocalStorage();
    const selectedModel = getSelectedModelLabel();
    const provider = getProviderFromLabel(selectedModel);

    if (!apiKeys[provider]) {
        toast.warning(`Falta clave de ${provider}`);
        const errMsg = { role: "assistant", content: `Por favor configura la API Key de **${provider}** en Configuración.`, createdAt: Date.now() } as StoredMessage;
        setMessagesState([...newMessages, errMsg]);
        setMessages(projectId, [...newMessages, errMsg]);
        setLoading(false);
        return;
    }

    try {
      if (isAsk) {
        const placeholderId = Date.now();
        setMessagesState([...newMessages, { role: "assistant", content: "", createdAt: placeholderId }]);

        const aiResponseContent = await generateChat({
          messages: newMessages,
          selectedModelLabel: selectedModel,
          apiKeys,
          signal: abortControllerRef.current.signal,
          onUpdate: (partialText) => {
             setMessagesState(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant" && last.createdAt === placeholderId) last.content = partialText;
                return updated;
             });
          }
        });
        
        const finalMessages = [...newMessages, { role: "assistant", content: aiResponseContent, createdAt: placeholderId } as StoredMessage];
        setMessagesState(finalMessages);
        setMessages(projectId, finalMessages);
        setLoading(false);
      } else {
        setPreviewLoading(true);
        const currentFiles = getProjectFiles(projectId) || [];
        const codeContext = currentFiles.length > 0 ? JSON.stringify(currentFiles) : null;

        const { files: newFiles, previewHtml, thoughtProcess: finalThought } = await generateAnswer({
          prompt: messageContent,
          images: userMessage.images,
          selectedModelLabel: selectedModel,
          apiKeys,
          codeContext,
          signal: abortControllerRef.current.signal,
          onStatusUpdate: (status) => { if (status.includes("Writing")) addLog(status); },
          onThoughtUpdate: (text) => setThoughtProcess(text),
          onCodeStreamUpdate: (code) => setCodeStream(code)
        });
        
        setProjectFiles(newFiles);
        persistProjectFiles(projectId, newFiles);
        if (isElectron) await window.electronAPI.saveProjectFiles(projectId, newFiles);

        setPreviewHtml(previewHtml);
        persistPreviewHtml(projectId, previewHtml);
        setPreviewLoading(false);

        const changes: { type: 'create' | 'update', path: string }[] = [];
        newFiles.forEach(nf => {
            const old = currentFiles.find(of => of.path === nf.path);
            if (!old) changes.push({ type: 'create', path: nf.path });
            else if (old.content !== nf.content) changes.push({ type: 'update', path: nf.path });
        });

        const changesJson = JSON.stringify(changes);
        const aiResponseContent = `${finalThought || "Cambios aplicados con éxito."}\n---CHANGES---${changesJson}`;
        
        setCredits(decrementCredits(projectId, 1000));
        const finalMessages = [...newMessages, { role: "assistant", content: aiResponseContent, createdAt: Date.now() }];
        setMessagesState(finalMessages);
        setMessages(projectId, finalMessages);
        setLoading(false);

        if (isElectron) handleRestart();
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast.error("Error", { description: err.message });
      const errMsg = { role: "assistant", content: `Error: ${err.message}`, createdAt: Date.now() };
      setMessagesState([...newMessages, errMsg]);
      setMessages(projectId, [...newMessages, errMsg]);
      setLoading(false);
      setPreviewLoading(false);
    } finally {
        abortControllerRef.current = null;
    }
  }, [messages, projectId, selectedElement, isElectron, handleRestart]);

  const handleRefreshPreview = () => {
    if (isElectron) handleRestart();
    else {
      setPreviewLoading(true);
      setTimeout(() => setPreviewLoading(false), 800);
    }
  };

  const handleElementSelected = (description: string) => {
    setSelectedElement(description);
    setIsSelectionModeActive(false);
  };

  if (!projectId) return <div className="flex h-screen items-center justify-center font-bold">Cargando...</div>;

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground animate-fade-in overflow-hidden">
      <header className="h-14 border-b flex items-center px-4 justify-between flex-shrink-0 bg-card/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-lg border border-border/50">
             <Save className="h-4 w-4 text-muted-foreground" />
             <h1 className="text-sm font-bold truncate max-w-[250px]" title={projectName}>
                {projectName || "Nuevo Proyecto"}
             </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 px-4 gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary" onClick={() => navigate(`/publish/${projectId}`)}>
            <Github className="h-4 w-4" />
            Publicar
          </Button>
          <Button variant="ghost" size="sm" className="h-9 px-4 font-bold text-muted-foreground hover:text-foreground" onClick={() => navigate('/')}>
            Salir
          </Button>
        </div>
      </header>
      
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel
            defaultSize={30}
            minSize={25}
            maxSize={45}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsLeftPanelCollapsed(true)}
            onExpand={() => setIsLeftPanelCollapsed(false)}
            className={cn("bg-background z-10 shadow-xl", isLeftPanelCollapsed ? "hidden" : "")}
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
              thought={thoughtProcess}
              codeStream={codeStream}
              onRetry={(text, images) => handleNewMessage(text, images)}
            />
          </ResizablePanel>
          
          <ResizableHandle className="w-1.5 bg-border/20 hover:bg-primary/40 transition-all duration-300" />
          
          <ResizablePanel defaultSize={70}>
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
              localhostUrl={localhostUrl}
              npmOutput={npmOutput}
              npmError={npmError}
              isNpmRunning={isNpmRunning}
              onRebuild={handleRebuild}
              onRestart={handleRestart}
              onStopDevServer={handleStopDevServer}
              onRunCommand={executeNpmCommand}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default EditorPage;
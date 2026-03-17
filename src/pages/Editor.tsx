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
import { Github } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getApiKeysFromLocalStorage } from "@/lib/storage"; // Import the new local storage utility

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

// Removed fetchApiKeysFromSupabase as keys are now local

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

  // NPM Command States
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

  // Effect to listen for npm command output from Electron
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
        setIsNpmRunning(true); // Mark as running once URL is ready
        toast.success(`Dev server running at ${url}`);
    });

    const unsubscribeStopped = window.electronAPI.onProjectDevServerStopped(() => {
        setLocalhostUrl(null);
        setIsNpmRunning(false);
        setPreviewLoading(false);
        toast.info("Dev server stopped.");
    });

    // Get initial URL if server is already running
    window.electronAPI.getProjectDevServerUrl().then(url => {
        if (url) {
            setLocalhostUrl(url);
            setIsNpmRunning(true);
            setPreviewLoading(false);
        }
    });

    return () => {
        unsubscribeOutput();
        unsubscribeError();
        unsubscribeReady();
        unsubscribeStopped();
    };
  }, [isElectron]);

  // Helper to execute NPM commands via Electron
  const executeNpmCommand = useCallback(async (command: string, args: string[], showToast = true) => {
    if (!isElectron) {
        toast.error("Electron API not available. Cannot run NPM commands.");
        return;
    }
    setNpmOutput([]);
    setNpmError([]);
    setIsNpmRunning(true); // Assume running for any command
    try {
        // No need to get projectPath here, as runNpmCommand uses currentProjectRootPath from main.js
        const result = await window.electronAPI.runNpmCommand(command, args);
        console.log(`NPM command '${command} ${args.join(' ')}' finished:`, result);
        if (showToast) toast.success(`NPM command '${command} ${args.join(' ')}' completed.`);
    } catch (error: any) {
        console.error(`NPM command '${command} ${args.join(' ')}' failed:`, error);
        if (showToast) toast.error(`NPM command failed: ${error.message}`);
    } finally {
        setIsNpmRunning(false); // Reset after command finishes
    }
  }, [isElectron]);

  const handleRebuild = useCallback(async () => {
      if (!isElectron || !projectId) return;
      toast.info("Rebuilding project: Running npm install and restarting dev server...");
      setPreviewLoading(true);
      setIsNpmRunning(true);
      setNpmOutput([]);
      setNpmError([]);
      setLocalhostUrl(null);

      try {
        const userProjectsBasePath = await window.electronAPI.getProjectPath();
        await window.electronAPI.runNpmCommand('npm', ['install']); // This will run in the current project's directory
        await window.electronAPI.startProjectDevServer(userProjectsBasePath, projectId);
      } catch (error: any) {
        toast.error(`Rebuild failed: ${error.message}`);
        setPreviewLoading(false);
        setIsNpmRunning(false);
      }
  }, [isElectron, projectId]);

  const handleRestart = useCallback(async () => {
      if (!isElectron || !projectId) return;
      toast.info("Restarting dev server...");
      setPreviewLoading(true);
      setIsNpmRunning(true);
      setNpmOutput([]);
      setNpmError([]);
      setLocalhostUrl(null);
      try {
        const userProjectsBasePath = await window.electronAPI.getProjectPath();
        await window.electronAPI.startProjectDevServer(userProjectsBasePath, projectId);
      } catch (error: any) {
        toast.error(`Restart failed: ${error.message}`);
        setPreviewLoading(false);
        setIsNpmRunning(false);
      }
  }, [isElectron, projectId]);

  const handleStopDevServer = useCallback(async () => {
    if (!isElectron) return;
    toast.info("Stopping dev server...");
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

    const apiKeys = getApiKeysFromLocalStorage(); // Fetch from local storage
    const selectedModel = getSelectedModelLabel();
    const provider = getProviderFromLabel(selectedModel);

    if (!apiKeys[provider]) {
      toast.warning(`Falta la clave API de ${provider}`, { description: "Configúrala en Settings > API Keys." });
      addMessage(projId, { role: "assistant", content: `¡Atención! Necesitas configurar tu clave de API para el proveedor **${provider}** en Settings.` });
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
            if (status.includes("Writing")) {
                addLog(status);
            }
        },
        onThoughtUpdate: (text) => setThoughtProcess(text),
        onCodeStreamUpdate: (code) => setCodeStream(code)
      });
      
      if (includesSupabaseIntent(previewHtml)) {
        setSupabaseIntentCounter((c) => c + 1);
      }

      setProjectFiles(files);
      persistProjectFiles(projId, files);
      
      // Save files to disk via Electron IPC
      if (isElectron) {
        await window.electronAPI.saveProjectFiles(projId, files);
      }

      setPreviewHtml(previewHtml);
      persistPreviewHtml(projId, previewHtml);
      
      setPreviewLoading(false);
      toast.success("Proyecto generado");
      
      const content = finalThought 
        ? `${finalThought}\n\nGeneración completada.` 
        : "Generación completada.";
      
      addMessage(projId, { role: "assistant", content });
      setCredits(decrementCredits(projId, 1000));
      setLoading(false);
      setMessagesState(getMessages(projId));

      // If in Electron, start the dev server after initial generation
      if (isElectron) {
        handleRestart();
      }

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Error IA:", err);
      toast.error("Error en generación", { description: err.message });
      addMessage(projId, { role: "assistant", content: `Error: ${err.message}` });
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
        } else if (isElectron && projectFiles && projectFiles.length > 0 && !localhostUrl && !isNpmRunning) {
          // If project files exist and not already running, start dev server
          handleRestart();
        }
      } else {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [projectId, navigate, triggerInitialGeneration, isElectron, projectFiles, localhostUrl, isNpmRunning, handleRestart]);

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
    setPreviewLoading(false);
    if (projectId) {
      addMessage(projectId, { role: 'assistant', content: 'Operación cancelada.' });
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
      messageContent = `Sobre el elemento "${selectedElement}": ${cleanedText}`;
      setSelectedElement(null);
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
    setGenerationLogs([]); 
    setThoughtProcess("");
    setCodeStream("");

    const apiKeys = getApiKeysFromLocalStorage(); // Fetch from local storage
    const selectedModel = getSelectedModelLabel();
    const provider = getProviderFromLabel(selectedModel);

    if (!apiKeys[provider]) {
        toast.warning(`Falta clave de ${provider}`);
        const errMsg = { role: "assistant", content: `Por favor configura la API Key de **${provider}** en Settings.`, createdAt: Date.now() } as StoredMessage;
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
                if (last.role === "assistant" && last.createdAt === placeholderId) {
                    last.content = partialText;
                }
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
        setProjectFiles(null);
        
        const currentFiles = getProjectFiles(projectId) || [];
        const codeContext = currentFiles.length > 0 ? JSON.stringify(currentFiles) : null;

        const { files: newFiles, previewHtml, thoughtProcess: finalThought } = await generateAnswer({
          prompt: messageContent,
          images: userMessage.images,
          selectedModelLabel: selectedModel,
          apiKeys,
          codeContext: codeContext,
          signal: abortControllerRef.current.signal,
          onStatusUpdate: (status) => {
             if (status.includes("Writing")) addLog(status);
          },
          onThoughtUpdate: (text) => setThoughtProcess(text),
          onCodeStreamUpdate: (code) => setCodeStream(code)
        });
        
        if (includesSupabaseIntent(previewHtml)) setSupabaseIntentCounter((c) => c + 1);

        const changes: { type: 'create' | 'update', path: string }[] = [];
        newFiles.forEach(nf => {
            const old = currentFiles.find(of => of.path === nf.path);
            if (!old) changes.push({ type: 'create', path: nf.path });
            else if (old.content !== nf.content) changes.push({ type: 'update', path: nf.path });
        });

        setProjectFiles(newFiles);
        persistProjectFiles(projectId, newFiles);

        // Save files to disk via Electron IPC
        if (isElectron) {
          await window.electronAPI.saveProjectFiles(projectId, newFiles);
        }

        setPreviewHtml(previewHtml);
        persistPreviewHtml(projectId, previewHtml);
        setPreviewLoading(false);

        const changesJson = JSON.stringify(changes);
        const aiResponseContent = `${finalThought ? finalThought + "\n\n" : ""}He aplicado los cambios.\n---CHANGES---${changesJson}`;
        
        setCredits(decrementCredits(projectId, 1000));

        const finalMessages = [...newMessages, { role: "assistant", content: aiResponseContent, createdAt: Date.now() }];
        setMessagesState(finalMessages);
        setMessages(projectId, finalMessages);
        setLoading(false);

        // If in Electron, restart the dev server after code generation
        if (isElectron) {
          handleRestart();
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      toast.error("Error", { description: err.message });
      const errMsg = { role: "assistant", content: `Error: ${err.message}`, createdAt: Date.now() };
      setMessagesState([...newMessages, errMsg]);
      setMessages(projectId, [...newMessages, errMsg]);
      setLoading(false);
      if (!isAsk) setPreviewLoading(false);
    } finally {
        abortControllerRef.current = null;
    }
  }, [messages, projectId, selectedElement, isElectron, handleRestart]);

  const handleRefreshPreview = () => {
    if (isElectron) {
      handleRestart(); // In Electron, refresh means restarting the dev server
    } else {
      setPreviewLoading(true);
      setTimeout(() => setPreviewLoading(false), 800);
    }
  };

  const handleElementSelected = (description: string) => {
    setSelectedElement(description);
    setIsSelectionModeActive(false);
  };

  const handleRetry = (text: string, images?: string[]) => handleNewMessage(text, images);

  if (!projectId) return <div>Cargando...</div>;

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground animate-fade-in">
      <header className="h-14 border-b flex items-center px-4 justify-between flex-shrink-0 bg-background">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold truncate max-w-[200px]" title={projectName}>
            {projectName || "Proyecto"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/publish/${projectId}`)}>
            <Github className="h-4 w-4 mr-2" />
            GitHub
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Salir
          </Button>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            defaultSize={30}
            minSize={20}
            maxSize={40}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsLeftPanelCollapsed(true)}
            onExpand={() => setIsLeftPanelCollapsed(false)}
            className={cn("bg-background", isLeftPanelCollapsed ? "hidden" : "")}
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
              onRetry={handleRetry}
            />
          </ResizablePanel>
          <ResizableHandle className="w-1.5 bg-border/40 hover:bg-primary/50 transition-colors" />
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
              // New props for NPM commands
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
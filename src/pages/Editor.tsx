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
import { getProviderFromLabel, generateAnswer } from "@/services/ai";
import { cn } from "@/lib/utils";
import { Github, Save, Play, RotateCcw } from "lucide-react";
import { getApiKeysFromLocalStorage } from "@/lib/storage";

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

  // Estados de Node.js/NPM
  const [localhostUrl, setLocalhostUrl] = useState<string | null>(null);
  const [isNpmRunning, setIsNpmRunning] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isElectron = typeof window.electronAPI !== 'undefined';

  const addLog = (text: string) => {
    setGenerationLogs(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === text) return prev;
      return [...prev, text];
    });
  };

  // Escuchar salida de terminal si estamos en Electron
  useEffect(() => {
    if (!isElectron) return;
    const unsub = window.electronAPI.onNpmOutput((data: string) => {
      if (data.includes("http://localhost:") || data.includes("http://127.0.0.1:")) {
        const match = data.match(/http:\/\/(localhost|127\.0\.0\.1):\d+/);
        if (match) setLocalhostUrl(match[0]);
      }
    });
    return () => unsub();
  }, [isElectron]);

  const runDevServer = useCallback(async () => {
    if (!isElectron) return;
    setIsNpmRunning(true);
    setPreviewLoading(true);
    try {
      // En una app real, primero guardaríamos los archivos a disco
      await window.electronAPI.runNpmCommand('npm', ['run', 'dev']);
    } catch (e) {
      toast.error("Error al iniciar servidor Node.js");
    } finally {
      setPreviewLoading(false);
      setIsNpmRunning(false);
    }
  }, [isElectron]);

  const triggerInitialGeneration = useCallback(async (projId: string, initialMessages: StoredMessage[]) => {
    if (!initialMessages[0]) return;
    
    setLoading(true);
    setPreviewLoading(true);
    setGenerationLogs([]); 
    setThoughtProcess("");
    setCodeStream("");
    abortControllerRef.current = new AbortController();

    const apiKeys = getApiKeysFromLocalStorage();
    const selectedModel = getSelectedModelLabel();
    const provider = getProviderFromLabel(selectedModel);

    if (!apiKeys[provider]) {
      toast.warning(`Falta clave de ${provider}. Configúrala en Ajustes.`);
      setLoading(false);
      setPreviewLoading(false);
      return;
    }
    
    try {
      const { files, previewHtml, thoughtProcess: finalThought } = await generateAnswer({ 
        prompt: initialMessages[0].content, 
        images: initialMessages[0].images,
        selectedModelLabel: selectedModel, 
        apiKeys, 
        signal: abortControllerRef.current.signal,
        onStatusUpdate: (status) => { if (status.includes("Writing")) addLog(status); },
        onThoughtUpdate: (text) => setThoughtProcess(text),
        onCodeStreamUpdate: (code) => setCodeStream(code)
      });
      
      setProjectFiles(files);
      persistProjectFiles(projId, files);
      setPreviewHtml(previewHtml);
      persistPreviewHtml(projId, previewHtml);
      
      addMessage(projId, { role: "assistant", content: finalThought || "Proyecto generado con éxito." });
      setCredits(decrementCredits(projId, 1000));
      setLoading(false);
      setMessagesState(getMessages(projId));

      if (isElectron) runDevServer();
      else setPreviewLoading(false);

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast.error("Error de generación", { description: err.message });
      setLoading(false);
      setPreviewLoading(false);
      setMessagesState(getMessages(projId));
    } finally {
      abortControllerRef.current = null;
    }
  }, [isElectron, runDevServer]);

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
    }
  }, [projectId, navigate, triggerInitialGeneration]);

  const handleNewMessage = useCallback(async (text: string, images?: (File | string)[]) => {
    if (!projectId) return;
    abortControllerRef.current = new AbortController();
    
    const userMessage: StoredMessage = { role: "user", content: text, createdAt: Date.now() };
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

    try {
      const { files: newFiles, previewHtml, thoughtProcess: finalThought } = await generateAnswer({
        prompt: text,
        selectedModelLabel: selectedModel,
        apiKeys,
        codeContext: JSON.stringify(projectFiles || []),
        signal: abortControllerRef.current.signal,
        onStatusUpdate: (status) => { if (status.includes("Writing")) addLog(status); },
        onThoughtUpdate: (text) => setThoughtProcess(text),
        onCodeStreamUpdate: (code) => setCodeStream(code)
      });
      
      setProjectFiles(newFiles);
      persistProjectFiles(projectId, newFiles);
      setPreviewHtml(previewHtml);
      persistPreviewHtml(projectId, previewHtml);

      const aiResponseContent = `${finalThought || "Cambios aplicados."}\n---CHANGES---[]`;
      setCredits(decrementCredits(projectId, 1000));
      const finalMessages = [...newMessages, { role: "assistant", content: aiResponseContent, createdAt: Date.now() }];
      setMessagesState(finalMessages);
      setMessages(projectId, finalMessages);
      setLoading(false);

      if (isElectron) runDevServer();
      else setPreviewLoading(false);

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast.error("Error", { description: err.message });
      setLoading(false);
      setPreviewLoading(false);
    } finally {
      abortControllerRef.current = null;
    }
  }, [messages, projectId, projectFiles, isElectron, runDevServer]);

  if (!projectId) return null;

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden">
      <header className="h-14 border-b flex items-center px-4 justify-between flex-shrink-0 bg-card/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-lg border border-border/50">
             <Save className="h-4 w-4 text-muted-foreground" />
             <h1 className="text-sm font-bold truncate max-w-[250px]">{projectName || "Proyecto"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isElectron && (
            <Button size="sm" variant="outline" className="h-9 border-green-500/30 text-green-500 hover:bg-green-500/10" onClick={runDevServer}>
              <Play className="h-4 w-4 mr-2" /> Run Node.js
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-9" onClick={() => navigate(`/publish/${projectId}`)}>
            <Github className="h-4 w-4 mr-2" /> Publicar
          </Button>
          <Button variant="ghost" size="sm" className="h-9" onClick={() => navigate('/')}>Salir</Button>
        </div>
      </header>
      
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={25} className={cn("bg-background", isLeftPanelCollapsed ? "hidden" : "")}>
            <ChatPanel
              messages={messages}
              loading={loading}
              credits={credits}
              onSend={handleNewMessage}
              onCancel={() => abortControllerRef.current?.abort()}
              selectedElement={selectedElement}
              onClearSelection={() => setSelectedElement(null)}
              generationLogs={generationLogs}
              thought={thoughtProcess}
              codeStream={codeStream}
            />
          </ResizablePanel>
          <ResizableHandle className="w-1.5 bg-border/20" />
          <ResizablePanel defaultSize={70}>
            <PreviewPanel
              previewUrl={localhostUrl || "/preview"}
              code={previewHtml}
              files={projectFiles}
              loading={previewLoading}
              onRefresh={() => isElectron ? runDevServer() : setPreviewLoading(true)}
              isSelectionModeActive={isSelectionModeActive}
              onToggleSelectionMode={() => setIsSelectionModeActive(prev => !prev)}
              onElementSelected={setSelectedElement}
              projectName={projectName}
              projectId={projectId}
              onSaveFile={(path, content) => {
                if (!projectFiles) return;
                const next = projectFiles.map(f => f.path === path ? { ...f, content } : f);
                setProjectFiles(next);
                persistProjectFiles(projectId, next);
              }}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default EditorPage;
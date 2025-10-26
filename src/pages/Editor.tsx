"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelRightClose, Bot } from "lucide-react";
import { getProjectById, StoredMessage, setMessages, getMessages, getCredits, getCode } from "@/lib/projects";

const EditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");

  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [messages, setMessagesState] = useState<StoredMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [code, setCode] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      if (project) {
        setMessagesState(getMessages(projectId));
        setCredits(getCredits(projectId));
        setCode(getCode(projectId) || "");
      } else {
        console.error("Project not found");
      }
    }
  }, [projectId]);

  const handleNewMessage = useCallback((text: string) => {
    if (!projectId) return;

    const userMessage: StoredMessage = { role: "user", content: text, createdAt: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessagesState(newMessages);
    setMessages(projectId, newMessages);
    setLoading(true);
    setCredits(prev => Math.max(0, prev - 1));

    // Simulate AI response and code generation
    setTimeout(() => {
      const aiResponse: StoredMessage = {
        role: "assistant",
        content: "Aquí están los cambios que solicitaste. He actualizado el componente para incluir un nuevo botón y he ajustado el estilo.",
        createdAt: Date.now(),
      };
      
      const generatedCode = `
import React from 'react';
import { Button } from '@/components/ui/button';

const NewComponent = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Componente Actualizado</h1>
      <p className="mb-4">Este es el nuevo contenido generado por la IA.</p>
      <Button onClick={() => alert('¡Botón presionado!')}>Nuevo Botón</Button>
    </div>
  );
};

export default NewComponent;
`.trim();

      const finalMessages = [...newMessages, aiResponse];
      setMessagesState(finalMessages);
      setMessages(projectId, finalMessages);
      setCode(generatedCode);
      setLoading(false);
      
      // Trigger preview refresh
      setPreviewLoading(true);
      setTimeout(() => setPreviewLoading(false), 1500);

    }, 2500);
  }, [messages, projectId]);

  const handleRefreshPreview = () => {
    setPreviewLoading(true);
    setTimeout(() => {
      setPreviewLoading(false);
    }, 1500); // Simulate a refresh delay
  };

  const previewUrl = `/`; // Using root for now

  if (!projectId) {
    return <div>Cargando proyecto...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Editor del Proyecto</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bot className="h-5 w-5 text-primary" />
            <span>Dyad</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
          >
            <PanelRightClose className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            defaultSize={25}
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
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75} minSize={40}>
            <PreviewPanel
              previewUrl={previewUrl}
              code={code}
              loading={previewLoading}
              onRefresh={handleRefreshPreview}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default EditorPage;
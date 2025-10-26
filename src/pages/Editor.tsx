"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelRightClose, Bot, LogOut } from "lucide-react";
import { getProjectById, StoredMessage, setMessages, getMessages, getCredits } from "@/lib/projects";

const EditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("id");

  const [projectName, setProjectName] = useState("");
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [messages, setMessagesState] = useState<StoredMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      if (project) {
        setProjectName(project.name);
        setMessagesState(getMessages(projectId));
        setCredits(getCredits(projectId));
      } else {
        console.error("Project not found");
        navigate("/"); // Redirect if project doesn't exist
      }
    } else {
      navigate("/"); // Redirect if no project ID
    }
  }, [projectId, navigate]);

  const handleNewMessage = useCallback((text: string) => {
    if (!projectId) return;

    const userMessage: StoredMessage = { role: "user", content: text, createdAt: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessagesState(newMessages);
    setMessages(projectId, newMessages);
    setLoading(true);
    setCredits(prev => Math.max(0, prev - 1));

    // Simulate AI thinking...
    setTimeout(() => {
      const aiResponse: StoredMessage = {
        role: "assistant",
        content: "Entendido. Estoy trabajando en tus cambios. Verás la vista previa actualizada en breve.",
        createdAt: Date.now(),
      };
      const finalMessages = [...newMessages, aiResponse];
      setMessagesState(finalMessages);
      setMessages(projectId, finalMessages);
      setLoading(false);
      
      setPreviewLoading(true);
      setTimeout(() => setPreviewLoading(false), 1500);

    }, 1000);
  }, [messages, projectId]);

  const handleRefreshPreview = () => {
    setPreviewLoading(true);
    setTimeout(() => {
      setPreviewLoading(false);
    }, 1500); // Simulate a refresh delay
  };

  const previewUrl = `/preview`;

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
          <h1 className="text-lg font-semibold truncate" title={projectName}>
            {projectName || "Cargando..."}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
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
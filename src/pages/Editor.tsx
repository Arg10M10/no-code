"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { getProjectById, StoredMessage, setMessages, getMessages } from "@/lib/projects";

const EditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("id");

  const [projectName, setProjectName] = useState("");
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [messages, setMessagesState] = useState<StoredMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0); // start with 0 tokens
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // New state for selection mode
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      if (project) {
        setProjectName(project.name);
        setMessagesState(getMessages(projectId));
        // We start credits at 0 (1k-5k will be spent per question)
        setCredits(0);
      } else {
        console.error("Project not found");
        navigate("/"); // Redirect if project doesn't exist
      }
    } else {
      navigate("/"); // Redirect if no project ID
    }
  }, [projectId, navigate]);

  const computeCost = (text: string) => {
    // Simple heuristic: short questions = 1k, medium = 3k, long = 5k
    const len = (text || "").trim().length;
    if (len === 0) return 1000;
    if (len < 50) return 1000;
    if (len < 200) return 3000;
    return 5000;
  };

  const handleNewMessage = useCallback((text: string, image?: File | null) => {
    if (!projectId) return;

    let messageContent = text;
    if (selectedElement) {
      messageContent = `Regarding the element "${selectedElement}", please do the following: ${text}`;
      setSelectedElement(null); // Clear selection after sending
    }

    const userMessage: StoredMessage = { role: "user", content: messageContent, createdAt: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessagesState(newMessages);
    setMessages(projectId, newMessages);
    setLoading(true);

    // Deduct tokens based on type/question
    const cost = computeCost(text);
    setCredits((prev) => Math.max(0, prev - cost));

    // Simulate AI thinking...
    setTimeout(() => {
      const aiResponse: StoredMessage = {
        role: "assistant",
        content: "Understood. I'm working on your changes. You'll see the updated preview shortly.",
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
    setTimeout(() => {
      setPreviewLoading(false);
    }, 1500); // Simulate a refresh delay
  };

  const handleElementSelected = (description: string) => {
    setSelectedElement(description);
    setIsSelectionModeActive(false); // Automatically turn off selection mode
  };

  const previewUrl = `/preview`;

  if (!projectId) {
    return <div>Loading project...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold truncate" title={projectName}>
            {projectName || "Loading..."}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Exit
          </Button>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* Left chat panel: a bit larger (420px) for better readability */}
          <ResizablePanel
            defaultWidth={420}
            minWidth={300}
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

          {/* Vertical separator between chat and preview */}
          <div
            aria-hidden="true"
            className="h-full w-px bg-border/40"
            role="separator"
          />

          <ResizablePanel>
            <PreviewPanel
              previewUrl={previewUrl}
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
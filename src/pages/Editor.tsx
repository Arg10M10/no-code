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
import { getProjectById, StoredMessage, setMessages, getMessages, getCode, setCode } from "@/lib/projects";

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
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      if (project) {
        setProjectName(project.name);
        setMessagesState(getMessages(projectId));
        setGeneratedCode(getCode(projectId));
        setCredits(0);
      } else {
        console.error("Project not found");
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [projectId, navigate]);

  const computeCost = (text: string) => {
    const len = (text || "").trim().length;
    if (len === 0) return 1000;
    if (len < 50) return 1000;
    if (len < 200) return 3000;
    return 5000;
  };

  // NOTE: signature expected by ChatPanel is (text: string, image?: File | null)
  const handleNewMessage = useCallback((text: string, image?: File | null) => {
    if (!projectId) return;

    const userMessage: StoredMessage = { role: "user", content: text, createdAt: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessagesState(newMessages);
    setMessages(projectId, newMessages);

    // Show both chat and preview loaders immediately
    setLoading(true);
    setPreviewLoading(true);

    // Start streaming the generated code: initialize to empty string
    setGeneratedCode("");
    setCode(projectId, "");

    const cost = computeCost(text);
    setCredits((prev) => Math.max(0, prev - cost));

    // Simulate AI assistant immediate acknowledgement
    setTimeout(() => {
      const aiResponse: StoredMessage = {
        role: "assistant",
        content: "Understood. I'm generating the code for you now.",
        createdAt: Date.now(),
      };
      const updatedMessages = [...newMessages, aiResponse];
      setMessagesState(updatedMessages);
      setMessages(projectId, updatedMessages);
    }, 800);

    // Prepare fake generated code, include info about the single image if present
    const imagesCount = image ? 1 : 0;
    const fakeGeneratedCode = `import React from 'react';

const GeneratedComponent = () => {
  return (
    <div className="p-6 bg-gray-800 border border-dashed border-gray-600 rounded-lg text-white">
      <h2 className="text-xl font-bold text-cyan-400 mb-2">Generated Component</h2>
      <p className="text-gray-300">This component was generated based on your prompt.</p>
      ${imagesCount > 0 ? `<p className="text-gray-400 text-sm mt-2">Received ${imagesCount} image(s) for context.</p>` : ''}
    </div>
  );
};

export default GeneratedComponent;
`;

    // Break the fake code into chunks (by lines) to simulate streaming
    const lines = fakeGeneratedCode.split("\n");
    let idx = 0;
    const chunkInterval = 180; // ms between chunks
    const intervalId = setInterval(() => {
      if (idx >= lines.length) {
        clearInterval(intervalId);
        // finished generation
        setLoading(false);
        // leave a small delay for preview rendering, then hide preview loader
        setTimeout(() => setPreviewLoading(false), 600);
        return;
      }
      // append next line plus newline
      setGeneratedCode((prev) => {
        const next = (prev ?? "") + lines[idx] + "\n";
        // persist as we stream so preview/code tab can read it live
        setCode(projectId, next);
        return next;
      });
      idx += 1;
    }, chunkInterval);
  }, [messages, projectId]);

  const handleRefreshPreview = () => {
    setPreviewLoading(true);
    setTimeout(() => {
      setPreviewLoading(false);
    }, 1500);
  };

  const handleElementSelected = (description: string) => {
    setSelectedElement(description);
    setIsSelectionModeActive(false);
  };

  const previewUrl = `/preview?id=${projectId}`;

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
              previewUrl={previewUrl}
              previewLoading={previewLoading}
              onRefresh={handleRefreshPreview}
              isSelectionModeActive={isSelectionModeActive}
              onToggleSelectionMode={() => setIsSelectionModeActive(prev => !prev)}
              onElementSelected={handleElementSelected}
              generatedCode={generatedCode}
              codeLoading={loading && !generatedCode}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default EditorPage;
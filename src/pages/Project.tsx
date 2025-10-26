"use client";

import React from "react";
import { useParams } from "react-router-dom";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { useProject } from "@/hooks/useProject";
import Loader from "@/components/Loader";

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    project,
    messages,
    history,
    currentVersionIndex,
    loading,
    credits,
    sendMessage,
    revertToVersion,
    rebuildProject,
  } = useProject(projectId);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen w-full">
      <ResizablePanel defaultSize={50} minSize={30}>
        <ChatPanel
          messages={messages}
          loading={loading}
          credits={credits}
          onSend={sendMessage}
          history={history}
          currentVersionIndex={currentVersionIndex}
          onRevert={revertToVersion}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <PreviewPanel project={project} onRebuild={rebuildProject} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ProjectPage;
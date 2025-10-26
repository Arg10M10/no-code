"use client";

import { useState, useEffect } from "react";
import { getProjects, setProjects, getMessages, setMessages as saveMessages, StoredMessage, Project } from "@/lib/projects";

export const useProject = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [credits, setCredits] = useState(10); // Placeholder
  
  const [history, setHistory] = useState<StoredMessage[][]>([[]]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [messages, setMessages] = useState<StoredMessage[]>([]);

  useEffect(() => {
    if (projectId) {
      const projects = getProjects();
      const loadedProject = projects.find(p => p.id === projectId);
      setProject(loadedProject || null);
      if (loadedProject) {
        const loadedMessages = getMessages(loadedProject.id);
        const initialHistory = loadedMessages.length > 0 ? [loadedMessages] : [[]];
        setHistory(initialHistory);
        setCurrentVersionIndex(initialHistory.length - 1);
      }
    }
  }, [projectId]);

  useEffect(() => {
    setMessages(history[currentVersionIndex] || []);
  }, [history, currentVersionIndex]);

  const sendMessage = async (text: string) => {
    if (!project) return;

    const userMessage: StoredMessage = { role: "user", content: text, createdAt: new Date().toISOString() };
    const messagesWithUser = [...messages, userMessage];
    
    setMessages(messagesWithUser);
    setLoading(true);

    try {
      const response = await window.electron.runDyad(project.path, messagesWithUser);

      if (response.error) {
        throw new Error(response.error);
      }

      const assistantMessage: StoredMessage = { role: "assistant", content: response.message, createdAt: new Date().toISOString() };
      const finalMessages = [...messagesWithUser, assistantMessage];

      const baseHistory = history.slice(0, currentVersionIndex + 1);
      const newHistory = [...baseHistory, finalMessages];
      
      setHistory(newHistory);
      setCurrentVersionIndex(newHistory.length - 1);
      saveMessages(project.id, finalMessages);

      if (response.screenshot) {
        updatePreview(response.screenshot);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: StoredMessage = { role: "assistant", content: `Ocurrió un error: ${error instanceof Error ? error.message : String(error)}`, createdAt: new Date().toISOString() };
      
      const currentMessages = history[currentVersionIndex] || [];
      setMessages([...currentMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const revertToVersion = (index: number) => {
    if (index >= 0 && index < history.length) {
      setCurrentVersionIndex(index);
    }
  };

  const updatePreview = (screenshotPath: string) => {
    if (project) {
      const updatedProject = { ...project, screenshot: screenshotPath };
      setProject(updatedProject);
      const projects = getProjects();
      const projectIndex = projects.findIndex(p => p.id === project.id);
      if (projectIndex !== -1) {
        projects[projectIndex] = updatedProject;
        setProjects(projects);
      }
    }
  };

  const rebuildProject = async () => {
    if (!project) return;
    setIsRebuilding(true);
    try {
      await window.electron.rebuildProject(project.path);
    } catch (error) {
      console.error("Error rebuilding project:", error);
    } finally {
      setIsRebuilding(false);
    }
  };

  return {
    project,
    messages,
    history,
    currentVersionIndex,
    loading,
    isRebuilding,
    credits,
    sendMessage,
    revertToVersion,
    updatePreview,
    rebuildProject,
  };
};
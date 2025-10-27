"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createProjectFromPrompt, listProjects, Project, deleteProject, addMessage } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Settings } from "lucide-react";
import PromptSuggestions from "@/components/PromptSuggestions";
import ProjectList from "@/components/ProjectList";
import { storage } from "@/lib/storage";
import { getSelectedModelLabel } from "@/lib/settings";
import { getProviderFromLabel } from "@/services/ai";
import Navigation from "@/components/Navigation";
import LavaLamp from "@/components/LavaLamp";

const Index: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setProjects(listProjects());
  }, []);

  const handleProjectDeleted = () => {
    setProjects(listProjects());
    toast.success("Proyecto eliminado.");
  };

  const handleCreateProject = () => {
    if (!prompt.trim()) {
      toast.error("Por favor, introduce una descripción para tu proyecto.");
      return;
    }

    const apiKeys = storage.getJSON<Record<string, string>>("api-keys", {});
    const selectedModel = getSelectedModelLabel();
    const provider = getProviderFromLabel(selectedModel);

    if (!apiKeys[provider]) {
      toast.warning("Falta la clave de API", {
        description: "Por favor, configúrala en los ajustes para usar la IA.",
      });
      return;
    }

    setLoading(true);
    try {
      const newProject = createProjectFromPrompt(prompt);
      addMessage(newProject.id, { role: "user", content: prompt });
      toast.success("¡Proyecto creado con éxito!");
      navigate(`/editor?id=${newProject.id}`);
    } catch (error) {
      console.error("Error al crear el proyecto:", error);
      toast.error("Error al crear el proyecto. Por favor, inténtalo de nuevo.");
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <LavaLamp />
      <div className="relative z-10">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center pt-32 pb-12">
          <div className="max-w-3xl w-full">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              ¿Qué construimos hoy?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Describe el sitio web que quieres construir y deja que la IA le dé vida.
            </p>

            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="ej: una landing page para un nuevo producto SaaS"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateProject()}
                className="h-12 text-base"
                disabled={loading}
              />
              <Button
                type="submit"
                onClick={handleCreateProject}
                disabled={loading || !prompt.trim()}
                className="h-12"
              >
                {loading ? "Creando..." : "Empezar"}
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </div>

            <PromptSuggestions onSuggestionClick={handleSuggestionClick} />
          </div>
        </main>

        <section className="w-full bg-transparent pb-20">
          <ProjectList projects={projects} onProjectDeleted={handleProjectDeleted} />
        </section>
      </div>
    </div>
  );
};

export default Index;
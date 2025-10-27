"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createProject, getProjects, Project } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Settings } from "lucide-react";
import PromptSuggestions from "@/components/PromptSuggestions";
import ProjectList from "@/components/ProjectList";
import { storage } from "@/lib/storage";
import { getSelectedModelLabel, getProviderFromLabel } from "@/lib/settings";

const HomePage: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const handleProjectDeleted = () => {
    setProjects(getProjects());
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
        action: {
          label: "Ir a Ajustes",
          onClick: () => navigate("/settings"),
        },
      });
      return;
    }

    setLoading(true);
    try {
      const newProject = createProject(prompt);
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
    <div className="flex flex-col min-h-screen bg-background">
      <header className="absolute top-0 right-0 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/settings")}
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center pt-20 pb-12">
        <div className="max-w-3xl w-full">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Construye tu sitio web con un prompt
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
              {loading ? "Creando..." : "Empezar a Construir"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </div>

          <PromptSuggestions onSuggestionClick={handleSuggestionClick} />
        </div>
      </main>

      <section className="w-full bg-background pb-20">
        <ProjectList projects={projects} onProjectDeleted={handleProjectDeleted} />
      </section>
    </div>
  );
};

export default HomePage;
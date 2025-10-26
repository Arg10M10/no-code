import React from "react";
import { ProviderId } from "@/services/ai";

interface Model {
  label: string;
  provider: ProviderId;
}

interface ProjectContextType {
  projectName: string;
  setProjectName: (name: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  code: string | null;
  setCode: (code: string | null) => void;
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  apiKeys: Record<ProviderId, string>;
  credits: number;
}

const defaultModel: Model = { label: "GPT-4o Mini - OpenAI", provider: "openai" };

const ProjectContext = React.createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projectName, setProjectName] = React.useState("Mi Proyecto AI");
  const [prompt, setPrompt] = React.useState("");
  const [code, setCode] = React.useState<string | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<Model>(defaultModel);
  const [credits, setCredits] = React.useState(100); // Estado de créditos simulado

  // Claves API simuladas (deberían cargarse de forma segura en una app real)
  const apiKeys: Record<ProviderId, string> = {
    openai: "sk-simulated-openai-key",
    google: "simulated-google-key",
    anthropic: "simulated-anthropic-key",
    openrouter: "simulated-openrouter-key",
  };

  const value = React.useMemo(
    () => ({
      projectName,
      setProjectName,
      prompt,
      setPrompt,
      code,
      setCode,
      selectedModel,
      setSelectedModel,
      apiKeys,
      credits,
    }),
    [projectName, prompt, code, selectedModel, apiKeys, credits],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = () => {
  const context = React.useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
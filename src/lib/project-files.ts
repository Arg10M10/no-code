// NOTE: This file is generated automatically to provide the source code viewer.
// Do not edit it manually.

type ProjectFile = {
  path: string;
  content: string;
};

export const projectFiles: ProjectFile[] = [
  {
    path: "vite.config.ts",
    content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
`,
  },
  {
    path: "tailwind.config.ts",
    content: `import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
`,
  },
  {
    path: "src/main.tsx",
    content: `import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
`,
  },
  {
    path: "src/App.tsx",
    content: `import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import Editor from "./pages/Editor";
import PreviewPage from "./pages/Preview";
import PublishPage from "./pages/Publish";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="/publish/:projectId" element={<PublishPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
`,
  },
  {
    path: "src/index.css",
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Definition of the design system. All colors, gradients, fonts, etc should be defined here. 
All colors MUST be HSL.
*/

@layer base {
  :root {
    --background: 220 40% 5%;
    --foreground: 0 0% 100%;

    --card: 220 30% 8%;
    --card-foreground: 0 0% 100%;

    --popover: 220 30% 8%;
    --popover-foreground: 0 0% 100%;

    --primary: 210 100% 60%;
    --primary-foreground: 0 0% 100%;

    --secondary: 220 25% 12%;
    --secondary-foreground: 0 0% 100%;

    --muted: 220 20% 15%;
    --muted-foreground: 220 10% 60%;

    --accent: 200 100% 50%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;

    --border: 220 20% 20%;
    --input: 220 20% 15%;
    --ring: 210 100% 60%;

    --radius: 0.5rem;

    --gradient-hero: linear-gradient(135deg, hsl(210 100% 60% / 0.1), hsl(200 100% 50% / 0.1));
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  .lavalamp {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .lavalamp-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.3;
    animation: float 20s infinite ease-in-out;
  }

  .lavalamp-blob:nth-child(1) {
    width: 500px;
    height: 500px;
    background: hsl(210 100% 60%);
    top: 10%;
    left: 10%;
    animation-delay: 0s;
    animation-duration: 20s;
  }

  .lavalamp-blob:nth-child(2) {
    width: 400px;
    height: 400px;
    background: hsl(200 100% 50%);
    top: 50%;
    right: 10%;
    animation-delay: 5s;
    animation-duration: 25s;
  }

  .lavalamp-blob:nth-child(3) {
    width: 600px;
    height: 600px;
    background: hsl(220 100% 55%);
    bottom: 10%;
    left: 30%;
    animation-delay: 10s;
    animation-duration: 30s;
  }

  .lavalamp-blob:nth-child(4) {
    width: 450px;
    height: 450px;
    background: hsl(195 100% 55%);
    top: 30%;
    left: 50%;
    animation-delay: 15s;
    animation-duration: 28s;
  }

  @keyframes float {
    0% {
      transform: translate(0, 0) scale(1) rotate(0deg);
    }
    20% {
      transform: translate(100px, -80px) scale(1.2) rotate(45deg);
    }
    40% {
      transform: translate(-80px, 100px) scale(0.8) rotate(90deg);
    }
    60% {
      transform: translate(120px, 60px) scale(1.1) rotate(180deg);
    }
    80% {
      transform: translate(-60px, -100px) scale(0.9) rotate(270deg);
    }
    100% {
      transform: translate(0, 0) scale(1) rotate(360deg);
    }
  }

  /* Loader animation (from Uiverse.io by csozidev), adapted to theme */
  .loader {
    --size: 56px;
    --gap: 10px;
    --box: 14px;
    width: calc(var(--size) + var(--gap));
    display: grid;
    grid-template-columns: repeat(2, var(--box));
    grid-template-rows: repeat(2, var(--box));
    gap: var(--gap);
    transform: rotate(45deg);
  }

  .loader .box {
    position: relative;
    width: var(--box);
    height: var(--box);
    transform-style: preserve-3d;
    animation: box-shift 1.25s ease-in-out infinite;
  }

  .loader .box-1 { animation-delay: 0s; }
  .loader .box-2 { animation-delay: 0.1s; }
  .loader .box-3 { animation-delay: 0.2s; }
  .loader .box-4 { animation-delay: 0.3s; }

  .loader .side-left {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: left;
    transform: rotateY(90deg);
    background: hsl(var(--primary) / 0.7);
  }
  .loader .side-right {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    transform-origin: right;
    transform: rotateY(-90deg);
    background: hsl(var(--accent) / 0.7);
  }
  .loader .side-top {
    position: absolute;
    inset: 0;
    background: hsl(var(--primary));
    transform-origin: top;
    transform: rotateX(90deg);
  }

  @keyframes box-shift {
    0%, 10% { transform: translateZ(0) rotate(0); }
    50%     { transform: translateZ(12px) rotate(180deg); }
    90%,100%{ transform: translateZ(0) rotate(360deg); }
  }

  /* Preview overlay */
  .preview-loading-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, hsl(var(--background) / 0.6), hsl(var(--background) / 0.8));
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
}
`,
  },
  {
    path: "src/pages/Editor.tsx",
    content: `"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { getProjectById, StoredMessage, setMessages, getMessages, addMessage, getCode, setCode, getCredits, decrementCredits } from "@/lib/projects";
import { storage } from "@/lib/storage";
import { getSelectedModelLabel } from "@/lib/settings";
import { getProviderFromLabel, generateAnswer, generateChat } from "@/services/ai";
import { cn } from "@/lib/utils";
import { Github } from "lucide-react";

function includesSupabaseIntent(text: string): boolean {
  const t = (text || "").toLowerCase();
  if (!t.includes("supabase")) return false;
  const keys = ["conectar", "conéct", "connect", "integrar", "integration", "auth", "database"];
  return keys.some((k) => t.includes(k));
}

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
  const [code, setCodeState] = useState<string | null>(null);
  
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const [supabaseIntentCounter, setSupabaseIntentCounter] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const triggerInitialGeneration = useCallback(async (projId: string, prompt: string) => {
    setLoading(true);
    setPreviewLoading(true);
    setCodeState(null);
    abortControllerRef.current = new AbortController();

    const apiKeys = storage.getJSON<Record<string, string>>("api-keys", {});
    const selectedModel = getSelectedModelLabel();
    const provider = getProviderFromLabel(selectedModel);

    if (!apiKeys[provider]) {
      toast.warning("Falta la clave de API", {
        description: "Por favor, configúrala en los ajustes para usar la IA.",
      });
      addMessage(projId, {
        role: "assistant",
        content: \`¡Atención! Para generar la página web con la IA, necesitas configurar tu clave de API para el proveedor '\${provider}'.\\n\\nPuedes hacerlo en 'Settings' > 'API Keys'.\`
      });
      setMessagesState(getMessages(projId));
      setLoading(false);
      setPreviewLoading(false);
      return;
    }

    addMessage(projId, {
      role: "assistant",
      content: "Clave de API encontrada. Empezando a generar tu página con la IA...",
    });
    setMessagesState(getMessages(projId));

    try {
      const generatedCode = await generateAnswer({ prompt, selectedModelLabel: selectedModel, apiKeys, signal: abortControllerRef.current.signal });
      
      if (includesSupabaseIntent(generatedCode)) {
        setSupabaseIntentCounter((c) => c + 1);
      }

      toast.success("Generación completada");
      setCode(projId, generatedCode);
      setCodeState(generatedCode);
      addMessage(projId, { role: "assistant", content: "Generación completada — la previsualización está lista." });

      const cost = Math.floor(Math.random() * 4001) + 1000;
      const newCredits = decrementCredits(projId, cost);
      setCredits(newCredits);
      toast.info(\`\${cost.toLocaleString()} tokens used.\`);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Initial generation aborted.');
        return;
      }
      const errorMessage = err.message || "Ocurrió un error desconocido.";
      console.error("La generación con IA ha fallado:", err);
      
      toast.error("La petición a la IA ha fallado", {
        description: errorMessage,
      });
      
      addMessage(projId, {
        role: "assistant",
        content: \`La generación con IA ha fallado con el siguiente error:\\n\\n> \${errorMessage}\\n\\nPor favor, revisa tu clave de API y la configuración del modelo.\`,
      });
    } finally {
      setLoading(false);
      setPreviewLoading(false);
      setMessagesState(getMessages(projId));
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      if (project) {
        setProjectName(project.name);
        const loadedMessages = getMessages(projectId);
        setMessagesState(loadedMessages);
        setCodeState(getCode(projectId));
        setCredits(getCredits(projectId));

        if (loadedMessages.length === 1 && loadedMessages[0].role === 'user') {
          triggerInitialGeneration(projectId, loadedMessages[0].content);
        }
      } else {
        console.error("Proyecto no encontrado");
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [projectId, navigate, triggerInitialGeneration]);

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
    setPreviewLoading(false);
    if (projectId) {
      addMessage(projectId, {
        role: 'assistant',
        content: 'Generación cancelada por el usuario.',
      });
      setMessagesState(getMessages(projectId));
    }
  };

  const handleNewMessage = useCallback(async (text: string, images?: File[]) => {
    if (!projectId) return;
    abortControllerRef.current = new AbortController();

    const isAsk = text.trim().startsWith("[ASK]");
    const cleanedText = isAsk ? text.replace(/^\[ASK\]\\s*/i, "") : text;

    let messageContent = cleanedText;
    if (selectedElement) {
      messageContent = \`Respecto al elemento "\${selectedElement}", por favor haz lo siguiente: \${cleanedText}\`;
      setSelectedElement(null);
    }

    if (includesSupabaseIntent(messageContent)) {
      setSupabaseIntentCounter((c) => c + 1);
    }

    const userMessage: StoredMessage = { role: "user", content: messageContent, createdAt: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessagesState(newMessages);
    setMessages(projectId, newMessages);
    setLoading(true);

    const apiKeys = storage.getJSON<Record<string, string>>("api-keys", {});
    const selectedModel = getSelectedModelLabel();

    try {
      let aiResponseContent: string;
      if (isAsk) {
        aiResponseContent = await generateChat({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          selectedModelLabel: selectedModel,
          apiKeys,
          signal: abortControllerRef.current.signal,
        });
      } else {
        setPreviewLoading(true);
        const generatedCode = await generateAnswer({
          prompt: messageContent,
          selectedModelLabel: selectedModel,
          apiKeys,
          codeContext: code,
          signal: abortControllerRef.current.signal,
        });
        
        if (includesSupabaseIntent(generatedCode)) {
          setSupabaseIntentCounter((c) => c + 1);
        }

        setCode(projectId, generatedCode);
        setCodeState(generatedCode);
        aiResponseContent = "Listo. He aplicado tus cambios y actualizado la previsualización.";
      }

      if (includesSupabaseIntent(aiResponseContent)) {
        setSupabaseIntentCounter((c) => c + 1);
      }

      const cost = Math.floor(Math.random() * 4001) + 1000;
      const newCredits = decrementCredits(projectId, cost);
      setCredits(newCredits);

      const aiResponse: StoredMessage = {
        role: "assistant",
        content: aiResponseContent,
        createdAt: Date.now(),
      };
      const finalMessages = [...newMessages, aiResponse];
      setMessagesState(finalMessages);
      setMessages(projectId, finalMessages);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation aborted by user.');
        return;
      }
      const errorMessage = err?.message || "Ocurrió un error desconocido.";
      console.error("Error en la operación de IA:", err);
      const nowAsk = text.trim().startsWith("[ASK]");
      toast.error(nowAsk ? "La pregunta a la IA ha fallado" : "La generación con IA ha fallado", {
        description: errorMessage,
      });
      const aiResponse: StoredMessage = {
        role: "assistant",
        content: \`La operación de IA ha fallado:\\n\\n> \${errorMessage}\`,
        createdAt: Date.now(),
      };
      const finalMessages = [...newMessages, aiResponse];
      setMessagesState(finalMessages);
      setMessages(projectId, finalMessages);
    } finally {
      setLoading(false);
      if (!isAsk) setPreviewLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, projectId, selectedElement, code]);

  const handleRefreshPreview = () => {
    setPreviewLoading(true);
    setTimeout(() => setPreviewLoading(false), 1500);
  };

  const handleElementSelected = (description: string) => {
    setSelectedElement(description);
    setIsSelectionModeActive(false);
  };

  if (!projectId) {
    return <div>Cargando proyecto...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground animate-fade-in">
      <header className="h-14 border-b flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold truncate" title={projectName}>
            {projectName || "Cargando..."}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate(\`/publish/\${projectId}\`)}>
            <Github className="h-4 w-4 mr-2" />
            Publish
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Salir
          </Button>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            defaultSize={25}
            minSize={15}
            maxSize={30}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsLeftPanelCollapsed(true)}
            onExpand={() => setIsLeftPanelCollapsed(false)}
            className={cn("max-w-[400px]", isLeftPanelCollapsed ? "hidden" : "")}
          >
            <ChatPanel
              messages={messages}
              loading={loading}
              credits={credits}
              onSend={handleNewMessage}
              onCancel={handleCancelGeneration}
              selectedElement={selectedElement}
              onClearSelection={() => setSelectedElement(null)}
            />
          </ResizablePanel>
          <div
            aria-hidden="true"
            className="h-full w-px bg-border/40"
            role="separator"
          />
          <ResizablePanel defaultSize={75}>
            <PreviewPanel
              previewUrl="/preview"
              code={code}
              loading={previewLoading}
              onRefresh={handleRefreshPreview}
              isSelectionModeActive={isSelectionModeActive}
              onToggleSelectionMode={() => setIsSelectionModeActive(prev => !prev)}
              onElementSelected={handleElementSelected}
              projectName={projectName}
              supabaseIntent={supabaseIntentCounter}
              projectId={projectId}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
`,
  },
];
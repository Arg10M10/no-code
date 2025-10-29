// NOTE: This file is generated automatically to provide the source code viewer.
// Do not edit it manually.

type ProjectFile = {
  path: string;
  content: string;
};

export const projectFiles: ProjectFile[] = [
  // Archivos Raíz
  {
    path: "Raíz / package.json",
    content: `{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@supabase/supabase-js": "^2.76.1",
    "@tanstack/react-query": "^5.83.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "file-saver": "^2.0.5",
    "input-otp": "^1.4.2",
    "jszip": "^3.10.1",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.61.1",
    "react-resizable-panels": "^2.1.9",
    "react-router-dom": "^6.30.1",
    "recharts": "^2.15.4",
    "sonner": "^1.7.4",
    "styled-components": "^6.1.19",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.9",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@dyad-sh/react-vite-component-tagger": "^0.8.0",
    "@eslint/js": "^9.32.0",
    "@tailwindcss/typography": "^0.5.16",
    "@types/node": "^22.16.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react-swc": "^3.11.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.32.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^15.15.0",
    "lovable-tagger": "^1.1.11",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.38.0",
    "vite": "^5.4.19"
  }
}`,
  },
  {
    path: "Raíz / vite.config.ts",
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
}));`,
  },
  {
    path: "Raíz / tailwind.config.ts",
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
} satisfies Config;`,
  },
  {
    path: "Raíz / index.html",
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Brimy</title>
    <meta name="description" content="Build your next project with AI using your design and code context" />
    <meta name="author" content="Brimy" />

    <meta property="og:title" content="Brimy" />
    <meta property="og:description" content="Build your next project with AI using your design and code context" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@lovable_dev" />
    <meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  },
  // Carpeta public
  {
    path: "public / favicon.ico",
    content: `(Contenido del icono)`,
  },
  {
    path: "public / robots.txt",
    content: `User-agent: *
Allow: /`,
  },
  // Carpeta src
  {
    path: "src / main.tsx",
    content: `import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);`,
  },
  {
    path: "src / App.tsx",
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

export default App;`,
  },
  {
    path: "src / index.css",
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

/* ... (contenido de estilos) ... */`,
  },
  // src/components
  {
    path: "src/components / ChatPanel.tsx",
    content: `// ... (código del componente ChatPanel) ...`,
  },
  {
    path: "src/components / PreviewPanel.tsx",
    content: `// ... (código del componente PreviewPanel) ...`,
  },
  {
    path: "src/components / Hero.tsx",
    content: `// ... (código del componente Hero) ...`,
  },
  {
    path: "src/components / Navigation.tsx",
    content: `// ... (código del componente Navigation) ...`,
  },
  // src/components/supabase
  {
    path: "src/components/supabase / SupabaseConnectModal.tsx",
    content: `// ... (código del modal de conexión de Supabase) ...`,
  },
  // src/components/ui
  {
    path: "src/components/ui / button.tsx",
    content: `// ... (código del componente Button de shadcn/ui) ...`,
  },
  {
    path: "src/components/ui / card.tsx",
    content: `// ... (código del componente Card de shadcn/ui) ...`,
  },
  // src/hooks
  {
    path: "src/hooks / use-toast.ts",
    content: `// ... (código del hook useToast) ...`,
  },
  // src/integrations/supabase
  {
    path: "src/integrations/supabase / client.ts",
    content: `// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xkcnbvcjzezhjaoxojsv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY25idmNqemV6aGphb3hvanN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzA2NzQsImV4cCI6MjA3NzE0NjY3NH0.I6xsD0LHiOsuas5VaxU3killUr_aRDx3Xi57WvXeGlc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);`,
  },
  {
    path: "src/integrations/supabase / config.ts",
    content: `// ... (código de configuración de Supabase) ...`,
  },
  // src/lib
  {
    path: "src/lib / projects.ts",
    content: `// ... (código para manejar la lógica de proyectos) ...`,
  },
  {
    path: "src/lib / github.ts",
    content: `// ... (código para la integración con GitHub) ...`,
  },
  {
    path: "src/lib / utils.ts",
    content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
  },
  // src/pages
  {
    path: "src/pages / Editor.tsx",
    content: `// ... (código de la página del Editor) ...`,
  },
  {
    path: "src/pages / Index.tsx",
    content: `// ... (código de la página de Inicio) ...`,
  },
  {
    path: "src/pages / Pricing.tsx",
    content: `// ... (código de la página de Precios) ...`,
  },
  // src/services
  {
    path: "src/services / ai.ts",
    content: `// ... (código para interactuar con las APIs de IA) ...`,
  },
];
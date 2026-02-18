import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';
import electron from 'vite-plugin-electron/simple';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(), 
    react(), 
    mode === "development" && componentTagger(),
    // Configuración de Electron
    electron({
      main: {
        // Entry point del proceso principal
        entry: 'electron/main.ts',
      },
      preload: {
        // Entry point del preload script
        input: 'electron/preload.ts',
      },
      // Habilita el uso de APIs de Node en el renderer (Opcional, útil para desarrollo rápido)
      renderer: {},
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
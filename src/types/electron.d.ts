export {};

declare global {
  interface Window {
    electron: {
      runDyad: (projectPath: string, messages: any[]) => Promise<{ error?: string; message: string; screenshot?: string }>;
      rebuildProject: (projectPath: string) => Promise<void>;
      createProject: (name: string) => Promise<{ id: string; path: string; name: string } | null>;
    };
  }
}
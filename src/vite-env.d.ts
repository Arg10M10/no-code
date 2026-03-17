/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    runNpmCommand: (command: string, args?: string[]) => Promise<string>;
    onNpmOutput: (callback: (data: string) => void) => () => void;
    onNpmError: (callback: (data: string) => void) => () => void;
    getProjectPath: () => Promise<string>;
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    isMaximized: () => Promise<boolean>;
    onWindowStateChange: (callback: (isMax: boolean) => void) => () => void;
    // New APIs for project management
    saveProjectFiles: (projectId: string, files: Array<{ path: string; content: string }>) => Promise<boolean>;
    startProjectDevServer: (basePath: string, projectId: string) => Promise<string | null>;
    stopProjectDevServer: () => Promise<void>;
    getProjectDevServerUrl: () => Promise<string | null>;
    onProjectDevServerOutput: (callback: (data: string) => void) => () => void;
    onProjectDevServerError: (callback: (data: string) => void) => () => void;
    onProjectDevServerReady: (callback: (url: string) => void) => () => void;
    onProjectDevServerStopped: (callback: () => void) => () => void;
  };
}
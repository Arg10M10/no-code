import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  runNpmCommand: (command, args) => ipcRenderer.invoke('run-npm-command', command, args),
  onNpmOutput: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('npm-output', subscription);
    return () => ipcRenderer.removeListener('npm-output', subscription);
  },
  onNpmError: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('npm-error', subscription);
    return () => ipcRenderer.removeListener('npm-error', subscription);
  },
  getProjectPath: () => ipcRenderer.invoke('get-project-path'),
  
  // Window control APIs
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  onWindowStateChange: (callback) => {
    const subscription = (event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-state-changed', subscription);
    return () => ipcRenderer.removeListener('window-state-changed', subscription);
  },

  // New APIs for project management
  startProjectDevServer: (projectPath) => ipcRenderer.invoke('start-project-dev-server', projectPath),
  stopProjectDevServer: () => ipcRenderer.invoke('stop-project-dev-server'),
  getProjectDevServerUrl: () => ipcRenderer.invoke('get-project-dev-server-url'),
  onProjectDevServerOutput: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('project-dev-server-output', subscription);
    return () => ipcRenderer.removeListener('project-dev-server-output', subscription);
  },
  onProjectDevServerError: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('project-dev-server-error', subscription);
    return () => ipcRenderer.removeListener('project-dev-server-error', subscription);
  },
  onProjectDevServerReady: (callback) => {
    const subscription = (event, url) => callback(url);
    ipcRenderer.on('project-dev-server-ready', subscription);
    return () => ipcRenderer.removeListener('project-dev-server-ready', subscription);
  },
  onProjectDevServerStopped: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('project-dev-server-stopped', subscription);
    return () => ipcRenderer.removeListener('project-dev-server-stopped', subscription);
  },
});
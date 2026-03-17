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
  
  // New window control APIs
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  onWindowStateChange: (callback) => {
    const subscription = (event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-state-changed', subscription);
    return () => ipcRenderer.removeListener('window-state-changed', subscription);
  },
});
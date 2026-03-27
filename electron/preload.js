const { contextBridge, ipcRenderer } = require('electron');

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
  }
});
import { contextBridge, ipcRenderer } from 'electron';

// Exponer funciones seguras al proceso de renderizado (tu app React)
contextBridge.exposeInMainWorld('electronAPI', {
  // Ejemplo de cómo tu app React podría pedir al proceso principal que ejecute un comando
  runNpmCommand: (command, args) => ipcRenderer.invoke('run-npm-command', command, args),
  // Puedes añadir más funciones aquí para interactuar con el sistema operativo
  // Por ejemplo: guardar archivos, abrir diálogos, etc.
});
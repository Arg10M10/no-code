import { app, BrowserWindow, protocol, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process'; // Para ejecutar comandos de sistema

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Es importante mantenerlo en false por seguridad
      contextIsolation: true, // Es importante mantenerlo en true por seguridad
    },
  });

  if (isDev) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    // Cargar el index.html de tu aplicación React compilada
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- Manejo de IPC para comandos de sistema ---
ipcMain.handle('run-npm-command', async (event, command, args = []) => {
  return new Promise((resolve, reject) => {
    // Asegúrate de que el directorio de trabajo sea el de tu proyecto
    const projectPath = path.join(__dirname, '../'); // Asumiendo que el proyecto está en la raíz
    
    const child = spawn(command, args, { cwd: projectPath, shell: true });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      // Opcional: enviar actualizaciones en tiempo real al Renderer
      event.sender.send('npm-output', data.toString());
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      event.sender.send('npm-error', data.toString());
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}:\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
});
import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
const VITE_DEV_SERVER_URL = 'http://127.0.0.1:5173';

// --- Project Dev Server Management ---
let currentDevServerProcess: ChildProcessWithoutNullStreams | null = null;
let currentDevServerUrl: string | null = null;
let currentProjectRootPath: string | null = null;

async function loadApp(win, urlOrPath, retries = 10) {
  try {
    if (urlOrPath.startsWith('http')) {
      await win.loadURL(urlOrPath);
    } else {
      await win.loadFile(urlOrPath);
    }
  } catch (error) {
    console.error(`Failed to load: ${urlOrPath}. Error: ${error.message}`);
    if (retries > 0 && urlOrPath.startsWith('http')) {
      console.log(`Retrying to load in 1 second... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadApp(win, urlOrPath, retries - 1);
    } else {
      console.error(`Exceeded retries for ${urlOrPath}. App might not be running.`);
      win.webContents.send('app-load-error', `Failed to load application: ${error.message}`);
    }
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: true, // Usar la barra de título nativa
    transparent: false, // No es necesario si frame es true
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Elimina el menú de la aplicación
  Menu.setApplicationMenu(null);

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load: ${validatedURL}, Code: ${errorCode}, Description: ${errorDescription}`);
    if (isDev && validatedURL === VITE_DEV_SERVER_URL) {
      win.webContents.send('app-load-error', `Failed to load development server: ${errorDescription}`);
    } else if (!isDev && validatedURL.includes('index.html')) {
      win.webContents.send('app-load-error', `Failed to load production build: ${errorDescription}`);
    }
  });

  // Notificar al renderizador cuando el estado de maximizado cambia
  win.on('maximize', () => win.webContents.send('window-state-changed', true));
  win.on('unmaximize', () => win.webContents.send('window-state-changed', false));

  if (isDev) {
    loadApp(win, VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    loadApp(win, path.join(__dirname, '../dist/index.html'));
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
  // Asegurarse de que el proceso del servidor de desarrollo se detenga al cerrar la aplicación
  if (currentDevServerProcess) {
    currentDevServerProcess.kill('SIGTERM'); // O 'SIGKILL' si es necesario
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC Handlers ---
ipcMain.handle('run-npm-command', async (event, command, args = []) => {
  return new Promise((resolve, reject) => {
    const projectPath = currentProjectRootPath || app.getAppPath(); // Usar la ruta del proyecto actual si está definida
    
    // Permitir solo comandos npm y npx
    if (command !== 'npm' && command !== 'npx') {
      return reject(new Error('Only "npm" or "npx" commands are allowed.'));
    }

    const child = spawn(command, args, { cwd: projectPath, shell: true });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
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

ipcMain.handle('get-project-path', () => {
  return app.getAppPath();
});

ipcMain.handle('minimize-window', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.handle('maximize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.handle('close-window', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

ipcMain.handle('is-maximized', (event) => {
  return BrowserWindow.fromWebContents(event.sender)?.isMaximized() || false;
});

// --- New IPC Handlers for Project Dev Server ---
ipcMain.handle('start-project-dev-server', async (event, basePath: string, projectId: string) => {
  if (currentDevServerProcess) {
    currentDevServerProcess.kill('SIGTERM');
    currentDevServerProcess = null;
    currentDevServerUrl = null;
    event.sender.send('project-dev-server-stopped');
  }

  currentProjectRootPath = path.join(basePath, 'projects', projectId);
  currentDevServerProcess = spawn('npm', ['run', 'dev'], { cwd: currentProjectRootPath, shell: true });
  let outputBuffer = '';
  let urlFound = false;

  currentDevServerProcess.stdout.on('data', (data) => {
    const output = data.toString();
    event.sender.send('project-dev-server-output', output);
    outputBuffer += output;

    if (!urlFound) {
      const match = output.match(/http:\/\/(localhost|127\.0\.0\.1):\d+/);
      if (match) {
        currentDevServerUrl = match[0];
        event.sender.send('project-dev-server-ready', currentDevServerUrl);
        urlFound = true;
      }
    }
  });

  currentDevServerProcess.stderr.on('data', (data) => {
    event.sender.send('project-dev-server-error', data.toString());
  });

  currentDevServerProcess.on('close', (code) => {
    console.log(`Dev server process exited with code ${code}`);
    currentDevServerProcess = null;
    currentDevServerUrl = null;
    event.sender.send('project-dev-server-stopped');
  });

  currentDevServerProcess.on('error', (err) => {
    console.error('Failed to start dev server process:', err);
    event.sender.send('project-dev-server-error', `Failed to start dev server: ${err.message}`);
    currentDevServerProcess = null;
    currentDevServerUrl = null;
    event.sender.send('project-dev-server-stopped');
  });

  // Return the URL if found immediately, otherwise null (will be sent via event)
  return currentDevServerUrl;
});

ipcMain.handle('stop-project-dev-server', async (event) => {
  if (currentDevServerProcess) {
    currentDevServerProcess.kill('SIGTERM'); // Terminar el proceso
    currentDevServerProcess = null;
    currentDevServerUrl = null;
    event.sender.send('project-dev-server-stopped');
  }
});

ipcMain.handle('get-project-dev-server-url', () => {
  return currentDevServerUrl;
});
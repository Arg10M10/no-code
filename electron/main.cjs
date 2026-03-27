const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;
let npmProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: true,
    webPreferences: {
      // Apuntamos al nuevo nombre del archivo .cjs
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0a0a0a',
  });

  const url = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('run-npm-command', async (event, command, args) => {
  return new Promise((resolve, reject) => {
    if (npmProcess) {
      npmProcess.kill();
    }

    npmProcess = spawn(command, args, {
      shell: true,
      env: { ...process.env, FORCE_COLOR: true }
    });

    npmProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('npm-output', data.toString());
    });

    npmProcess.stderr.on('data', (data) => {
      mainWindow.webContents.send('npm-error', data.toString());
    });

    npmProcess.on('close', (code) => {
      npmProcess = null;
      resolve({ code });
    });
  });
});
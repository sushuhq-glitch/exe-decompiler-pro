const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    title: 'EXE Decompiler Pro'
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('build/index.html');
  }
}

// Handle file opening
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Executables', extensions: ['exe'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const buffer = fs.readFileSync(filePath);
    return {
      path: filePath,
      data: Array.from(buffer),
      name: path.basename(filePath)
    };
  }
  return null;
});

// Handle export
ipcMain.handle('save-file-dialog', async (event, content, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'decompiled.c',
    filters: [
      { name: 'C Source', extensions: ['c'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    fs.writeFileSync(result.filePath, content);
    return true;
  }
  return false;
});

// Get Desktop path
ipcMain.handle('get-desktop-path', async () => {
  const desktopPath = path.join(app.getPath('home'), 'Desktop');
  return desktopPath;
});

// Save to Desktop
ipcMain.handle('save-to-desktop', async (event, content, filename) => {
  try {
    const desktopPath = path.join(app.getPath('home'), 'Desktop');
    const filePath = path.join(desktopPath, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  } catch (error) {
    throw new Error(`Failed to save to desktop: ${error.message}`);
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
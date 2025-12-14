const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

// Get desktop path
ipcMain.handle('get-desktop-path', async () => {
  return path.join(os.homedir(), 'Desktop');
});

// Create project on desktop
ipcMain.handle('create-project', async (event, projectPath, structure) => {
  try {
    // Create main folder
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Create subfolders
    if (structure.folders) {
      for (const folder of structure.folders) {
        const folderPath = path.join(projectPath, folder);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      }
    }

    // Create files
    if (structure.files) {
      for (const file of structure.files) {
        const filePath = path.join(projectPath, file.path);
        fs.writeFileSync(filePath, file.content, 'utf8');
      }
    }

    return projectPath;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
});

// Open desktop folder
ipcMain.handle('open-desktop-folder', async () => {
  const desktopPath = path.join(os.homedir(), 'Desktop');
  shell.openPath(desktopPath);
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
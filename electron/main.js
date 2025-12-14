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

// Handle save to desktop
ipcMain.handle('save-to-desktop', async (event, projectName, files) => {
  try {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const projectPath = path.join(desktopPath, projectName);
    
    // Create project directory
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    
    // Write all files
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(projectPath, filePath);
      const dir = path.dirname(fullPath);
      
      // Create subdirectories if needed
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
    
    return { success: true, path: projectPath };
  } catch (error) {
    console.error('Error saving to desktop:', error);
    return { success: false, error: error.message };
  }
});

// Handle open folder
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath);
    return true;
  } catch (error) {
    console.error('Error opening folder:', error);
    return false;
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
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    backgroundColor: '#191919',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    title: 'Ultimate Go Decompiler - IDA Pro Style'
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
ipcMain.handle('save-to-desktop', async (event, data) => {
  try {
    // Get desktop path
    const desktopPath = path.join(os.homedir(), 'Desktop');
    
    // Create output folder
    const folderName = data.folderName || 'Decompiled_Output';
    const outputPath = path.join(desktopPath, folderName);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    // Save all files
    const savedFiles = [];
    
    for (const [filename, content] of Object.entries(data.files || {})) {
      const filePath = path.join(outputPath, filename);
      fs.writeFileSync(filePath, content, 'utf8');
      savedFiles.push(filePath);
    }
    
    return {
      success: true,
      path: outputPath,
      files: savedFiles
    };
    
  } catch (error) {
    console.error('Error saving to desktop:', error);
    return {
      success: false,
      error: error.message
    };
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
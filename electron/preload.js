const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    openFile: () => ipcRenderer.invoke('open-file-dialog'),
    saveFile: (content, defaultName) => ipcRenderer.invoke('save-file-dialog', content, defaultName),
    saveToDesktop: (projectName, files) => ipcRenderer.invoke('save-to-desktop', projectName, files),
    openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath)
  }
);

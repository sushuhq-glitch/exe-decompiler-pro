const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    openFile: () => ipcRenderer.invoke('open-file-dialog'),
    saveFile: (content, defaultName) => ipcRenderer.invoke('save-file-dialog', content, defaultName),
    getDesktopPath: () => ipcRenderer.invoke('get-desktop-path'),
    createProject: (projectPath, structure) => ipcRenderer.invoke('create-project', projectPath, structure),
    openDesktopFolder: () => ipcRenderer.invoke('open-desktop-folder')
  }
);

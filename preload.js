const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    selectFile: () => ipcRenderer.invoke('select-file'),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    saveFile: (data) => ipcRenderer.invoke('save-file', data),
    saveMultipleFiles: (files) => ipcRenderer.invoke('save-multiple-files', files)
});

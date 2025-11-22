const { contextBridge, ipcRenderer } = require('electron');

// Предоставляем безопасный API для renderer процесса
contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  platform: process.platform,
  isElectron: true
});

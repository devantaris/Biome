// ============================================
// Focus Forest — Widget Preload
// ============================================
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('widgetAPI', {
  openMainWindow: () => ipcRenderer.invoke('widget:open-main'),
  hideWidget: () => ipcRenderer.invoke('widget:hide-self'),
  onTimerUpdate: (callback) => {
    ipcRenderer.on('timer:update', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('timer:update');
  },
});

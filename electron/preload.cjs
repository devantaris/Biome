// ============================================
// Focus Forest — Electron Preload v3
// Exposes window controls, widget, timer sync
// ============================================
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── Window controls ──────────────────────
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  // ─── App features ─────────────────────────
  setAlwaysOnTop: (value) => ipcRenderer.invoke('app:set-always-on-top', value),
  showNotification: (title, body) => ipcRenderer.invoke('app:show-notification', { title, body }),
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  isElectron: () => ipcRenderer.invoke('app:is-electron'),

  // ─── Widget ───────────────────────────────
  setWidgetVisible: (visible) => ipcRenderer.invoke('widget:set-visible', visible),
  setWidgetPreference: (show) => ipcRenderer.invoke('widget:set-preference', show),

  // Send timer state to widget (called from React timer hook)
  sendTimerState: (data) => ipcRenderer.send('timer:state-update', data),

  // ─── Event listeners from main process ────
  onToggleFocus: (callback) => {
    ipcRenderer.on('toggle-focus', callback);
    return () => ipcRenderer.removeListener('toggle-focus', callback);
  },
  onQuickFocus: (callback) => {
    ipcRenderer.on('start-quick-focus', (_event, minutes) => callback(minutes));
    return () => ipcRenderer.removeListener('start-quick-focus', callback);
  },
  onMaximizedChange: (callback) => {
    ipcRenderer.on('window:maximized', (_event, isMaximized) => callback(isMaximized));
    return () => ipcRenderer.removeListener('window:maximized', callback);
  },
});

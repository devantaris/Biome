/// <reference types="vite/client" />

// ─── Electron window bridge types ──────────────────────────────────────
interface ElectronAPI {
  // Window controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;

  // App features
  setAlwaysOnTop: (value: boolean) => void;
  showNotification: (title: string, body: string) => void;
  getVersion: () => Promise<string>;
  isElectron: () => boolean;

  // Floating widget
  setWidgetVisible: (visible: boolean) => Promise<void>;
  setWidgetPreference: (show: boolean) => Promise<void>;
  sendTimerState: (data: {
    timeLeft: number;
    phase: string;
    progress: number;
    itemIcon: string;
  }) => void;

  // Event listeners
  onToggleFocus: (callback: () => void) => () => void;
  onQuickFocus: (callback: (minutes: number) => void) => () => void;
  onMaximizedChange: (callback: (isMax: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

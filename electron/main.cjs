// ============================================
// Biome — Electron Main Process v3
// Widget window, tray, app icon, logout IPC
// ============================================
const {
  app, BrowserWindow, Tray, Menu,
  globalShortcut, ipcMain, Notification,
  nativeImage, screen
} = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let widgetWindow = null;
let tray = null;
let localServerPort = null;
const isDev = !app.isPackaged;

// ─── App Icon ─────────────────────────────────
function getAppIcon() {
  const iconName = process.platform === 'win32' ? 'icon.ico'
    : process.platform === 'darwin' ? 'icon.icns'
    : 'icon.png';
  const iconPath = path.join(__dirname, '../assets', iconName);
  try {
    return nativeImage.createFromPath(iconPath);
  } catch {
    return nativeImage.createEmpty();
  }
}

// ─── Main Window ──────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#040c07',
    icon: getAppIcon(),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Serve dist/ via localhost so Firebase Auth works (file:// is not an authorized domain)
    mainWindow.loadURL(`http://localhost:${localServerPort}`);
  }

  // On close/minimize: show widget if setting is enabled
  mainWindow.on('minimize', () => {
    const settings = getStoredSettings();
    if (settings.showWidget) {
      showWidget();
    }
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      const settings = getStoredSettings();
      if (settings.showWidget) {
        showWidget();
      }
    }
  });

  mainWindow.on('restore', () => {
    hideWidget();
  });

  mainWindow.on('show', () => {
    hideWidget();
  });

  // Track maximize state
  mainWindow.on('maximize', () => mainWindow.webContents.send('window:maximized', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:maximized', false));
}

// ─── Widget Window ────────────────────────────
function createWidgetWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  widgetWindow = new BrowserWindow({
    width: 210,
    height: 130,
    x: screenW - 225,
    y: screenH - 145,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'widget-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const widgetPath = path.join(__dirname, 'widget.html');
  widgetWindow.loadFile(widgetPath);
}

function showWidget() {
  if (!widgetWindow) createWidgetWindow();
  widgetWindow.show();
}

function hideWidget() {
  widgetWindow?.hide();
}

function showWindow() {
  if (mainWindow) {
    mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
}

// ─── Simple settings cache for widget preference ─
// (The React app sends this via IPC)
let cachedSettings = { showWidget: true };
function getStoredSettings() { return cachedSettings; }

// ─── System Tray ──────────────────────────────
function createTray() {
  const icon = getAppIcon();
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: '🌿 Biome', enabled: false },
    { type: 'separator' },
    {
      label: '⏱️ Quick Focus (25m)',
      click: () => { showWindow(); mainWindow.webContents.send('start-quick-focus', 25); },
    },
    {
      label: '🔥 Power Focus (45m)',
      click: () => { showWindow(); mainWindow.webContents.send('start-quick-focus', 45); },
    },
    { type: 'separator' },
    { label: 'Show App', click: showWindow },
    {
      label: 'Quit',
      click: () => { app.isQuitting = true; app.quit(); },
    },
  ]);

  tray.setToolTip('Biome');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', showWindow);
}

// ─── Local static file server (production only) ──
function startLocalServer() {
  return new Promise((resolve) => {
    const distPath = path.join(__dirname, '../dist');
    const mimeTypes = {
      '.html': 'text/html',
      '.js':   'application/javascript',
      '.css':  'text/css',
      '.svg':  'image/svg+xml',
      '.png':  'image/png',
      '.ico':  'image/x-icon',
      '.json': 'application/json',
      '.woff2':'font/woff2',
      '.woff': 'font/woff',
      '.ttf':  'font/ttf',
    };
    const server = http.createServer((req, res) => {
      let filePath = path.join(distPath, req.url.split('?')[0]);
      // SPA fallback — serve index.html for any unknown route
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, 'index.html');
      }
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

// ─── App Lifecycle ────────────────────────────
app.whenReady().then(async () => {
  if (!isDev) {
    localServerPort = await startLocalServer();
  }
  createWindow();
  createTray();

  globalShortcut.register('Control+Shift+F', () => {
    showWindow();
    mainWindow.webContents.send('toggle-focus');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ─── IPC: Window controls ─────────────────────
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});
ipcMain.handle('window:maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
});
ipcMain.handle('window:close', () => mainWindow?.hide());
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false);

// ─── IPC: App features ────────────────────────
ipcMain.handle('app:set-always-on-top', (_e, value) => mainWindow?.setAlwaysOnTop(value));

ipcMain.handle('app:show-notification', (_e, { title, body }) => {
  if (Notification.isSupported()) {
    const n = new Notification({ title, body, silent: false });
    n.show();
    n.on('click', showWindow);
  }
});

ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('app:is-electron', () => true);

// ─── IPC: Widget ─────────────────────────────
ipcMain.handle('widget:set-visible', (_e, visible) => {
  visible ? showWidget() : hideWidget();
});

ipcMain.handle('widget:set-preference', (_e, showWidget) => {
  cachedSettings.showWidget = showWidget;
});

// Forward timer state to widget
ipcMain.on('timer:state-update', (_e, data) => {
  widgetWindow?.webContents.send('timer:update', data);
});

// Widget → open main window
ipcMain.handle('widget:open-main', () => showWindow());
ipcMain.handle('widget:hide-self', () => hideWidget());

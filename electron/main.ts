import electron from 'electron'
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, screen } = electron
import path from 'node:path'
import { initDB, createMeeting, addTranscript, getMeetings, getMeetingDetails } from './db'

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: any | null
let tray: any | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Set CSP to allow workers, downloads, and external APIs (like Google Speech API)
  win.webContents.session.webRequest.onHeadersReceived((details: any, callback: any) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; worker-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; connect-src * https://www.google.com https://*.google.com wss:; media-src 'self' blob: https:;"
        ]
      }
    })
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Handle permission requests - Allow media capture for transcription
  win.webContents.session.setPermissionCheckHandler((_webContents: any, permission: string, _requestingOrigin: any, _details: any) => {
    if (permission === 'media' || permission === 'microphone' || permission === 'audio-capture') {
      return true;
    }
    return false;
  });

  win.webContents.session.setPermissionRequestHandler((_webContents: any, permission: string, callback: any) => {
    const allowedPermissions = ['media', 'microphone', 'audio-capture', 'audioCapture', 'mediaDevices'];
    if (allowedPermissions.includes(permission) || permission.includes('audio')) {
      console.log('✅ Granting permission:', permission);
      callback(true);
    } else {
      console.log('❌ Denying permission:', permission);
      callback(false);
    }
  });
}

function createTray() {
  const iconPath = path.join(process.env.VITE_PUBLIC, 'vite.svg');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => win?.show() },
    { type: 'separator' },
    { label: 'Start Recording', click: () => win?.webContents.send('trigger-record') },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Noctum AI Assistant');
  tray.setContextMenu(contextMenu);
}

// Initialize Database
initDB();

// IPC Handlers
ipcMain.handle('get-meetings', () => getMeetings());
ipcMain.handle('create-meeting', (_: any, title: any) => createMeeting(title));
ipcMain.handle('add-transcript', (_: any, { meetingId, speaker, text, timestamp }: any) => addTranscript(meetingId, speaker, text, timestamp));
ipcMain.handle('get-meeting-details', (_: any, id: any) => getMeetingDetails(id));

// Overlay Mode Handler
ipcMain.handle('toggle-overlay', (_: any, isOverlay: any) => {
  if (!win) return;
  
  if (isOverlay) {
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    win.setSize(400, 500);
    win.setPosition(width - 420, 50); // Top-right corner
    win.setAlwaysOnTop(true, 'floating');
    win.setVisibleOnAllWorkspaces(true);
  } else {
    win.setSize(1200, 800);
    win.center();
    win.setAlwaysOnTop(false);
    win.setVisibleOnAllWorkspaces(false);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Register Global Shortcut
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    win?.webContents.send('trigger-record');
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

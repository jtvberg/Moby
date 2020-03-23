// Modules and variable definition
const { app } = require('electron')
const { BrowserWindow, Tray, ipcMain } = require('electron')
const path = require('path')
// Enable Electron-Reload (dev only)
require('electron-reload')(__dirname)

// Create main app window
let win
const createWindow = () => {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 320,
    minHeight: 425,
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // open DevTools remove for dist
  // win.webContents.openDevTools()

  // HTML to open
  win.loadURL(`file://${__dirname}/renderer/main.html`)

  win.on('closed', () => {
    win = null
  })
}

// Create tray icon and calculate positions
let tray
const createTray = () => {
  tray = new Tray(path.join(__dirname, 'renderer/res/moby_icon_19.png'))
  tray.on('click', function (e) {
    toggleQuickMenu()
  })

  const toggleQuickMenu = () => {
    quick.isVisible() ? quick.hide() : showQuickMenu()
  }

  const showQuickMenu = () => {
    const position = getWindowPosition()
    quick.setPosition(position.x, position.y, false)
    quick.show()
  }

  const getWindowPosition = () => {
    const windowBounds = quick.getBounds()
    const trayBounds = tray.getBounds()
    // Center window horizontally below the tray icon
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
    // Position window 4 pixels vertically below the tray icon
    const y = Math.round(trayBounds.y + trayBounds.height + 4)
    return { x: x, y: y }
  }
}

// Create window attached to tray icon press
let quick
const createQuickMenu = () => {
  quick = new BrowserWindow({
    width: 360,
    height: 183,
    show: false,
    frame: false,
    hasShadow: false,
    fullscreenable: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  // open DevTools remove for dist
  // quick.openDevTools()
  // HTML to open
  quick.loadURL(`file://${__dirname}/renderer/quick.html`)
  // Hide the window when it loses focus
  quick.on('blur', () => {
    if (!quick.webContents.isDevToolsOpened()) {
      quick.hide()
    }
  })
  // IPC event/channel to communicate showing of window (used to reset fields)
  quick.on('show', () => {
    quick.webContents.send('quick-reset')
  })
}

// Create windows, tray, post electron init
app.on('ready', () => {
  createWindow()
  // Tray icon only on Mac
  if (process.platform === 'darwin') {
    createTray()
    createQuickMenu()
  }
  win.webContents.on('dom-ready', () => {
    // IPC event to send system desktop path
    win.webContents.send('desktop-path', app.getPath('desktop'))
  })
})

// Close app on window close (does not work with tray icon)
app.on('window-all-closed', () => {
  app.quit()
})

// Create window if non exists on activation
app.on('activate', () => {
  if (win === null) createWindow()
})

// IPC channel to pass task data from tray to app
ipcMain.on('quick-task', (e, data) => {
  win.webContents.send('quick-data', data)
})

// IPC channel to pass theme to quick task
ipcMain.on('theme-change', (e, data) => {
  quick.webContents.send('quick-theme', data)
})

// IPC channel to maximize window
ipcMain.on('win-max', () => {
  win.maximize()
})

// IPC channel to restore window
ipcMain.on('win-restore', () => {
  win.unmaximize()
})

// IPC channel to minimize window
ipcMain.on('win-min', () => {
  win.minimize()
})

// IPC channel to update tags on task delete
ipcMain.on('delete-task', () => {
  win.webContents.send('update-tags')
})

// Modules and variable definition
const { app, BrowserWindow, Tray, ipcMain } = require('electron')
const path = require('path')
const updater = require('./updater')

// Enable Electron-Reload (dev only)
// require('electron-reload')(__dirname)

// Create main app window
let win
const createWindow = () => {
  // Check for updates
  setTimeout(updater, 3000)

  // Create main window
  win = new BrowserWindow({
    show: false,
    width: 1200,
    height: 800,
    minWidth: 500,
    minHeight: 470,
    titleBarStyle: 'hidden',
    frame: false,
    trafficLightPosition: {
      x: 7,
      y: 7
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  // Open DevTools (dev only)
  // win.webContents.openDevTools()

  // HTML to open
  win.loadURL(`file://${__dirname}/renderer/main.html`)

  win.once('ready-to-show', () => {
    win.show()
  })

  win.on('closed', () => {
    win = null
  })
}

// Create tray icon and calculate positions
let tray
const createTray = () => {
  // Create tray icon
  tray = new Tray(path.join(__dirname, 'renderer/res/iconTemplate@2x.png'))
  tray.on('click', function () {
    toggleQuickMenu()
  })

  // Toggle quick menu on click of tray icon
  const toggleQuickMenu = () => {
    quick.isVisible() ? quick.hide() : showQuickMenu()
  }

  // Show the quick task menu
  const showQuickMenu = () => {
    const position = getWindowPosition()
    quick.setPosition(position.x, position.y, false)
    quick.show()
  }

  // Get position of tray icon
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
  // Create quick task tray menu
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
  createQuickMenu()
  createTray()

  // Tray icon only on Mac
  if (process.platform !== 'darwin') {
    tray.destroy()
  }

  // Do stuff when DOM ready
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

// IPC channel to toggle glyphs in quick task
ipcMain.on('glyph-toggle', (e, data) => {
  quick.webContents.send('quick-glyph', data)
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

// IPC channel to set unread badge
ipcMain.on('badge-count', (e, data) => {
  app.setBadgeCount(data)
  // TODO: depricated function use badgeCount
})

// IPC channel to update tags on task delete
ipcMain.on('delete-task', () => {
  win.webContents.send('update-tags')
})

// IPC channel for getting GitHub Issues
ipcMain.on('get-issues', (e, data) => {
  win.webContents.send('send-issues', data)
})

// IPC channel for getting SN Groups
ipcMain.on('get-groups', () => {
  win.webContents.send('send-groups')
})

// IPC channel for getting SN Incidents
ipcMain.on('get-incidents', (e, data) => {
  win.webContents.send('send-incidents', data)
})

// IPC channel for getting Rally Projects
ipcMain.on('get-projects', () => {
  win.webContents.send('send-projects')
})

// IPC channel for getting Rally Items
ipcMain.on('get-items', () => {
  win.webContents.send('send-items')
})

// IPC channel for Rally Errors
ipcMain.on('send-error-rally', () => {
  win.webContents.send('error-rally')
})

// IPC channel for GitHub Errors
ipcMain.on('send-error-gh', () => {
  win.webContents.send('error-gh')
})

// IPC channel for ServiceNow Errors
ipcMain.on('send-error-sn', () => {
  win.webContents.send('error-sn')
})

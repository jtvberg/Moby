const { app } = require('electron')
const { BrowserWindow, Tray, ipcMain } = require('electron')
const path = require('path')

// Enable Electron-Reload (dev only)
require('electron-reload')(__dirname)

let win
const createWindow = () => {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 320,
    minHeight: 220,
    titleBarStyle: 'hidden',
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

  win.on('enter-full-screen', () => {
    win.webContents.send('efs')
  })

  win.on('leave-full-screen', () => {
    win.webContents.send('lfs')
  })
}

let tray
const createTray = () => {
  tray = new Tray(path.join(__dirname, 'renderer/res/moby1_icon_19.png'))
  tray.on('click', function (e) {
    toggleQuickMenu()
  })

  const toggleQuickMenu = () => {
    quickMenu.isVisible() ? quickMenu.hide() : showQuickMenu()
  }

  const showQuickMenu = () => {
    const position = getWindowPosition()
    quickMenu.setPosition(position.x, position.y, false)
    quickMenu.show()
  }

  const getWindowPosition = () => {
    const windowBounds = quickMenu.getBounds()
    const trayBounds = tray.getBounds()
    // Center window horizontally below the tray icon
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
    // Position window 4 pixels vertically below the tray icon
    const y = Math.round(trayBounds.y + trayBounds.height + 4)
    return { x: x, y: y }
  }
}

let quickMenu
const createQuickMenu = () => {
  quickMenu = new BrowserWindow({
    width: 360,
    height: 'auto',
    maxHeight: 400,
    show: false,
    frame: false,
    hasShadow: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true
    }
  })
  // open DevTools remove for dist
  // quickMenu.openDevTools()
  // HTML to open
  quickMenu.loadURL(`file://${__dirname}/renderer/quickMenu.html`)
  // Hide the window when it loses focus
  quickMenu.on('blur', () => {
    if (!quickMenu.webContents.isDevToolsOpened()) {
      quickMenu.hide()
    }
  })

  quickMenu.on('show', () => {
    quickMenu.webContents.send('quick-reset')
  })
}

// Create windows, tray, post electron init
app.on('ready', () => {
  createWindow()
  createTray()
  createQuickMenu()
  win.webContents.on('dom-ready', () => {
    win.webContents.send('desktopPath', app.getPath('desktop'))
  })
  // win.setFullScreen(true)
})

// Close app on window close
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin')
  app.quit()
})

// Create window if non exists on activation
app.on('activate', () => {
  if (win === null) createWindow()
})

ipcMain.on('quick-task', (e, data) => {
  win.webContents.send('quick-data', data)
})

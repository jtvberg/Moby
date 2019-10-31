const { app } = require('electron')
const mainWindow = require('./mainWindow')
const quickWindow = require('./quickMenuWindow')

// Enable Electron-Reload (dev only)
require('electron-reload')(__dirname)

// Create main window post electron init
app.on('ready', () => {
  mainWindow.createWindow()
  mainWindow.win.webContents.on('dom-ready', () => {
    mainWindow.win.webContents.send('desktopPath', app.getPath('desktop'))
  })
  // mainWindow.win.setFullScreen(true)
  quickWindow.createTray()
  quickWindow.createQuickMenu()
})

// Close app on window close
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin')
  app.quit()
})

// Create window if none on activate (mac behavior)
app.on('activate', () => {
  if (mainWindow === null) mainWindow.createWindow()
})

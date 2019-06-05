const {app, ipcMain} = require('electron')
const mainWindow = require('./mainWindow')

// Enable Electron-Reload (dev only)
require('electron-reload')(__dirname)

// Create main window post electron init
app.on('ready', () => {
  mainWindow.createWindow()
})

// Close app on window close
app.on('window-all-closed', () => {
  //if (process.platform !== 'darwin') 
  app.quit()
})

// Create window if none on activate (mac behavior)
app.on('activate', () => {
  if (mainWindow === null) mainWindow.createWindow()
})

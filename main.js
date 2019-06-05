const {app, ipcMain} = require('electron')
const mainWindow = require('./mainWindow')

// Enable Electron-Reload (dev only)
require('electron-reload')(__dirname)

app.on('ready', mainWindow.createWindow)

app.on('window-all-closed', () => {
  //if (process.platform !== 'darwin') 
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) mainWindow.createWindow()
})

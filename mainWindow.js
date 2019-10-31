const { BrowserWindow } = require('electron')

exports.createWindow = () => {
  this.win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 320,
    minHeight: 220,
    // frame: false,
    // titleBarStyle: 'customButtonsOnHover',
    // titleBarStyle: 'hiddenInset',
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true
    }
  })
  // open DevTools remove for dist
  this.win.webContents.openDevTools()
  // HTML to open
  this.win.loadURL(`file://${__dirname}/renderer/main.html`)

  this.win.on('closed', () => {
    this.win = null
  })

  this.win.on('enter-full-screen', () => {
    this.win.webContents.send('efs')
  })

  this.win.on('leave-full-screen', () => {
    this.win.webContents.send('lfs')
  })
}

const {BrowserWindow} = require('electron')

exports.win

exports.createWindow = () => {

  this.win = new BrowserWindow({
    width: 1200,
    height: 800,
    //frame: false,
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
}
const { BrowserWindow, Tray } = require('electron')
const path = require('path')

exports.createTray = () => {
  this.tray = new Tray(path.join(__dirname, 'renderer/res/moby1_icon_19.png'))
  this.tray.on('click', function (e) {
    toggleQuickMenu()
  })
}

const toggleQuickMenu = () => {
  this.quickMenu.isVisible() ? this.quickMenu.hide() : showQuickMenu()
}

const showQuickMenu = () => {
  const position = getWindowPosition()
  this.quickMenu.setPosition(position.x, position.y, false)
  this.quickMenu.show()
}

const getWindowPosition = () => {
  const windowBounds = this.quickMenu.getBounds()
  const trayBounds = this.tray.getBounds()
  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4)
  return { x: x, y: y }
}

exports.createQuickMenu = () => {
  // open DevTools remove for dist
  this.quickMenu = new BrowserWindow({
    width: 360,
    height: 360,
    show: false,
    frame: false,
    hasShadow: false,
    fullscreenable: false,
    resizable: false,
    transparent: true
  })
  this.quickMenu.loadURL(`file://${__dirname}/renderer/quickMenu.html`)
  // Hide the window when it loses focus
  this.quickMenu.on('blur', () => {
    if (!this.quickMenu.webContents.isDevToolsOpened()) {
      this.quickMenu.hide()
    }
  })
  this.quickMenu.webContents.openDevTools()
}

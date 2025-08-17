// Modules and variable definition
const { app, BrowserWindow, Tray, ipcMain, Menu, shell } = require('electron')
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
      enableRemoteModule: false,
      webSecurity: false
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

// Create application menu
const createMenu = () => {
  const template = [
    {
      label: 'Tasks',
      submenu: [
        {
          label: 'New Task',
          accelerator: 'CmdOrCtrl+N',
          click () { 
            console.log('New Task menu clicked!')
            win.webContents.send('execute-menu-command', 'new-task') 
          }
        },
        {
          label: 'Edit Task',
          accelerator: 'CmdOrCtrl+Enter',
          click () { win.webContents.send('execute-menu-command', 'edit-task') }
        },
        {
          label: 'Clone Task',
          accelerator: 'CmdOrCtrl+L',
          click () { win.webContents.send('execute-menu-command', 'clone-task') }
        },
        {
          label: 'Delete Task',
          accelerator: 'CmdOrCtrl+Backspace',
          click () { win.webContents.send('execute-menu-command', 'archive-task') }
        },
        {
          label: 'Restore Task',
          accelerator: 'CmdOrCtrl+R',
          click () { win.webContents.send('execute-menu-command', 'restore-task') }
        },
        {
          type: 'separator'
        },
        {
          label: 'Expand All Tasks',
          accelerator: 'CmdOrCtrl+Down',
          click () { win.webContents.send('execute-menu-command', 'expand-all') }
        },
        {
          label: 'Collapse All Tasks',
          accelerator: 'CmdOrCtrl+Up',
          click () { win.webContents.send('execute-menu-command', 'collapse-all') }
        },
        {
          label: 'Mark All Tasks Read',
          accelerator: 'CmdOrCtrl+Shift+R',
          click () { win.webContents.send('execute-menu-command', 'mark-all-read') }
        },
        {
          label: 'Toggle Task Age',
          type: 'checkbox',
          id: 'menu-task-age',
          accelerator: 'CmdOrCtrl+G',
          click () { win.webContents.send('execute-menu-command', 'toggle-age') }
        }
      ]
    },
    {
      role: 'editMenu'
    },
    {
      role: 'windowMenu'
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { shell.openExternal('https://github.com/jtvberg/Moby') }
        },
        {
          label: 'Toggle Dev Tools',
          role: 'toggleDevTools'
        }
      ]
    }
  ]

  // Mac specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          role: 'about'
        },
        {
          label: 'Preferences',
          submenu: [
            {
              label: 'Settings',
              click () { win.webContents.send('execute-menu-command', 'settings') }
            },
            {
              label: 'Theme',
              id: 'theme',
              submenu: [
                {
                  label: 'Default',
                  id: 'default',
                  type: 'checkbox',
                  click () { win.webContents.send('execute-menu-command', 'theme-default') }
                },
                {
                  label: 'Dark',
                  id: 'dark',
                  type: 'checkbox',
                  click () { win.webContents.send('execute-menu-command', 'theme-dark') }
                },
                {
                  label: 'Light',
                  id: 'light',
                  type: 'checkbox',
                  click () { win.webContents.send('execute-menu-command', 'theme-light') }
                },
                {
                  label: 'Cyber',
                  id: 'cyber',
                  type: 'checkbox',
                  click () { win.webContents.send('execute-menu-command', 'theme-cyber') }
                },
                {
                  label: 'Steve',
                  id: 'steve',
                  type: 'checkbox',
                  click () { win.webContents.send('execute-menu-command', 'theme-steve') }
                }
              ]
            }
          ]
        },
        {
          type: 'separator'
        },
        {
          label: 'Export Data',
          click () { win.webContents.send('execute-menu-command', 'export-data') }
        },
        {
          label: 'Import Data',
          click () { win.webContents.send('execute-menu-command', 'import-data') }
        },
        {
          type: 'separator'
        },
        {
          role: 'services'
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Create windows, tray, post electron init
app.on('ready', () => {
  createWindow()
  createQuickMenu()
  createTray()
  createMenu()

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

// IPC channel to quit the app
ipcMain.on('app-quit', () => {
  app.quit()
})

// IPC handlers for custom-electron-titlebar v4.x
ipcMain.handle('request-application-menu', () => {
  return null // No application menu for now
})

ipcMain.on('window-event', (event, data) => {
  // Handle window events
  if (data.type === 'maximize') {
    win.maximize()
  } else if (data.type === 'unmaximize') {
    win.unmaximize()
  } else if (data.type === 'minimize') {
    win.minimize()
  } else if (data.type === 'close') {
    win.close()
  }
  event.returnValue = true
})

ipcMain.on('update-window-controls', (event) => {
  event.returnValue = {
    isMaximized: win.isMaximized(),
    isMinimized: win.isMinimized(),
    isFullScreen: win.isFullScreen()
  }
})

// IPC handler for menu commands - removed as we send directly to renderer

// Modules and variable definition
const { remote, shell } = require('electron')

// Menu template object
const template = [
  {
    label: 'Tasks',
    submenu: [
      {
        label: 'New Task',
        accelerator: 'CmdOrCtrl+N',
        click () { window.openTaskMenu('new') }
      },
      {
        label: 'Edit Task',
        accelerator: 'CmdOrCtrl+Enter',
        click () { window.openTaskMenu('edit') }
      },
      {
        label: 'Clone Task',
        accelerator: 'CmdOrCtrl+L',
        click () { window.cloneTaskMenu() }
      },
      {
        label: 'Delete Task',
        accelerator: 'CmdOrCtrl+Backspace',
        click () { window.archiveTaskMenu() }
      },
      {
        label: 'Restore Task',
        accelerator: 'CmdOrCtrl+R',
        click () { window.restoreTaskMenu() }
      },
      {
        type: 'separator'
      },
      {
        label: 'Expand All Tasks',
        accelerator: 'CmdOrCtrl+Down',
        click () { window.expandAllMenu() }
      },
      {
        label: 'Collapse All Tasks',
        accelerator: 'CmdOrCtrl+Up',
        click () { window.collapseAllMenu() }
      },
      {
        label: 'Mark All Tasks Read',
        accelerator: 'CmdOrCtrl+R',
        click () { window.createKnownMenu() }
      },
      {
        label: 'Toggle Task Age',
        type: 'checkbox',
        id: 'menu-task-age',
        accelerator: 'CmdOrCtrl+G',
        click () { window.toggleAgeMenu() }
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

// Mac specific
if (process.platform === 'darwin') {
  // Add first menu item for Mac
  template.unshift({
    label: remote.app.name,
    submenu: [
      {
        role: 'about'
      },
      {
        label: 'Preferences',
        submenu: [
          {
            label: 'Settings',
            click () { window.settingsMenu() }
          },
          {
            label: 'Theme',
            id: 'theme',
            submenu: [
              {
                label: 'Default',
                id: 'default',
                type: 'checkbox',
                click () { window.setThemeMenu('default') }
              },
              {
                label: 'Dark',
                id: 'dark',
                type: 'checkbox',
                click () { window.setThemeMenu('dark') }
              },
              {
                label: 'Light',
                id: 'light',
                type: 'checkbox',
                click () { window.setThemeMenu('light') }
              },
              {
                label: 'Cyber',
                id: 'cyber',
                type: 'checkbox',
                click () { window.setThemeMenu('cyber') }
              },
              {
                label: 'Steve',
                id: 'steve',
                type: 'checkbox',
                click () { window.setThemeMenu('steve') }
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
        click () { window.exportDataMenu() }
      },
      {
        label: 'Import Data',
        click () { window.importDataMenu() }
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
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
} else {
  template.unshift({
    label: remote.app.name,
    submenu: [
      {
        role: 'about',
        click () { alert(`${remote.app.name}\n${remote.app.getVersion()}`) }
      },
      {
        label: 'Preferences',
        submenu: [
          {
            label: 'Settings',
            click () { window.settingsMenu() }
          },
          {
            label: 'Theme',
            id: 'theme',
            submenu: [
              {
                label: 'Default',
                id: 'default',
                type: 'checkbox',
                click () { window.setThemeMenu('default') }
              },
              {
                label: 'Dark',
                id: 'dark',
                type: 'checkbox',
                click () { window.setThemeMenu('dark') }
              },
              {
                label: 'Light',
                id: 'light',
                type: 'checkbox',
                click () { window.setThemeMenu('light') }
              },
              {
                label: 'Cyber',
                id: 'cyber',
                type: 'checkbox',
                click () { window.setThemeMenu('cyber') }
              },
              {
                label: 'Steve',
                id: 'steve',
                type: 'checkbox',
                click () { window.setThemeMenu('steve') }
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
        click () { window.exportDataMenu() }
      },
      {
        label: 'Import Data',
        click () { window.importDataMenu() }
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

// Add menu to app
const menu = remote.Menu.buildFromTemplate(template)
remote.Menu.setApplicationMenu(menu)

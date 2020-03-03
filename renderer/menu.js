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
        label: 'Toggle Task Age',
        type: 'checkbox',
        click () { window.toggleAgeMenu() }
      },
      {
        type: 'separator'
      },
      {
        label: 'Export Tasks',
        click () { window.exportTasksMenu() }
      },
      {
        label: 'Import Tasks',
        click () { window.importTasksMenu() }
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
  // Add first menu item
  template.unshift({
    label: remote.app.name,
    submenu: [
      {
        role: 'about'
      },
      {
        label: 'Theme',
        submenu: [
          {
            label: 'Defaut',
            click () { window.setThemeMenu('default') }
          },
          {
            label: 'Dark',
            click () { window.setThemeMenu('dark') }
          },
          {
            label: 'Light',
            click () { window.setThemeMenu('light') }
          }
        ]
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
}

// Add menu to app
const menu = remote.Menu.buildFromTemplate(template)
remote.Menu.setApplicationMenu(menu)

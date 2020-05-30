// Modules and variable definition
const { dialog } = require('electron')
const { autoUpdater } = require('electron-updater')

// Disabable auto-download of updates
autoUpdater.autoDounload = false

// Check for app updates
module.exports = () => {
  // Check for updates
  autoUpdater.checkForUpdates()

  // Listen for update
  autoUpdater.on('update-available', () => {
    // Prompt for user to update
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'A new version of Moby is available. Do you want to update now?',
      button: ['Update', 'Cancel']
    }, buttonIndex => {
      // Download if Update chosen
      if (buttonIndex === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  // Listen for update
  autoUpdater.on('update-downloaded', () => {
    // Prompt for user to update
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Install and restart now?',
      button: ['Restart', 'Later']
    }, buttonIndex => {
      // Download if Update chosen
      if (buttonIndex === 0) {
        autoUpdater.quitAndInstall(true, true)
      }
    })
  })
}

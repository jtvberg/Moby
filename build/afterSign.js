const { notarize } = require('electron-notarize')

exports.default = function (context) {
  // Skip if not mac build
  if (process.platform === 'darwin') {
    console.log('Notarizing')
    // Get contex vars
    const appName = context.packager.appInfo.productFilename
    const appDir = context.appOutDir

    // Notarize
    return notarize({
      appBundleId: 'com.jtvberg.moby',
      appPath: `${appDir}/${appName}.app`,
      appleId: process.env.appleId,
      appleIdPassword: process.env.appleIdPassword
    })
  }
}

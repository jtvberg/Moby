## Moby
Moby is a Kanban based personal task management system built with Electron.

## Using the code
    Clone repo
    Provided instructions assume you are using npm as your package manager
    Code has not been tested with other package managers such as Yarn
    Navigate to directory and run 'npm install' to install dependencies

## Running the code
    'npm start' will launch the app (alternatively you can use 'electron .' if you are not using npm)
    You can uncomment the dev tools load on start up in main.js (~webContents.openDevTools()) or launch from help menu to debug
    To debug main.js you can use the following commands (assumes you are using npm):
    'npm run debug' will launch in main process debug mode on port 6969
    'npm run break' will launch the app and break at entry point also on port 6969
    Use chrome://inspect and configure the target with above port

## Other
  A fully packaged app is not yet avaliable.

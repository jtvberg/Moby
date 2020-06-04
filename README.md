## Moby
Moby is a Kanban based personal task management system built with Electron
It can integrate with GitHub (Issues + PRs), Rally (Defects/Blocked USs) and ServiceNow (Incidents/Problems)

#### Default View:
![Default View](/screenshots/full_default.png)

#### Customized:
![Default View](/screenshots/full_custom.png)

#### New Task Modal:
![Default View](/screenshots/new_task.png =250x)

#### Edit Mode Task Modal:
![Default View](/screenshots/edit_task.png =250x)

#### Settings Modal:
![Default View](/screenshots/settings_general.png =300x)

## Using the code
    Clone repo
    Provided instructions assume you are using npm as your package manager
    Code has not been tested with other package managers such as Yarn
    Navigate to directory and run 'npm install' to install dependencies

## Running the code
    Some npm scripts are already setup in package.json
    'npm start' will launch the app (alternatively you can use 'electron .')
    You can uncomment the dev tools load on start up in main.js (~webContents.openDevTools()) or launch from help menu to debug
    To debug main.js you can use the following commands (assumes you are using npm):
    'npm run debug' will launch in main process debug mode on port 6969
    'npm run break' will launch the app and break at entry point also on port 6969
    Use chrome://inspect and configure the target with above port

## Other
  A fully packaged beta is available under releases for Mac/Win which supports auto-update on Mac
  Tested on MacOS (Mojave & Catalina), Windows 10 (1909) and Linux (Mint 19.3)

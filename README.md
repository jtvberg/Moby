## Moby
Moby is a Kanban based personal task management system built with Electron
It can integrate with GitHub (Issues + PRs), Rally (Defects/Blocked USs) and ServiceNow (Incidents/Problems)

#### Default View:
![Default View](/screenshots/full_default.png)

#### Customized:
![Custom View](/screenshots/full_custom.png)

#### New Task Modal:
<img src="/screenshots/new_task.png" width="250"/>

#### Edit Mode Task Modal:
<img src="/screenshots/edit_task.png" width="250"/>

#### Expanded Card:
<img src="/screenshots/expanded_card.png" width="250"/>

#### Highlighted Card:
<img src="/screenshots/highlight_card.png" width="250"/>

#### Settings Modal:
<img src="/screenshots/settings_general.png" width="500"/>

#### GitHub Settings:
<img src="/screenshots/settings_gh.png" width="500"/>

#### Service Stack (GitHub):
<img src="/screenshots/serv_stack.png" width="500"/>

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

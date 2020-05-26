// Modules and variable definition
const { ipcRenderer } = require('electron')
const rally = require('rally')
// const creds = require('./creds.js')
// const queryUtils = rally.util.query

// Local project list
const projects = []

// Local item list
const items = []

// Export project list
exports.rallyProjectList = JSON.parse(localStorage.getItem('rallyProjectList')) || []

// Track item list
exports.rallyItemList = []

// Track tag list
exports.rallyTagList = []

// Update export list with local
exports.updateProjectList = () => {
  projects.forEach(project => {
    project.ProjectActive = this.rallyProjectList.find(proj => proj.ProjectId === project.ProjectId) ? this.rallyProjectList.find(proj => proj.ProjectId === project.ProjectId).ProjectActive : project.ProjectActive
  })
  this.rallyProjectList = projects.sort((a, b) => (a.ProjectName > b.ProjectName) ? 1 : -1)
  this.saveRallyProjects()
}

// Update group bool that denotes active and shown in stack
exports.updateRallyProjectActive = (projectId, projectActive) => {
  this.rallyProjectList.find(project => project.ProjectId === projectId).ProjectActive = projectActive
}

// Get all projects with permissions based on token
exports.getRallyProjects = (domain, token) => {
  const restApi = rally({
    apiKey: token,
    server: domain,
    requestOptions: {
      headers: {
        'X-RallyIntegrationName': 'Moby',
        'X-RallyIntegrationVendor': 'jtvberg',
        'X-RallyIntegrationVersion': '1.0'
      }
    }
  })

  restApi.query({
    type: 'projectpermission',
    start: 1,
    pageSize: 200,
    limit: 200,
    fetch: ['Project', 'Name', 'ObjectID']
  }, function (error, result) {
    if (error) {
      console.log(error)
      alert('Unable to connect to Rally')
    } else {
      projects.length = 0
      result.Results.forEach(element => {
        projects.push({
          ProjectName: element.Project.Name,
          ProjectId: element.Project.ObjectID,
          ProjectUrl: element.Project._ref,
          ProjectActive: false
        })
      })
      ipcRenderer.send('get-projects')
    }
  })
}

// Save groups to local storage
exports.saveRallyProjects = () => {
  localStorage.setItem('rallyProjectList', JSON.stringify(this.rallyProjectList))
  this.rallyProjectList = JSON.parse(localStorage.getItem('rallyProjectList')) 
}

// Get all items within query parameters
exports.getRallyItems = (domain, token) => {
  const restApi = rally({
    apiKey: token,
    server: domain,
    requestOptions: {
      headers: {
        'X-RallyIntegrationName': 'Moby',
        'X-RallyIntegrationVendor': 'jtvberg',
        'X-RallyIntegrationVersion': '1.0'
      }
    }
  })

  restApi.query({
    type: 'defect',
    start: 1,
    pageSize: 200,
    limit: 200,
    fetch: ['Project', 'LastUpdateDate', 'FormattedId', 'SubmittedBy', 'Owner']
  }, function (error, result) {
    if (error) {
      console.log(error)
      alert('Unable to connect to Rally')
    } else {
      projects.length = 0
      result.Results.forEach(element => {
        items.push({ ProjectName: element.Project.Name, ProjectId: element.Project.ObjectID, ProjectUrl: element.Project._ref })
      })
      ipcRenderer.send('get-projects')
    }
  })
}

// this.getRallyItems(creds.rallyDomain, creds.rallyToken)

// Modules and variable definition
const { ipcRenderer } = require('electron')
const rally = require('rally')
const creds = require('./creds.js')
const restApi = rally({
  apiKey: creds.rallyToken,
  server: 'https://rally1.rallydev.com',
  requestOptions: {
    headers: {
      'X-RallyIntegrationName': 'Moby',
      'X-RallyIntegrationVendor': 'jtvberg',
      'X-RallyIntegrationVersion': '1.0'
    }
  }
})
// var queryUtils = rally.util.query

// Export project list
exports.rallyProjectList = JSON.parse(localStorage.getItem('rallyProjectList')) || []

// Local project list
const projectList = []

// Update export list with local
exports.updateProjectList = () => {
  projectList.sort((a, b) => (a.ProjectName > b.ProjectName) ? 1 : -1)
  this.rallyProjectList = projectList
}

// Get all projects with permissions based on token
exports.getRallyProjects = () => {
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
      projectList.length = 0
      result.Results.forEach(element => {
        projectList.push({ ProjectName: element.Project.Name, ProjectId: element.Project.ObjectID, ProjectUrl: element.Project._ref })
      })
      ipcRenderer.send('get-projects')
    }
  })
}

// Save groups to local storage
exports.saveRallyProjects = () => {
  localStorage.setItem('rallyProjectList', JSON.stringify(this.rallyProjectList))
}

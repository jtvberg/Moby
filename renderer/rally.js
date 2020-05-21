// Modules and variable definition
const { ipcRenderer } = require('electron')
const rally = require('rally')
const creds = require('./creds.js')
// const queryUtils = rally.util.query

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
      // alert('Unable to connect to Rally')
    } else {
      console.log(result.Results)
      // projectList.length = 0
      // result.Results.forEach(element => {
      //   projectList.push({ ProjectName: element.Project.Name, ProjectId: element.Project.ObjectID, ProjectUrl: element.Project._ref })
      // })
      // ipcRenderer.send('get-projects')
    }
  })
}

this.getRallyItems(creds.rallyDomain, creds.rallyToken)

// Modules and variable definition
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

exports.getRallyProjects = () => {
  const projectList = []
  restApi.query({
    type: 'projectpermission',
    start: 1,
    pageSize: 200,
    limit: 200,
    fetch: ['Project']
  }, function (error, result) {
    if (error) {
      console.log(error)
    } else {
      console.log(result.Results)
      result.Results.forEach(element => {
        projectList.push(element.Project._refObjectName)
      })
      projectList.sort((a, b) => (a > b) ? 1 : -1)
      console.log(projectList)
    }
  })
}

// this.getRallyProjects()

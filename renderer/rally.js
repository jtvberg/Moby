// Modules and variable definition
const { ipcRenderer, clipboard } = require('electron')
const rally = require('rally')
const refUtils = rally.util.ref

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

// Update export list with local
exports.updateItemList = () => {
  this.rallyItemList = items
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

  const type = 'Defect'
  $('#rally-stack').find('.box').children().remove()
  $('#rally-stack').find('.box').append(`<div class="no-results getting-results"><span">Getting ${type}s </span><div class="spinner-grow spinner-grow-sm" role="status"></div></div>`)

  let queryPrefix = '((((State != Closed) AND (Blocked = true)) AND (Priority != Low)) AND '
  let queryProj = ''
  let first = true
  this.rallyProjectList.forEach(project => {
    if (project.ProjectActive) {
      if (first) {
        queryProj += `(Project = /project/${project.ProjectId}) OR `
        first = false
      } else {
        queryPrefix += '('
        queryProj += `(Project = /project/${project.ProjectId})) OR `
      }
    }
  })
  const query = queryPrefix + queryProj.substring(0, queryProj.length - 4) + ')'

  restApi.query({
    type: 'defect',
    start: 1,
    pageSize: 200,
    limit: Infinity,
    scope: {
      up: false,
      down: false
    },
    fetch: ['_ref'],
    query: query.trim()
  }, function (error, result) {
    if (error) {
      console.log(error)
      alert('Unable to connect to Rally')
      $('#rally-stack').find('.box').children().remove()
      $('#rally-stack').find('.box').append('<div class="no-results getting-results"><span>Unable to Connect</span></div></div>')
    } else {
      items.length = 0
      if (result.Results.length > 0) {
        result.Results.forEach(element => {
          getRallyItem(domain, token, refUtils.getRelative(element._ref))
        })
      } else {
        $('#rally-stack').find('.box').children().remove()
        $('#rally-stack').find('.box').append('<div class="no-results getting-results"><span>No Defects</span></div></div>')
      }
    }
  })
}

// Get item details by ref
function getRallyItem (domain, token, item) {
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

  restApi.get({
    ref: item,
    fetch: [
      'Name',
      'FormattedID',
      'ObjectID',
      'Blocked',
      'Priority',
      'State',
      'ScheduleState',
      'Severity',
      'CreationDate',
      'LastUpdateDate',
      'Project'
    ]
  }, function (error, result) {
    if (error) {
      console.log(error)
    } else {
      if (result.Object.Priority !== 'Low') {
        const url = new URL(result.Object.Project._ref)
        const project = url.pathname.split('/')[url.pathname.split('/').length - 1]
        const defect = {
          Name: result.Object.Name,
          FormattedID: result.Object.FormattedID,
          ObjectID: result.Object.ObjectID,
          Blocked: result.Object.Blocked,
          Priority: result.Object.Priority,
          State: result.Object.State,
          ScheduleState: result.Object.ScheduleState,
          Severity: result.Object.Severity,
          CreationDate: result.Object.CreationDate,
          LastUpdateDate: result.Object.LastUpdateDate,
          Project: result.Object.Project.Name,
          Url: `${domain}/#/${project}/detail/defect/${result.Object.ObjectID}`
        }
        items.push(defect)
      }
      ipcRenderer.send('get-items')
    }
  })
}

// Add incidents to UI
exports.addRallyItem = (item) => {
  const id = item.ObjectID
  const name = item.FormattedID
  // Remove existing card instance
  $(`#${id}`).remove()
  // Get incident dates and calc age
  const cd = new Date(item.CreationDate)
  const ud = new Date(item.LastUpdateDate)
  const age = Math.floor((Date.now() - ud) / 86400000) + '/' + Math.floor((Date.now() - cd) / 86400000)
  // Set card color
  const color = item.Priority === 'Resolve Immediately' ? 2 : item.Priority === 'High Attention' ? 4 : item.Priority === 'Normal' ? 3 : item.Priority === 'Low' ? 1 : 5
  // Add issue tags
  const tag = 'Defect'
  let tagColor = `#${asciiToHex(tag)}`
  tagColor = hexToHSL(tagColor, 60)
  const tagHTML = `<div class="tags" style="background-color: ${tagColor}">${tag}</div>`
  // get incident URL
  const url = item.Url
  // Color glyphs
  let colorGlyph = ''
  switch (color) {
    case 1:
      colorGlyph = 'cloud'
      break
    case 2:
      colorGlyph = 'heart'
      break
    case 3:
      colorGlyph = 'crown'
      break
    case 4:
      colorGlyph = 'carrot'
      break
    case 5:
      colorGlyph = 'tree'
      break
  }
  // Show color glyphs
  const showColorGlyphs = $('.color-glyph').is(':visible') ? '' : 'style="display: none;"'
  // Check if age is toggled
  const showAge = $('.aging').is(':visible') ? 'style' : 'style="display: none;"'
  // Show banded cards $('.card-bar').is(':visible')
  const bandedCards = $('.card-bar').is(':visible') ? '' : 'style="display: none;"'
  const colorCards = $('.card-bar').is(':visible') ? ' color-trans' : ''
  // Generate issue card html
  const itemHtml = `<div class="card color-${color}${colorCards}" id="${id}" data-url="${url}">
                      <div class="card-bar color-${color}"${bandedCards}></div>  
                      <div class="card-header" style="clear: both" id="b${id}" data-toggle="collapse" data-target="#c${id}">
                        <span class="color-glyph fas fa-${colorGlyph}" ${showColorGlyphs}></span>
                        <span class="title">${name}</span>
                        <span class="aging" id="a${id}" ${showAge}>${age}</span>
                      </div>
                      <div class="card-content collapse collapse-content" id="c${id}">
                        <div class="card-detail" id="d${id}" style="white-space: pre-wrap;" draggable="true" ondragstart="event.preventDefault(); event.stopPropagation();"><a style="color: var(--highlight)" id="l${id}" href="${url}">Rally Link</a><br><b>Priority:</b> ${item.Priority}<br><b>Severity:</b> ${item.Severity}<br><b>State:</b> ${item.State}<br><b>Created:</b> ${item.CreationDate}<br><b>Updated:</b> ${item.LastUpdateDate}<br><b>Project:</b> ${item.Project}<br><b>Detail:</b> ${item.Name.trim()}</div>
                        <div class="tag-box" id="t${id}">${tagHTML}</div>
                        <div class="card-menu">
                          <div class="card-menu-item fas fa-clipboard" id="copy-button-${id}" data-toggle="tooltip" title="Copy To Clipboard"></div>
                        </div>
                        </div>
                      </div>
                    </div>`
  // Add issue html to host
  $('#rally-stack').find('.box').append(itemHtml)
  // Stop right-click on card invoking remove stack
  $(`#${id}`).contextmenu((e) => {
    e.stopPropagation()
  })
  // Copy issue details to clipboard
  $(`#copy-button-${id}`).click(() => {
    const cbs = `${id}\nLink: ${url}\nPriority: ${item.Priority}\nSeverity: ${item.Severity}\nState: ${item.State}\nCreated: ${item.CreationDate}\nUpdated: ${item.LastUpdateDate}\nProject: ${item.Project}\nDetail: ${item.Name.trim()}`
    clipboard.writeText(cbs)
  })
  // Initialize tooltips
  $(function () {
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 1500, hide: 100 } })
  })
}

// Convert hex color to HSL
function hexToHSL (hex, saturation) {
  // Convert hex to RGB first
  let r = 0
  let g = 0
  let b = 0
  if (hex.length === 4) {
    r = '0x' + hex[1] + hex[1]
    g = '0x' + hex[2] + hex[2]
    b = '0x' + hex[3] + hex[3]
  } else if (hex.length === 7) {
    r = '0x' + hex[1] + hex[2]
    g = '0x' + hex[3] + hex[4]
    b = '0x' + hex[5] + hex[6]
  }
  // Then to HSL
  r /= 255
  g /= 255
  b /= 255
  const cmin = Math.min(r, g, b)
  const cmax = Math.max(r, g, b)
  const delta = cmax - cmin
  let h = 0
  let s = 0
  let l = 0

  if (delta === 0) {
    h = 0
  } else if (cmax === r) {
    h = ((g - b) / delta) % 6
  } else if (cmax === g) {
    h = (b - r) / delta + 2
  } else {
    h = (r - g) / delta + 4
  }

  h = Math.round(h * 60)

  if (h < 0) { h += 360 }
  l = (cmax + cmin) / 2
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  s = saturation || +(s * 200).toFixed(1)
  l = +(l * 100).toFixed(1)
  return 'hsl(' + h + ',' + s + '%,' + l + '%)'
}

// Convert string to 6 character Hex
function asciiToHex (str) {
  const arr = []
  for (let i = 0, t = 3; i < t; i++) {
    for (let n = 0, l = str.length; n < l; n++) {
      const hex = Number(str.charCodeAt(n)).toString(16)
      arr.push(hex)
    }
  }
  return arr.join('').substring(0, 6)
}

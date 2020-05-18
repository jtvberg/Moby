// Modules and variable definition
const { ipcRenderer, clipboard } = require('electron')
const ServiceNow = require('servicenow-rest-api')
const os = require('os')
const username = os.userInfo().username

// Import ServiceNow groups from local storage
exports.snGroupsList = JSON.parse(localStorage.getItem('snGroupList')) || []

// Track incidents list
exports.snIncidentList = []

// Track tag list
exports.snTagList = []

// Temp group array
const groups = []

// Temp incident array
const incidents = []

// Update local list of available ServiceNow groups from temp array
exports.updateSnGroupList = () => {
  groups.forEach(group => {
    group.GroupActive = this.snGroupsList.find(g => g.GroupId === group.GroupId).GroupActive || group.GroupActive
  })
  this.snGroupsList = groups.sort((a, b) => (a.GroupName > b.GroupName) ? 1 : -1)
}

// Update local list of incidents from temp array
exports.updateSnIncidentList = () => {
  this.snIncidentList = incidents.sort()
}

// Update group bool that denotes active and shown in stack
exports.updateSnGroupActive = (groupId, groupActive) => {
  this.snGroupsList.find(group => group.GroupId === groupId).GroupActive = groupActive
}

// Query for available groups based on user
exports.getSnGroups = (domain, token) => {
  const fields = [
    'sys_id',
    'group'
  ]
  const filters = [
    `user.u_ms_id=${username}`
  ]
  const type = 'sys_user_grmember'
  let un = ''
  let pw = ''
  try {
    un = atob(token).split('**')[0]
    pw = atob(token).split('**')[1]
  } catch (err) {
    alert('Invalid ServiceNow Token')
  }
  const sn = new ServiceNow(domain, un, pw)
  sn.Authenticate()
  sn.getTableData(fields, filters, type, function (res) {
    try {
      res.forEach(r => {
        const url = new URL(r.group.link)
        const newGroup = {
          GroupName: r.group.display_value,
          GroupId: url.pathname.split('/')[url.pathname.split('/').length - 1],
          GroupActive: false
        }
        groups.push(newGroup)
      })
    } catch (err) {
      alert('Unable to connect to ServiceNow')
    }
    ipcRenderer.send('get-groups')
  })
}

// Save groups to local storage
exports.saveSnGroups = () => {
  localStorage.setItem('snGroupList', JSON.stringify(this.snGroupsList))
}

// Query for incidents within active groups
exports.getSnIncidents = (domain, token, priority) => {
  const fields = [
    'number',
    'state',
    'opened_at',
    'sys_updated_on',
    'opened_by',
    'short_description',
    'assignment_group',
    'priority',
    'sys_id'
  ]
  const filters = [
    `priority<=${priority}`,
    'active=true'
  ]
  filters.push('assignment_group.sys_id=non-existant-group')
  this.snGroupsList.forEach(group => {
    if (group.GroupActive) {
      filters.push(`ORassignment_group.sys_id=${group.GroupId}`)
    }
  })
  $('#sn-stack').find('.box').children().remove()
  this.snTagList.length = 0
  incidents.length = 0
  const types = ['Problem', 'Incident']
  let un = ''
  let pw = ''
  try {
    un = atob(token).split('**')[0]
    pw = atob(token).split('**')[1]
  } catch (err) {
    alert('Invalid ServiceNow Token')
  }
  const sn = new ServiceNow(domain, un, pw)
  sn.Authenticate()
  let isError = false
  types.forEach(type => {
    $('#sn-stack').find('.box').append(`<div class="no-results getting-results"><span">Getting ${type}s </span><div class="spinner-grow spinner-grow-sm" role="status"></div></div>`)
    sn.getTableData(fields, filters, type.toLowerCase(), function (res) {
      try {
        res.forEach(r => {
          incidents.push(r)
        })
        if (res.length >= 0) {
          ipcRenderer.send('get-incidents', type)
        }
      } catch (err) {
        if (isError) {
          alert('Unable to connect to ServiceNow')
          isError = false
        }
        isError = true
      }
    })
  })
}

// Add incidents to UI
exports.addSnIncident = (incident) => {
  const id = incident.number
  // Remove existing card instance
  $(`#${id}`).remove()
  // Get incident dates and calc age
  const cd = new Date(incident.opened_at)
  const ud = new Date(incident.sys_updated_on)
  const age = Math.floor((Date.now() - ud) / 86400000) + '/' + Math.floor((Date.now() - cd) / 86400000)
  // Set card color
  const priority = parseInt(incident.priority)
  const color = priority === 1 ? 2 : priority === 2 ? 4 : priority === 3 ? 3 : priority === 4 ? 1 : 5
  // color = issue.assigned ? 2 : color
  // Add issue tags
  const tagHTML = id.substring(0, 3) === 'INC' ? '<div class="tags">Incident</div>' : '<div class="tags">Problem</div>'
  // get incident URL
  const url = id.substring(0, 3) === 'INC' ? `https://optum.service-now.com/nav_to.do?uri=incident.do?sys_id=${incident.sys_id}` : `https://optum.service-now.com/nav_to.do?uri=problem.do?sys_id=${incident.sys_id}`
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
  const incidentHtml = `<div class="card color-${color}${colorCards}" id="${id}" data-url="${url}">
                      <div class="card-bar color-${color}"${bandedCards}></div>  
                      <div class="card-header" style="clear: both" id="b${id}" data-toggle="collapse" data-target="#c${id}">
                        <span class="color-glyph fas fa-${colorGlyph}" ${showColorGlyphs}></span>
                        <span class="title">${id}</span>
                        <span class="aging" id="a${id}" ${showAge}>${age}</span>
                      </div>
                      <div class="card-content collapse collapse-content" id="c${id}">
                        <div class="card-detail" id="d${id}" style="white-space: pre-wrap;" draggable="true" ondragstart="event.preventDefault(); event.stopPropagation();"><a style="color: var(--highlight)" id="l${id}" href="${url}">ServiceNow Link</a><br><b>Priority:</b> ${incident.priority}<br><b>State:</b> ${incident.state}<br><b>Created:</b> ${incident.opened_at}<br><b>Updated:</b> ${incident.sys_updated_on}<br><b>Opened by:</b> ${incident.opened_by.display_value}<br><b>Assigned to:</b> ${incident.assignment_group.display_value}<br><b>Detail:</b> ${incident.short_description.trim()}</div>
                        <div class="tag-box" id="t${id}">${tagHTML}</div>
                        <div class="card-menu">
                          <div class="card-menu-item fas fa-clipboard" id="copy-button-${id}" data-toggle="tooltip" title="Copy To Clipboard"></div>
                        </div>
                        </div>
                      </div>
                    </div>`
  // Add issue html to host
  $('#sn-stack').find('.box').append(incidentHtml)
  // Stop right-click on card invoking remove stack
  $(`#${id}`).contextmenu((e) => {
    e.stopPropagation()
  })
  // Copy issue details to clipboard
  $(`#copy-button-${id}`).click(() => {
    const cbs = `${id}\nLink: ${url}\nPriority: ${incident.priority}\nState: ${incident.state}\nCreated: ${incident.opened_at}\nUpdated: ${incident.sys_updated_on}\nOpened by: ${incident.opened_by.display_value}\nAssigned to: ${incident.assignment_group.display_value}\nDetail: ${incident.short_description.trim()}`
    clipboard.writeText(cbs)
  })
  // Initialize tooltips
  $(function () {
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 1500, hide: 100 } })
  })
}

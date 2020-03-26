// Modules and variable definition
const { ipcRenderer } = require('electron')
const { Octokit } = require('@octokit/rest')
const { shell } = require('electron')

const octokit = new Octokit({
  // baseUrl: 'https://github.optum.com/api/v3'
  baseUrl: 'https://api.github.com'
  // owner: 'jvanden3',
  // auth: 'd47bf429371210354bc206d690e7e0f0215d7bbe'
})

// https://api.github.com/repos/jtvberg/Moby/issues
// https://github.optum.com/api/v3/repos/paymentintegrity/Clinical-Leads/issues
exports.issueList = []

exports.issuesCollection = octokit.paginate('GET /repos/:owner/:repo/issues', {
  // owner: 'paymentintegrity',
  // repo: 'Clinical-Leads'
  owner: 'jtvberg',
  repo: 'Moby'
}).then(issues => {
  this.issueList = issues
  ipcRenderer.send('get-issues')
})

exports.tagList = ['Issue']

// Add task(s) to UI
exports.addIssue = (task) => {
  // Add task tags
  let tagHTML = '<div class="tags">Issue</div>'
  if (task.labels && task.labels.length > 0) {
    task.labels.forEach((tag) => {
      tagHTML += `<div class="tags">${tag.name}</div>`
      this.tagList.push(tag.name)
    })
  }
  const cd = new Date(task.created_at)
  const ud = new Date(task.updated_at)
  const assigned = task.assignee ? task.assignee.login : 'NA'
  const color = task.assignee && task.assignee.login === 'jvanden3' ? 2 : 1
  // Generate task card html
  const taskHtml = `<div class="card color-${color}" id="${task.number}" draggable="true" ondragstart="drag(event)">
                      <div style="clear: both" id="b${task.number}" data-toggle="collapse" data-target="#c${task.number}">
                        <span class="title">#${task.number} ${task.title}</span>
                      </div>
                      <div class="collapse collapse-content" id="c${task.number}">
                        <div class="detail" id="d${task.number}" contenteditable="true" style="white-space: pre-wrap;" draggable="true" ondragstart="event.preventDefault(); event.stopPropagation();">Created: ${cd.toLocaleDateString()}<br>Updated: ${ud.toLocaleDateString()}<br>Opened by: ${task.user.login}<br>Assigned to: ${assigned}<br><a style="color: white" id="l${task.number}" href="${task.html_url}">GitHub Link</a><br>${task.body}</div>
                        <div class="tag-box" id="t${task.number}">${tagHTML}</div>
                        <div class="card-menu">
                        </div>
                      </div>
                    </div>`
  // Add task html to host
  // $('#stack-1585079248594').find('.box').append(taskHtml)
  $('#stack-1585248967408').find('.box').append(taskHtml)
  // Active task setting event
  $(`#${task.number}`).on('click', () => {
    window.activeTask = task.number
    $('.card').removeClass('card-selected')
    $(`#${task.number}`).removeClass('card-highlighted').addClass('card-selected')
    $(`#${task.number}`).parent().animate({ scrollTop: $(`#${task.number}`).offset().top - $(`#${task.number}`).parent().offset().top + $(`#${task.number}`).parent().scrollTop() })
    $('.window-title').text(`Moby - ${task.title}`)
  })
  // Stop right-click on card invoking remove stack
  $(`#${task.number}`).contextmenu((e) => {
    e.stopPropagation()
  })
  $(`#l${task.number}`).on('click', () => {
    shell.openExternal(`${task.html_url}`)
  })
  // Initialize tooltips
  $(function () {
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 1500, hide: 100 } })
  })
}

// Modules and variable definition
const { ipcRenderer } = require('electron')
const { Octokit } = require('@octokit/rest')
const { shell } = require('electron')

const octokit = new Octokit({
  baseUrl: 'https://api.github.com'
})

// Track repo list
exports.repoList = []

// Track issue list
exports.issueList = []

// Get issues from repo
exports.getIssues = () => {
  this.repoList.forEach((repo) => {
    octokit.paginate('GET /repos/:owner/:repo/issues', {
      owner: repo.owner,
      repo: repo.repo
    }).then(issues => {
      issues.forEach((issue) => {
        this.issueList.push({
          stack: `#stack-${repo.owner}-${repo.repo}`,
          user: repo.user,
          issueOjb: issue
        })
      })
      ipcRenderer.send('get-issues')
    })
  })
}

// Clear issues from stacks
exports.clearIssues = (stack) => {
  $(stack).find('.box').children().remove()
}

// Track tag list
exports.tagList = ['Issue']

// Add issue(s) to UI
exports.addIssue = (issue) => {
  const id = issue.issueOjb.node_id.replace('=', '')
  const cd = new Date(issue.issueOjb.created_at)
  const ud = new Date(issue.issueOjb.updated_at)
  const assigned = issue.issueOjb.assignee ? issue.issueOjb.assignee.login : 'NA'
  const color = issue.issueOjb.assignee && issue.issueOjb.assignee.login === issue.user ? 5 : 1
  // remove existing cards
  $(`#${id}`).remove()
  // Add issue tags
  let tagHTML = '<div class="tags">Issue</div>'
  if (issue.issueOjb.labels && issue.issueOjb.labels.length > 0) {
    issue.issueOjb.labels.forEach((tag) => {
      tagHTML += `<div class="tags">${tag.name}</div>`
      this.tagList.push(tag.name)
    })
  }
  // Generate issue card html
  const issueHtml = `<div class="card color-${color}" id="${id}" draggable="true" ondragstart="drag(event)">
                      <div style="clear: both" id="b${id}" data-toggle="collapse" data-target="#c${id}">
                        <span class="title">#${issue.issueOjb.number} ${issue.issueOjb.title}</span>
                      </div>
                      <div class="collapse collapse-content" id="c${id}">
                        <div class="detail" id="d${id}" contenteditable="true" style="white-space: pre-wrap;" draggable="true" ondragstart="event.preventDefault(); event.stopPropagation();">Created: ${cd.toLocaleDateString()}<br>Updated: ${ud.toLocaleDateString()}<br>Opened by: ${issue.issueOjb.user.login}<br>Assigned to: ${assigned}<br><a style="color: white" id="l${id}" href="${issue.issueOjb.html_url}">GitHub Link</a><br>${issue.issueOjb.body}</div>
                        <div class="tag-box" id="t${id}">${tagHTML}</div>
                        <div class="card-menu">
                        </div>
                      </div>
                    </div>`
  // Add issue html to host
  // $('#stack-1585079248594').find('.box').append(issueHtml)
  $(issue.stack).find('.box').append(issueHtml)
  // Active issue setting event
  $(`#${id}`).on('click', () => {
    window.activeTask = id
    $('.card').removeClass('card-selected')
    $(`#${id}`).removeClass('card-highlighted').addClass('card-selected').parent().animate({ scrollTop: $(`#${id}`).offset().top - $(`#${id}`).parent().offset().top + $(`#${id}`).parent().scrollTop() })
    $('.window-title').text(`Moby - ${issue.issueOjb.title}`)
  })
  // Stop right-click on card invoking remove stack
  $(`#${id}`).contextmenu((e) => {
    e.stopPropagation()
  })
  $(`#l${id}`).on('click', () => {
    shell.openExternal(`${issue.issueOjb.html_url}`)
  })
  // Initialize tooltips
  $(function () {
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 1500, hide: 100 } })
  })
}

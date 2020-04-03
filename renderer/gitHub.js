// Modules and variable definition
const { ipcRenderer, shell } = require('electron')
const { Octokit } = require('@octokit/rest')

// Track repo list
exports.repoList = JSON.parse(localStorage.getItem('repoList')) || []

// Track issue list
exports.issueList = []

// Get issues from repo
exports.getIssues = () => {
  if (this.repoList.length > 0) {
    this.repoList.forEach((repo) => {
      const octokit = new Octokit({ auth: repo.auth })
      octokit.paginate('GET /repos/:owner/:repo/issues', {
        baseUrl: repo.baseUrl,
        owner: repo.owner,
        repo: repo.repo
      }).then(issues => {
        issues.forEach((issue) => {
          this.issueList.push({
            stack: `#git-stack-${repo.owner}-${repo.repo}`,
            user: repo.user,
            issueOjb: issue
          })
        })
        ipcRenderer.send('get-issues')
      })
    })
  }
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
  const age = Math.floor((Date.now() - ud) / 86400000) + '/' + Math.floor((Date.now() - cd) / 86400000)
  const assigned = issue.issueOjb.assignee ? issue.issueOjb.assignee.login : 'NA'
  // Set card color
  let color = issue.issueOjb.user.login === issue.user ? 5 : 1
  issue.issueOjb.assignees.forEach((assignee) => {
    if (assignee.login === issue.user) { color = 3 }
  })
  color = issue.issueOjb.assignee && issue.issueOjb.assignee.login === issue.user ? 2 : color
  // Remove existing card instance
  $(`#${id}`).remove()
  // Add issue tags
  let tagHTML = '<div class="tags">Issue</div>'
  if (issue.issueOjb.labels && issue.issueOjb.labels.length > 0) {
    issue.issueOjb.labels.forEach((tag) => {
      tagHTML += `<div class="tags">${tag.name}</div>`
      this.tagList.push(tag.name)
    })
  }
  // Check if age is toggled
  const showAge = $('.aging').is(':visible') ? 'style' : 'style="display: none;"'
  // Generate issue card html
  const issueHtml = `<div class="card color-${color}" id="${id}">
                      <div style="clear: both" id="b${id}" data-toggle="collapse" data-target="#c${id}">
                        <span class="title">#${issue.issueOjb.number} ${issue.issueOjb.title}</span>
                        <span class="aging" id="a${id}" ${showAge}>${age}</span>
                      </div>
                      <div class="collapse collapse-content" id="c${id}">
                        <div class="detail" id="d${id}" contenteditable="true" style="white-space: pre-wrap;" draggable="true" ondragstart="event.preventDefault(); event.stopPropagation();">Created: ${cd.toLocaleDateString()}<br>Updated: ${ud.toLocaleDateString()}<br>Opened by: ${issue.issueOjb.user.login}<br>Assigned to: ${assigned}<br><a style="color: white" id="l${id}" href="${issue.issueOjb.html_url}">GitHub Link</a><br>${issue.issueOjb.body}</div>
                        <div class="tag-box" id="t${id}">${tagHTML}</div>
                        <div class="card-menu">
                        </div>
                      </div>
                    </div>`
  // Add issue html to host
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

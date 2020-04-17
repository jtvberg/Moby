// Modules and variable definition
const { ipcRenderer, shell } = require('electron')
const { Octokit } = require('@octokit/rest')

// Track repo list
exports.repoList = JSON.parse(localStorage.getItem('repoList')) || []

exports.refreshRepos = () => {
  this.repoList = JSON.parse(localStorage.getItem('repoList'))
}

// Track issue list
exports.issueList = []

// Get issues from repo
exports.getIssues = () => {
  if (this.repoList.length > 0) {
    this.repoList.forEach((repo) => {
      if (repo.Active) {
        const octokit = new Octokit({ auth: repo.Auth })
        octokit.paginate('GET /repos/:owner/:repo/issues', {
          baseUrl: repo.BaseUrl,
          owner: repo.Owner,
          repo: repo.Repo
        }).then(issues => {
          issues.forEach((issue) => {
            const owned = issue.user.login === repo.User
            let assigned = false
            assigned = issue.assignee && issue.assignee.login === repo.User ? true : assigned
            issue.assignees.forEach((assignee) => {
              if (assignee.login === repo.User) { assigned = true }
            })
            this.issueList.push({
              stack: `#git-stack-${repo.Owner}-${repo.Repo}`,
              user: repo.User,
              assigned: assigned,
              owned: owned,
              repoId: repo.RepoId,
              issueOjb: issue
            })
          })
          ipcRenderer.send('get-issues')
        })
      }
    })
  }
}

// Track tag list
exports.tagList = ['Issue']

// Add issue(s) to UI
exports.addIssue = (issue) => {
  const mine = this.repoList.find(repo => repo.RepoId === issue.repoId).AssignToMe
  const id = issue.issueOjb.node_id.replace('=', '')
  // Remove existing card instance
  $(`#${id}`).remove()
  if (!mine || (mine && (issue.assigned || issue.owned))) {
    const cd = new Date(issue.issueOjb.created_at)
    const ud = new Date(issue.issueOjb.updated_at)
    const age = Math.floor((Date.now() - ud) / 86400000) + '/' + Math.floor((Date.now() - cd) / 86400000)
    const assigned = issue.issueOjb.assignee ? issue.issueOjb.assignee.login : 'NA'
    // Set card color
    let color = issue.owned ? 3 : 1
    color = issue.assigned ? 2 : color
    // Add issue tags
    let tagHTML = '<div class="tags">Issue</div>'
    if (issue.issueOjb.labels && issue.issueOjb.labels.length > 0) {
      issue.issueOjb.labels.forEach((tag) => {
        tagHTML += `<div class="tags">${tag.name}</div>`
        this.tagList.push(tag.name)
      })
    }
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
    // Generate issue card html
    const issueHtml = `<div class="card color-${color}" id="${id}">
                        <div style="clear: both" id="b${id}" data-toggle="collapse" data-target="#c${id}">
                          <span class="color-glyph fas fa-${colorGlyph}" ${showColorGlyphs}></span>
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
}

// Save taskList to localstorage
exports.saveRepos = () => {
  localStorage.setItem('repoList', JSON.stringify(this.repoList))
}

// Add repo
exports.submitRepo = (repoId) => {
  const url = new URL($(`#surl${repoId}`).val())
  const newRepo = {
    Active: $(`#deactivate-button-${repoId}`).hasClass('check-checked'),
    RepoId: repoId,
    AssignToMe: $(`#satm${repoId}`).hasClass('check-checked'),
    Auth: $(`#sat${repoId}`).val(),
    BaseUrl: url.hostname.toLowerCase().includes('optum') ? 'https://github.optum.com/api/v3' : 'https://api.github.com',
    Owner: url.pathname.split('/')[1],
    Repo: url.pathname.split('/')[2],
    Url: $(`#surl${repoId}`).val(),
    User: $(`#sun${repoId}`).val()
  }
  this.repoList = this.repoList.filter(repo => repo.RepoId !== repoId)
  this.repoList.push(newRepo)
  this.saveRepos()
  this.getIssues()
}

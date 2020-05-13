// Modules and variable definition
const { ipcRenderer, clipboard } = require('electron')
const { Octokit } = require('@octokit/rest')

// Track repo list
exports.repoList = JSON.parse(localStorage.getItem('repoList')) || []

// Track issue list
exports.issueList = []

// Track tag list
exports.tagList = []

// Refresh repo list
exports.refreshRepos = () => {
  this.repoList = JSON.parse(localStorage.getItem('repoList'))
}

// Iterate through repos and call issue service
exports.getIssues = (repoId) => {
  if (repoId) {
    const repo = this.repoList.find(repo => `git-stack-${repo.Owner}-${repo.Repo}` === repoId)
    callIssueService(repo)
  } else if (this.repoList.length > 0) {
    this.repoList.forEach((repo) => {
      callIssueService(repo)
    })
  }
}

// Get issues from repo
const callIssueService = (repo) => {
  if (repo.Active) {
    const repoStack = `git-stack-${repo.Owner}-${repo.Repo}`
    $(`#${repoStack}`).find('.box').children().remove()
    $(`#${repoStack}`).find('.box').append('<div class="no-results getting-results">Getting Issues</div>')
    const octokit = new Octokit({ auth: repo.Auth })
    octokit.paginate('GET /repos/:owner/:repo/issues', {
      baseUrl: repo.BaseUrl,
      owner: repo.Owner,
      repo: repo.Repo
    }).then(issues => {
      this.issueList = this.issueList.filter(val => val.stack !== repoStack)
      issues.forEach((issue) => {
        const owned = issue.user.login === repo.User
        let assigned = false
        assigned = issue.assignee && issue.assignee.login === repo.User ? true : assigned
        issue.assignees.forEach((assignee) => {
          if (assignee.login === repo.User) { assigned = true }
        })
        this.issueList.push({
          stack: `git-stack-${repo.Owner}-${repo.Repo}`,
          user: repo.User,
          assigned: assigned,
          owned: owned,
          repoId: repo.RepoId,
          issueOjb: issue
        })
      })
      ipcRenderer.send('get-issues', repoStack)
    }).catch(err => {
      console.log(err)
      alert('Unable to connect to GitHub')
    })
  }
}

// Add issue(s) to UI
exports.addIssue = (issue) => {
  const mine = this.repoList.find(repo => repo.RepoId === issue.repoId).AssignToMe
  const id = issue.issueOjb.node_id.replace('=', '')
  // Remove existing card instance
  $(`#${id}`).remove()
  if (!mine || (mine && (issue.assigned || issue.owned))) {
    // Get issue dates and calc age
    const cd = new Date(issue.issueOjb.created_at)
    const ud = new Date(issue.issueOjb.updated_at)
    const age = Math.floor((Date.now() - ud) / 86400000) + '/' + Math.floor((Date.now() - cd) / 86400000)
    // Get issue assigne=ment
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
    // Show banded cards $('.card-bar').is(':visible')
    const bandedCards = $('.card-bar').is(':visible') ? '' : 'style="display: none;"'
    const colorCards = $('.card-bar').is(':visible') ? ' color-trans' : ''
    // Generate issue card html
    const issueHtml = `<div class="card color-${color}${colorCards}" id="${id}" data-url="${issue.issueOjb.html_url}">
                        <div class="card-bar color-${color}"${bandedCards}></div>  
                        <div class="card-header" style="clear: both" id="b${id}" data-toggle="collapse" data-target="#c${id}">
                          <span class="color-glyph fas fa-${colorGlyph}" ${showColorGlyphs}></span>
                          <span class="title">#${issue.issueOjb.number} ${issue.issueOjb.title}</span>
                          <span class="aging" id="a${id}" ${showAge}>${age}</span>
                        </div>
                        <div class="card-content collapse collapse-content" id="c${id}">
                          <div class="card-detail" id="d${id}" style="white-space: pre-wrap;" draggable="true" ondragstart="event.preventDefault(); event.stopPropagation();"><a style="color: var(--highlight)" id="l${id}" href="${issue.issueOjb.html_url}">GitHub Link</a><br><b>Created:</b> ${cd.toLocaleDateString()}<br><b>Updated:</b> ${ud.toLocaleDateString()}<br><b>Opened by:</b> ${issue.issueOjb.user.login}<br><b>Assigned to:</b> ${assigned}<br><b>Detail:</b> ${issue.issueOjb.body}</div>
                          <div class="tag-box" id="t${id}">${tagHTML}</div>
                          <div class="card-menu">
                            <div class="card-menu-item fas fa-clipboard" id="copy-button-${id}" data-toggle="tooltip" title="Copy To Clipboard"></div>
                          </div>
                        </div>
                      </div>`
    // Add issue html to host
    $(`#${issue.stack}`).find('.box').append(issueHtml)
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
    // Copy issue details to clipboard
    $(`#copy-button-${id}`).click(() => {
      const cbs = `#${issue.issueOjb.number} ${issue.issueOjb.title}\nLink: ${issue.issueOjb.html_url}\nCreated: ${cd.toLocaleDateString()}\nUpdated: ${ud.toLocaleDateString()}\nOpened by: ${issue.issueOjb.user.login}\nAssigned to: ${assigned}\nDetail: ${issue.issueOjb.body}`
      clipboard.writeText(cbs)
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
    Active: $(`#dar${repoId}`).hasClass('check-checked'),
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

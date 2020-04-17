// Modules and variable definition
const { ipcRenderer, shell, remote } = require('electron')
const settings = require('./settings')
const tasks = require('./tasks')
const git = require('./gitHub')
const fs = require('fs')
require('bootstrap/js/dist/modal')
require('./menu.js')
const customTitlebar = require('custom-electron-titlebar')
const stackPrefix = 'stack-'
let taskType = 'new'
let winMax = false
let updStack = false
let newTagList = []
let match = ''
let desktopPath = ''

// IPC event to get system desktop path
ipcRenderer.on('desktop-path', (e, data) => {
  desktopPath = data
})
// Custom titlebar instantiation
const bg = getComputedStyle(document.documentElement).getPropertyValue('--background1').trim()
// eslint-disable-next-line no-new
const ctb = new customTitlebar.Titlebar({
  backgroundColor: customTitlebar.Color.fromHex(bg),
  icon: './res/moby_icon.png'
})

// Load stacks
getStacks()

// Set intervals for scheduled tasks, update ageing, archive ageing and issue get
// Evaluate for scheduled task
addScheduledTasks()
window.setInterval(addScheduledTasks, 3600000)
// Update task age in UI
tasks.updateTaskAge()
window.setInterval(tasks.updateTaskAge, 3600000)
// Archive off tasks in 'Done' for more than a week
archiveDoneTasks()
window.setInterval(archiveDoneTasks, 3600000)
// Get GitHub issues
git.getIssues()
window.setInterval(git.getIssues, 1000000)

// IPC event when git issues returned; then add to stack
ipcRenderer.on('send-issues', () => {
  git.issueList.forEach(git.addIssue)
  loadTagCloud()
})

// Import settings from local storate and apply
function applySettings () {
  // Set theme
  setTheme(settings.mobySettings.Theme)
  // Toggle Aging
  remote.Menu.getApplicationMenu().getMenuItemById('menu-task-age').checked = settings.mobySettings.Aging
  toggleAge(settings.mobySettings.Aging)
  // Toggle Color Glyphs
  toggleColorGlyphs(settings.mobySettings.ColorGlyphs)
}

// Toggle aging on tasks handler
function toggleAge (check) {
  if (check === true) {
    $('.aging').show()
  } else if (check === false) {
    $('.aging').hide()
  } else {
    ($('.aging').is(':visible')) ? $('.aging').hide() : $('.aging').show()
  }
}

// Toggle color glyphs on tasks handler
function toggleColorGlyphs (check) {
  if (check === true) {
    $('.color-box').hide()
    $('.color-glyph-edit').show()
    $('.color-glyph').show()
  } else if (check === false) {
    $('.color-glyph').hide()
    $('.color-glyph-edit').hide()
    $('.color-box').show()
  } else {
    ($('.color-glyph').is(':visible')) ? $('.color-glyph').hide() : $('.color-glyph').show()
  }
  ipcRenderer.send('glyph-toggle', check)
}

// Stack load; if non defined use default
function getStacks () {
  const stacks = JSON.parse(localStorage.getItem('stackList')) || []
  $('.stack-host').children('.stack, .git-stack').remove()
  let index = 0
  if (stacks.length > 1) {
    $('#task-stack').empty()
    stacks.forEach(stack => {
      buildStack(stack.StackId, stack.StackTitle, index)
      $(new Option(stack.StackTitle, stack.StackId)).appendTo('#task-stack')
      index++
    })
  } else {
    getDefaultStacks()
  }
  if (git.repoList.length > 0) {
    git.repoList.forEach((repo) => {
      if (repo.Active) {
        buildStack(`git-stack-${repo.Owner}-${repo.Repo}`, repo.Repo, index, repo.Url)
        index++
      }
    })
  }
  // Add tasks, issues, tags to the stacks
  tasks.taskList.forEach(tasks.addTask)
  git.issueList.forEach(git.addIssue)
  loadTagCloud()
  applySettings()
}

// Load tag list UI
function loadTagCloud () {
  $('#tag-cloud-box').children('.cloud-tags').remove()
  if (tasks.tagList.length > 0 || git.tagList.length > 0) {
    const utl = [...new Set(tasks.tagList.concat(git.tagList))]
    utl.forEach((tag) => {
      $('#tag-cloud-box').append(`<div class="cloud-tags">${tag}</div>`)
    })
  }
}

// Show tasks with tag
$(document).on('click', '.cloud-tags', (e) => {
  $(e.currentTarget).addClass('cloud-tags-toggled')
  $('.tags').filter(function () {
    return $(this).text() === $(e.currentTarget).text()
  }).closest('.card').addClass('card-tagged').find('.collapse').collapse('show')
})

// Show tasks with tag
$(document).on('contextmenu', '.tags', (e) => {
  $(e.currentTarget).remove()
  tasks.tagList.splice(tasks.tagList.indexOf($(e.currentTarget).text()), 1)
  newTagList.push($(e.currentTarget).text())
})

// Default stack setup
function getDefaultStacks () {
  buildStack(`${stackPrefix}do`, 'Do', 0)
  buildStack(`${stackPrefix}today`, 'Today', 1)
  buildStack(`${stackPrefix}doing`, 'Doing', 2)
  buildStack(`${stackPrefix}done`, 'Done', 3)
  $('#task-stack').empty()
  $(new Option('Do', `${stackPrefix}do`)).appendTo('#task-stack')
  $(new Option('Today', `${stackPrefix}today`)).appendTo('#task-stack')
  $(new Option('Doing', `${stackPrefix}doing`)).appendTo('#task-stack')
  $(new Option('Done', `${stackPrefix}done`)).appendTo('#task-stack')
  saveStacks()
}

// Save stacks to localstorage
function saveStacks () {
  const stacks = []
  $('.stack-header').each(function () {
    if ($(this).closest('.stack').prop('id') && $(this).closest('.stack').prop('id').substring(0, 6) === stackPrefix) {
      const stackData = {
        StackId: $(this).closest('.stack').prop('id'),
        StackTitle: $(this).text()
      }
      stacks.push(stackData)
    }
  })
  localStorage.setItem('stackList', JSON.stringify(stacks))
  $('#task-stack').empty()
  stacks.forEach(stack => {
    $(new Option(stack.StackTitle, stack.StackId)).appendTo('#task-stack')
  })
}

// Build out and insert stacks
function buildStack (id, title, index, url) {
  const isDefault = id.substring(0, 6) === stackPrefix
  const stackClass = isDefault ? 'stack' : 'git-stack'
  const itemType = isDefault ? 'Task' : 'Issue'
  const dragDrop = isDefault ? ' ondrop="drop(event)" ondragover="allowDrop(event)"' : ''
  const addTaskBtn = isDefault ? `" href="#task-modal" data-toggle="modal" data-stack-id="${id}" data-type-id="new"` : ` add-issue" data-url="${url}"`
  let addStackBtn = id === 'stack-do' ? '' : '<div class="stack-add fas fa-caret-square-left" data-toggle="tooltip" title="Insert Stack" onclick="addNewStackClick(event)"></div>'
  addStackBtn = id.substring(0, 9) === 'git-stack' ? `<div class="git-stack-icon fab fa-github" data-toggle="tooltip" title="Source Link" data-url="${url}"></div>` : addStackBtn
  const removeStackBtn = id === 'stack-do' || id === 'stack-done' || !isDefault ? '' : `<div class="dropdown-menu dropdown-menu-sm ddcm" id="context-menu-${id}">
                                                    <a class="dropdown-item" href="#remove-modal" data-toggle="modal">Remove Stack</a>
                                                  </div>`
  const stackHtml = `<div class="${stackClass}" id="${id}" data-stack-index="${index}"${dragDrop}>
                      ${addStackBtn}
                      <div class="header stack-header" contenteditable="${isDefault}" onclick="document.execCommand('selectAll',false,null)" oncontextmenu="event.preventDefault(); event.stopPropagation();">${title}</div>
                      ${removeStackBtn}
                      <div class="box"></div>
                      <span data-toggle="tooltip" title="Add ${itemType}" style="justify-self: right;">
                        <div class="footer fas fa-plus fa-2x${addTaskBtn}></div>
                      <span>
                    </div>`
  $('.stack-host').append(stackHtml)
  $(`#${id}`).on('contextmenu', () => {
    $(`#context-menu-${id}`).css({
      display: 'block',
      position: 'absolute',
      right: '5px',
      left: 'auto',
      top: '5px'
    }).addClass('show').animate({ width: '98px' }, 'fast', 'swing')
  }).click(() => {
    $(`#context-menu-${id}`).removeClass('show').hide().css({ width: '0px' })
  })
  $(`#context-menu-${id} a`).on('mouseleave', () => {
    $(`#context-menu-${id}`).removeClass('show').hide().css({ width: '0px' })
  })
  $('.stack-host').on('mouseleave', () => {
    $(`#context-menu-${id}`).removeClass('show').hide().css({ width: '0px' })
  })
  if (!isDefault) {
    $('#git-button').show()
    if (settings.mobySettings.GhToggle === false) {
      $('#git-button').addClass('menu-item-toggled')
    } else {
      $('.git-stack').hide(0)
    }
  }
}

// Stack add for git issues
$('.add-issue').click((e) => {
  shell.openExternal(`${$(e.currentTarget).data('url')}/issues/new`)
})

// Stack add for git issues
$('.git-stack-icon').click((e) => {
  shell.openExternal($(e.currentTarget).data('url'))
})

// Add new user defined stack
function addNewStack (addIndex) {
  if (!localStorage.getItem('stackList')) {
    saveStacks()
  }
  const stacks = JSON.parse(localStorage.getItem('stackList'))
  const stackData = {
    StackId: `${stackPrefix}${Date.now()}`,
    StackTitle: 'New Stack'
  }
  stacks.splice(addIndex, 0, stackData)
  localStorage.setItem('stackList', JSON.stringify(stacks))
  getStacks()
  $(`#${stackData.StackId}`).find('.stack-header').focus()
  document.execCommand('selectAll', false, null)
}

// Remove existing stack
function loadRemoveModal (removeIndex) {
  if (!localStorage.getItem('stackList')) {
    saveStacks()
  }
  $('#task-stack-new').empty()
  const stacks = JSON.parse(localStorage.getItem('stackList'))
  let i = 0
  if (stacks.length > 1) {
    stacks.forEach(stack => {
      if (i !== removeIndex) {
        $(new Option(stack.StackTitle, stack.StackId)).appendTo('#task-stack-new')
      }
      i++
    })
  }
  $(new Option('Archive', `${stackPrefix}archive`)).appendTo('#task-stack-new')
  $('#remove-modal').modal()
}

// Remove stack logic
function removeStack (removeIndex, newStackId) {
  const stacks = JSON.parse(localStorage.getItem('stackList'))
  tasks.taskList.forEach(task => {
    if (task.TaskStack === stacks[removeIndex].StackId) {
      task.TaskStack = newStackId
    }
  })
  tasks.saveTasks()
  stacks.splice(removeIndex, 1)
  localStorage.setItem('stackList', JSON.stringify(stacks))
  getStacks()
}

// Remove stack modal load event
$('#remove-modal').on('show.bs.modal', (e) => {
  loadRemoveModal($(e.relatedTarget).closest('.stack').data('stack-index'))
  $('#remove-stack-button').data('stack-index', $(e.relatedTarget).closest('.stack').data('stack-index'))
})

// Remove stack event
$('#remove-stack-button').click((e) => {
  $('#remove-modal').modal('hide')
  removeStack($(e.currentTarget).data('stack-index'), $('#task-stack-new').val())
})

// In-line stack title update event
$(document).on('input', '.stack-header', () => {
  updStack = true
})

// In-line stack title update commit event
$(document).on('blur', '.stack-header', function () {
  window.getSelection().removeAllRanges()
  if (updStack) {
    if ($(this).text().trim() === '') {
      let sub = $(this).closest('.stack').prop('id').replace(stackPrefix, '').trim().replace(/^\w/, c => c.toUpperCase())
      if (!Number.isNaN(parseInt(sub))) {
        sub = 'User Stack'
      }
      $(this).text(sub)
    }
    saveStacks()
    updStack = false
  }
})

// In-line stack title update: No enter for you!
$('.stack-header').keypress(function (e) {
  if (e.which === 13) {
    this.blur()
  }
})

// In-line stack title update: No paste for you either!
$('.stack-header').on('paste', (e) => {
  e.preventDefault()
})

// IPC event to get task data from tray window
ipcRenderer.on('quick-data', (e, data) => {
  tasks.taskList.push(data)
  tasks.saveTasks()
  tasks.addTask(data)
})

// Scheduled tasks method
// Schedule logic:
// if in 'schedule' stack && date < now:
// if count > 0 or -1 clone task to today, reduce count (except forever -1) and update start date
// if count of scheduled item is 0, archive it
function addScheduledTasks () {
  if (tasks.taskList.length) {
    tasks.taskList.forEach((item) => {
      if (item.TaskStack === 'stack-schedule' && item.StartDate < Date.now()) {
        tasks.cloneTask(item.TaskId, 'stack-do')
        const i = item.Count > 0 ? item.Count - 1 : item.Count
        if (i === 0) {
          tasks.archiveTask(item.TaskId)
        } else {
          const getTask = tasks.taskList.find(task => task.TaskId === item.TaskId)
          getTask.Count = i
          getTask.StartDate = getTask.StartDate + (86400000 * 7 * getTask.MonthDay)
          tasks.saveTasks()
        }
      }
    })
  }
}

// Move tasks to Archive from Done after 1 week
function archiveDoneTasks () {
  if (tasks.taskList.length) {
    tasks.taskList.forEach((item) => {
      if (item.TaskStack === 'stack-done' && item.StackDate < Date.now() - (86400000 * 7)) {
        tasks.archiveTask(item.TaskId)
      }
    })
  }
}

// Title bar double click event to maximize/restore window
$('.titlebar-drag-region').dblclick(() => {
  maxRestoreWindow()
})

// IPC event to maximize/restore window
function maxRestoreWindow () {
  if (!winMax) {
    ipcRenderer.send('win-max')
    winMax = true
  } else {
    ipcRenderer.send('win-restore')
    winMax = false
  }
}

// Task menu commands; Edit selected task
window.openTaskMenu = (type) => {
  taskType = type
  $('#task-modal').modal('show')
}

// Task menu commands; Archive selected task
window.cloneTaskMenu = () => {
  tasks.cloneTask(window.activeTask)
}

// Task menu commands; Archive selected task
window.archiveTaskMenu = () => {
  tasks.archiveTask(window.activeTask)
}

// Task menu commands; Restore selected task
window.restoreTaskMenu = () => {
  tasks.restoreTask(window.activeTask)
}

// Task menu commands; Expand all tasks
window.expandAllMenu = () => {
  expandAll()
}

// Task menu commands; Collapse all tasks
window.collapseAllMenu = () => {
  collapseAll()
}

// Task menu commands; Toggle age on tasks
window.toggleAgeMenu = () => {
  toggleAge()
}

// Task menu commands; Export all tasks
window.exportTasksMenu = () => {
  tasks.exportTasks()
  // exportStacks()
  // exportRepos()
}

// Task menu commands; Import all tasks
window.importTasksMenu = () => {
  tasks.importTasks()
  loadTagCloud()
}

// Settings menu commands
window.settingsMenu = () => {
  loadSettingsModal()
}

// Theme menu commands
window.setThemeMenu = (themeId) => {
  setTheme(themeId)
  settings.saveSettings(themeId)
}

// Exports all stacks to file to desktop
function exportStacks () {
  const JSONexport = localStorage.getItem('stackList')
  fs.writeFile(`${desktopPath}/moby_stack_export_${Date.now()}.txt`, JSONexport, err => {
    if (err) {
      alert('An error occured during the export ' + err.message)
      return
    }
    alert('The export has completed succesfully and is located on your desktop')
  })
}

// Exports all repos to file to desktop
function exportRepos () {
  if (git.repoList.length) {
    const JSONexport = JSON.stringify(git.repoList)
    fs.writeFile(`${desktopPath}/moby_repo_export_${Date.now()}.txt`, JSONexport, err => {
      if (err) {
        alert('An error occured during the export ' + err.message)
        return
      }
      alert('The export has completed succesfully and is located on your desktop')
    })
  } else {
    alert('Nothing to export')
  }
}

// Set theme
function setTheme (themeId) {
  $('.css-theme').prop('disabled', true)
  $(`#${themeId}`).prop('disabled', false)
  if ($(`#${themeId}`).data('img') === 'happy') {
    $('#moby-bg-img').prop('src', 'res/moby_bg_steve.png')
  } else {
    $('#moby-bg-img').prop('src', 'res/moby_bg.png')
  }
  updateTitileBar()
  ipcRenderer.send('theme-change', themeId)
}

// Update TitleBar bakground color on theme change
function updateTitileBar () {
  const nbg = getComputedStyle(document.documentElement).getPropertyValue('--background1').trim()
  ctb.updateBackground(customTitlebar.Color.fromHex(nbg))
}

// Task modal load event
$('#task-modal').on('show.bs.modal', (e) => {
  const type = $(e.relatedTarget).data('type-id') ? $(e.relatedTarget).data('type-id') : taskType
  const stack = $(e.relatedTarget).data('stack-id') ? $(e.relatedTarget).data('stack-id') : 'stack-do'
  loadTaskModal(type, stack)
})

// Task modal load function; recieves new vs edit
function loadTaskModal (type, stack) {
  taskType = type
  newTagList = [...new Set(tasks.tagList)]
  $('#schedule-modal').modal('hide')
  $('#restore-modal').modal('hide')
  $('#collapse-sched').collapse('hide')
  $('#task-detail').height('46px')
  $('#color-option-1').closest('.btn').button('toggle')
  $('#tag-edit-box').children().remove()
  $('#subtask-edit-box').children().remove()
  $('#task-stack option[value="stack-archive"]').remove()
  if (type === 'new') {
    $('#task-modal-title').html('New Task')
    $('form').get(0).reset()
    $('#task-stack').val(stack)
    const dt = new Date(Date.now())
    $('#start-date').val(dt.getMonth() + 1 + '/' + dt.getDate() + '/' + dt.getFullYear())
    enableRecur()
  } else {
    $('#task-modal-title').html('Edit Task')
    const getTask = tasks.taskList.find(task => task.TaskId === window.activeTask)
    $('#task-title').val(getTask.TaskTitle)
    $('#task-detail').val(getTask.TaskDetail)
    if (getTask.TaskStack === 'stack-archive') {
      $(new Option('Archive', 'stack-archive')).appendTo('#task-stack')
    } else if (getTask.TaskStack === 'stack-schedule') {
      getTask.TaskStack = 'stack-do'
    }
    $('#task-stack').val(getTask.TaskStack)
    $(`#color-option-${getTask.TaskColor}`).closest('.btn').button('toggle')
    let tagHTML = ''
    if (getTask.Tags && getTask.Tags.length > 0) {
      getTask.Tags.forEach((tag) => {
        tagHTML += `<div class="tags">${tag}</div>`
        newTagList = newTagList.filter(t => t !== tag)
      })
    }
    $('#tag-edit-box').append(tagHTML)
    let subtaskHTML = ''
    if (getTask.Subtasks && getTask.Subtasks.length > 0) {
      getTask.Subtasks.forEach((subtask) => {
        const checked = subtask.Checked === true ? 'fa-check-square check-checked' : 'fa-square check-unchecked'
        subtaskHTML += `<div class="check-modal-host" id="${subtask.SubtaskId}">
                          <div class="fas check-checkbox ${checked}"></div>
                          <label class="check-label" contenteditable="true">${subtask.Text}</label>
                        </div>`
      })
    }
    $('#subtask-edit-box').append(subtaskHTML)
    $('#count-select').val(getTask.Count)
    const dt = new Date(getTask.StartDate)
    $('#start-date').val(dt.getMonth() + 1 + '/' + dt.getDate() + '/' + dt.getFullYear())
    if (getTask.weekDay) {
      $('#check-sun').prop('checked', getTask.WeekDay.includes(0))
      $('#check-mon').prop('checked', getTask.WeekDay.includes(1))
      $('#check-tue').prop('checked', getTask.WeekDay.includes(2))
      $('#check-wed').prop('checked', getTask.WeekDay.includes(3))
      $('#check-thu').prop('checked', getTask.WeekDay.includes(4))
      $('#check-fri').prop('checked', getTask.WeekDay.includes(5))
      $('#check-sat').prop('checked', getTask.WeekDay.includes(6))
    }
    $(`input[name=radio-recur][value=${getTask.MonthDay}]`).prop('checked', true)
    enableRecur(!$('#radio-once').is(':checked'))
  }
}

// Focus title field on modal 'shown'
$('#task-modal').on('shown.bs.modal', () => {
  $('#task-title').focus()
})

// Reload tag cloud on 'hide'
$('#task-modal').on('hide.bs.modal', () => {
  loadTagCloud()
})

// Size task detail on input
$('#task-detail').on('input keydown', function () {
  if (this.scrollHeight > $('#task-detail').height() + 12) {
    $(this).height(this.scrollHeight + 'px')
  }
})

// Size task detail on focus
$('#task-detail').on('focus mouseenter', function () {
  if (this.scrollHeight > $('#task-detail').height() + 12) {
    $(this).animate({ height: this.scrollHeight + 'px' }, 'fast')
  }
})

// Double clikc on card opens edit modal
$('.card').dblclick((e) => {
  $(e.currentTarget).find('#edit-button').click()
})

// Recurrence elements enable logic
function enableRecur (enable) {
  if (enable) {
    $('#choose-days').show()
    $('#count-select').show()
    $('#recur-count').show()
  } else {
    $('#choose-days').hide()
    $('#count-select').val(1).hide()
    $(':checkbox').prop('checked', false)
    $('#recur-count').hide()
  }
}

// Active radio button change events
$('#radio-weekly, #radio-biWeekly, #radio-triWeekly, #radio-monthly').click(() => {
  enableRecur(true)
})

$('#radio-once').click(() => {
  enableRecur()
})

// Task modal submit event
$('#submit-button').click(() => {
  tasks.submitTask(taskType)
  $('#task-modal').modal('hide')
})

// Execute task modal submit on enter except when in detail field
$('#task-modal').keypress((e) => {
  if (e.which === 13 && !$('#task-detail').is(':focus')) {
    $('#submit-button').click()
  }
})

// Restore archived task to 'Do' column
$('#restore-button').click(() => {
  tasks.restoreTask(window.activeTask)
  $('#restore-modal').modal('hide')
})

// Deselect task
$('.click-area').click(() => {
  $('.window-title').text('Moby')
  $('.card').removeClass('card-selected')
  window.activeTask = null
})

// Task color toggle task show
function toggleColor (colorId) {
  if ($(`#color-${colorId}-button`).hasClass(`color-pick-${colorId}`)) {
    $(`#color-${colorId}-button`).removeClass(`color-pick-${colorId}`)
    $(`.color-${colorId}`).hide()
  } else {
    $(`#color-${colorId}-button`).addClass(`color-pick-${colorId}`)
    $(`.color-${colorId}`).show()
  }
}

// Expand all tasks event
const expandAll = () => {
  $('.collapse').collapse('show')
}

// Collapse all tasks event
const collapseAll = () => {
  $('.collapse').collapse('hide')
}

// Autofill, autosize new tag
$(document).on('keyup', '.new-tags', function (e) {
  if (e.keyCode === 8) {
    return
  }
  const caret = this.selectionStart
  match = ''
  newTagList.forEach(tag => {
    if ($(this).val().substring(0, caret).toLowerCase() === tag.substring(0, caret).toLowerCase()) {
      $(this).val($(this).val().substring(0, caret) + tag.substring(caret, tag.length))
      match = tag
    }
  })
  this.setSelectionRange(caret, $(this).val().length)
  this.cols = $(this).val().length + 1
})

// Fill tag on tab or enter with matched tag
$('#tag-edit-box').keydown(function (e) {
  if (e.keyCode === 9 || e.keyCode === 13) {
    $('#tag-edit-box').children().last('.new-tags').val(match)
    newTagList = newTagList.filter(t => t !== match)
  }
})

// Add new tag even from Task Modal
// eslint-disable-next-line no-unused-vars
const addNewTag = () => {
  $('#tag-edit-box').append('<textarea class="new-tags" rows="1" wrap="false">New Tag</textarea>')
  $('#tag-edit-box').children().last().focus().select().prop('cols', $('#tag-edit-box').children().last().val().length)
}

// Toggle tag cloud
// eslint-disable-next-line no-unused-vars
const toggleTags = () => {
  if ($('.tag-cloud').is(':visible')) {
    $('.tag-cloud').animate({ width: '0px' }, 'fast').hide(0)
    $('.card').removeClass('card-tagged')
    $('.cloud-tags').removeClass('cloud-tags-toggled')
    $('#tags-button').removeClass('menu-item-toggled')
  } else {
    $('.tag-cloud').show().animate({ width: '105px' }, 'fast')
    $('#tags-button').addClass('menu-item-toggled')
  }
}

// Toggle tag cloud
// eslint-disable-next-line no-unused-vars
const toggleIssues = () => {
  if ($('.git-stack').is(':visible')) {
    $('.stack').show()
    $('.git-stack').hide(0)
    $('#git-button').removeClass('menu-item-toggled')
  } else {
    if (settings.mobySettings.GhToggle === true) {
      $('.stack').hide(0)
      $('#stack-archive').show()
      $('#stack-schedule').show()
    }
    $('.git-stack').show()
    $('#git-button').addClass('menu-item-toggled')
  }
}

// IPC event to get update tag cloud on task delete
ipcRenderer.on('update-tags', () => {
  loadTagCloud()
})

// Add new subtask event
// eslint-disable-next-line no-unused-vars
const addNewSubtask = () => {
  const newSubtask = `<div class="check-modal-host">
                        <div class="fas fa-square check-unchecked check-checkbox"></div>
                        <label class="check-label" contenteditable="true">New Subtask</label>
                      </div>`
  $('#subtask-edit-box').append(newSubtask)
  $('#subtask-edit-box').children().last().children('label').last().focus()
  document.execCommand('selectAll', false, null)
}

// Subtask remove in edit modal
$(document).on('contextmenu', '.check-checkbox', (e) => {
  $(e.currentTarget).closest('.check-modal-host').remove()
})

// Subtask css class and array update
function setSubtaskCheck (element) {
  tasks.updateSubtaskCheck(element.closest('.card').prop('id'), element.parent().prop('id'), element.hasClass('check-checked'))
}

function toggleCheck (element, check) {
  if (check === true) {
    element.removeClass('fa-square check-unchecked').addClass('fa-check-square check-checked')
  } else if (check === false) {
    element.removeClass('fa-check-square check-checked').addClass('fa-square check-unchecked')
  } else {
    element.hasClass('check-unchecked') ? element.removeClass('fa-square check-unchecked').addClass('fa-check-square check-checked') : element.removeClass('fa-check-square check-checked').addClass('fa-square check-unchecked')
  }
}

// Checkbox click handler
$(document).on('click', '.check-checkbox', (e) => {
  toggleCheck($(e.currentTarget))
})

// Checkbox label click handler
$(document).on('click', '.check-label', (e) => {
  toggleCheck($(e.currentTarget).parent('.check-host, .repo-check').find('.check-checkbox'))
})

// Subtask checkbox click handler
$(document).on('click', '.check-card-checkbox', (e) => {
  setSubtaskCheck($(e.currentTarget))
})

// Subtask checkbox label click handler
$(document).on('click', '.check-card-label', (e) => {
  setSubtaskCheck($(e.currentTarget).parent('.check-host').find('.check-checkbox'))
})

// Add new stack event
// eslint-disable-next-line no-unused-vars
const addNewStackClick = (e) => {
  $(e.currentTarget).tooltip('hide')
  addNewStack($(e.currentTarget).closest('.stack').data('stack-index'))
}

const buildRepoItem = (repo) => {
  const repoTitle = repo ? repo.Repo : 'New Repo'
  const repoUrl = repo ? repo.Url : ''
  const repoUser = repo ? repo.User : ''
  const repoAuth = repo ? repo.Auth : ''
  const repoId = repo ? repo.RepoId : Date.now()
  const repoActive = repo ? repo.Active : true
  const repoActiveCheck = repoActive ? 'fa-check-square check-checked' : 'fa-square check-unchecked'
  const repoAssigned = repo && repo.AssignToMe === true ? 'fa-check-square check-checked' : 'fa-square check-unchecked'
  const repoItem = `<div class="github-repo" data-repo-id="${repoId}">
                      <div class="repo-menu">
                        <div class="repo-menu-item-delete fas fa-minus-square" id="delete-button-${repoId}" data-toggle="tooltip" title="Delete Repo"></div>
                        <div class="repo-menu-item-clone fas fa-clone" id="clone-button-${repoId}" data-toggle="tooltip" title="Clone Repo"></div>
                      </div>
                      <div class="check-modal-host repo-check">
                        <div class="repo-menu-item-deactivate fas ${repoActiveCheck} check-checkbox" id="deactivate-button-${repoId}" data-toggle="tooltip" title="Active"></div>
                        <div class="check-label">${repoTitle}</div>
                      </div>
                      <div>
                        <small class="left-margin">GitHub URL</small>
                        <input class="form-control form-control-sm text-box repo-edit" id="surl${repoId}" placeholder="Enter GitHub URL" value="${repoUrl}">
                        <small class="text-muted left-margin">This is the home location of the repo</small>
                      </div>
                      <div class="form-row">
                        <div class="form-group col-md-4">
                          <small class="left-margin">User Name</small>
                          <input class="form-control form-control-sm text-box repo-edit" id="sun${repoId}" placeholder="Enter User Name" value="${repoUser}">
                          <small class="text-muted left-margin">Your user name on this GitHub instance</small>
                        </div>
                        <div class="form-group col-md-8">
                          <small class="left-margin">Personal Access Token</small>
                          <input class="form-control form-control-sm text-box repo-edit" id="sat${repoId}" placeholder="Enter Token" value="${repoAuth}">
                          <small class="text-muted left-margin">Not required but you may be throttled. Click here to obtain one</small>
                        </div>
                      </div>
                      <div class="form-row left-margin" style="margin-top: -10px;">
                        <div class="check-modal-host repo-check">
                          <small class="fas ${repoAssigned} check-checkbox" id="satm${repoId}"></small>
                          <small class="check-label small-check">Assigned to or Opened by me</small>
                          <small class="text-muted check-description">Checked will only show issues that have been assigned to or opened by you</small>
                        </div>
                      </div>
                    </div>`
  $(function () {
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 1500, hide: 100 } })
  })
  return repoItem
}

// Clone repo
$(document).on('click', '.repo-menu-item-clone', (e) => {
  const newRepo = git.repoList.find(repo => repo.RepoId === $(e.currentTarget).closest('.github-repo').data('repo-id'))
  newRepo.RepoId = Date.now()
  $('#settings-github-repos').append(buildRepoItem(newRepo))
  $('.modal-body').animate({ scrollTop: $(document).height() }, 'fast')
})

// Load Settings modal
function loadSettingsModal () {
  repoChange = false
  // Set check states on settings modal
  toggleCheck($('#settings-glyphs'), settings.mobySettings.ColorGlyphs)
  toggleCheck($('#settings-dblclick'), settings.mobySettings.DblClick)
  toggleCheck($('#settings-github-toggle'), settings.mobySettings.GhToggle)
  toggleCheck($('#settings-aging'), settings.mobySettings.Aging)
  // Reload repos
  $('#settings-github-repos').children().remove()
  $('#collapse-general, #collapse-github, #collapse-rally, #collapse-serviceNow').collapse('hide')
  let gitHubRepo = ''
  git.repoList.forEach((repo) => {
    gitHubRepo += buildRepoItem(repo)
  })
  $('#settings-github-repos').append(gitHubRepo)
  $('#settings-modal').modal('show')
}

// Track for changes in repo entries
let repoChange = false
$(document).on('change', '.repo-edit', (e) => {
  repoChange = true
  $(e.currentTarget).addClass('input-change')
})
$(document).on('click', '.repo-check', (e) => {
  repoChange = true
})

// Assigned to me checkbox click handler
$(document).on('click', '.check-card-checkbox', (e) => {
  repoChange = true
})

// Assigned to me checkbox label click handler
$(document).on('click', '.check-card-label', (e) => {
  repoChange = true
})

// Deactivate repo
$(document).on('click', '.repo-menu-item-deactivate', (e) => {
  repoChange = true
})

// Deactivate repo
$(document).on('click', '.repo-menu-item-delete', (e) => {
  $(e.currentTarget).closest('.github-repo').remove()
  repoChange = true
})

// Save changes button click handler
$('#settings-button').click(() => {
  $('#settings-modal').modal('hide')
  // save general settings
  settings.saveSettings()
  // activate settings
  toggleColorGlyphs(settings.mobySettings.ColorGlyphs)
  // add/update repos
  if (repoChange) {
    git.repoList = []
    $('.github-repo').each(function () {
      git.submitRepo($(this).data('repo-id'))
    })
    getStacks()
  }
})

// Add new GitHub repo
// eslint-disable-next-line no-unused-vars
const addNewGitHub = () => {
  $('#settings-github-repos').append(buildRepoItem)
  $('.modal-body').animate({ scrollTop: $(document).height() }, 'fast')
}

// Color toggle event
// eslint-disable-next-line no-unused-vars
const toggleColorClick = (e) => {
  toggleColor($(e.currentTarget).data('color-id'))
}

// Completely close app
// eslint-disable-next-line no-unused-vars
const exit = () => {
  const remote = require('electron').remote
  remote.app.exit()
}

// Task drag and drop events
// eslint-disable-next-line no-unused-vars
const allowDrop = (e) => {
  e.preventDefault()
}

// eslint-disable-next-line no-unused-vars
const drag = (e) => {
  e.dataTransfer.setData('text', e.target.id)
}

// eslint-disable-next-line no-unused-vars
const drop = (e) => {
  e.preventDefault()
  const data = e.dataTransfer.getData('text')
  if ($(e.target).hasClass('box')) {
    $(e.target).append($(`#${data}`))
  } else if ($(e.target).hasClass('stack')) {
    $(e.target).find('.box').append($(`#${data}`))
  } else {
    $(e.target).closest('.box').append($(`#${data}`))
  }
  tasks.updateTaskStack(data, $(e.target).closest('.stack').prop('id'))
  tasks.updateTaskAge(data)
}

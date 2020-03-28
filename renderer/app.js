// Modules and variable definition
const { ipcRenderer } = require('electron')
const tasks = require('./tasks')
const git = require('./gitHub.js')
require('bootstrap/js/dist/modal')
require('./menu.js')
const customTitlebar = require('custom-electron-titlebar')
const stackPrefix = 'stack-'
let taskType = 'new'
let winMax = false
let updStack = false
let newTagList = []
let match = ''

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
// Get gitHub issues
git.getIssues()
window.setInterval(git.getIssues, 1000000)

// IPC event when git issues returned; then add to stack
ipcRenderer.on('send-issues', (e, stack) => {
  git.issueList.forEach(git.addIssue)
  loadTagCloud()
})

// Went and changed the model and need to fix it function
function updateStackkListModel () {
  const rl = localStorage.getItem('stackList') || null
  if (rl) {
    const tl = JSON.parse(rl.replace(/stackId/g, 'StackId').replace(/stackTitle/g, 'StackTitle')) || []
    localStorage.setItem('stackList', JSON.stringify(tl))
    return tl
  }
  return []
}

// Stack load; if non defined use default
function getStacks () {
  updateStackkListModel()
  const stacks = JSON.parse(localStorage.getItem('stackList')) || []
  $('.stack-host').children('.stack').remove()
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
      buildStack(`stack-${repo.owner}-${repo.repo}`, repo.repo, index)
      index++
    })
  }
  // Add tasks, issues, tags to the stacks
  tasks.taskList.forEach(tasks.addTask)
  git.issueList.forEach(git.addIssue)
  loadTagCloud()
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
    const stackData = {
      StackId: $(this).closest('.stack').prop('id'),
      StackTitle: $(this).text()
    }
    stacks.push(stackData)
  })
  localStorage.setItem('stackList', JSON.stringify(stacks))
  $('#task-stack').empty()
  stacks.forEach(stack => {
    $(new Option(stack.StackTitle, stack.StackId)).appendTo('#task-stack')
  })
}

// Build out and insert stacks
function buildStack (id, title, index) {
  // TODO: Check if ID exists
  const addStackBtn = id === 'stack-do' ? '' : '<div class="stack-add fas fa-caret-square-left" data-toggle="tooltip" title="Insert Stack" onclick="addNewStackClick(event)"></div>'
  const removeStackBtn = id === 'stack-do' || id === 'stack-done' ? '' : `<div class="dropdown-menu dropdown-menu-sm ddcm" id="context-menu-${id}">
                                                    <a class="dropdown-item" href="#remove-modal" data-toggle="modal">Remove Stack</a>
                                                  </div>`
  const stackHtml = `<div class="stack" id="${id}" data-stack-index="${index}" ondrop="drop(event)" ondragover="allowDrop(event)">
                      ${addStackBtn}
                      <div class="header stack-header" contenteditable="true" onclick="document.execCommand('selectAll',false,null)" oncontextmenu="event.preventDefault(); event.stopPropagation();">${title}</div>
                      ${removeStackBtn}
                      <div class="box"></div>
                      <div class="footer fas fa-plus fa-2x" href="#task-modal" data-toggle="modal" data-stack-id="${id}" data-type-id="new"></div>
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
}

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
        // TODO: add flag for delete on archive
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
}

// Task menu commands; Import all tasks
window.importTasksMenu = () => {
  tasks.importTasks()
  loadTagCloud() // TODO: this doesn't work
}

// Theme menu commands
window.setThemeMenu = (themeId) => {
  setTheme(themeId)
}

// Set theme
function setTheme (themeId) {
  $('#default, #dark, #light, #steve').prop('disabled', true)
  $(`#${themeId}`).prop('disabled', false)
  if (themeId === 'steve') {
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
    $('#choose-days').prop('disabled', true)
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
        const checked = subtask.Checked === true ? 'fa-check-square subtask-checked' : 'fa-square subtask-unchecked'
        subtaskHTML += `<div class="subtask-edit-host" id="${subtask.SubtaskId}">
                          <div class="fas subtask-checkbox ${checked}"></div>
                          <label class="subtask-label" contenteditable="true">${subtask.Text}</label>
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

// Recurrence elements enable logic
function enableRecur () {
  $('#choose-days').prop('disabled', false)
  $('#count-select').prop('disabled', false)
  $('#recur-count').removeClass('disabled-form-label')
}

// Active radio button change events
$('#radio-weekly, #radio-biWeekly, #radio-triWeekly, #radio-monthly').click(() => {
  enableRecur()
})

$('#radio-once').click(() => {
  $('#choose-days').prop('disabled', true)
  $('#count-select').val(1).prop('disabled', true)
  $(':checkbox').prop('checked', false)
  $('#recur-count').addClass('disabled-form-label')
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

// Toggle aging on tasks event
const toggleAge = () => {
  if ($('.aging').is(':visible')) {
    $('.aging').hide()
  } else {
    $('.aging').show()
  }
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
  } else {
    $('.tag-cloud').show().animate({ width: '105px' }, 'fast')
  }
}

// IPC event to get update tag cloud on task delete
ipcRenderer.on('update-tags', () => {
  loadTagCloud()
})

// Add new subtask event
// eslint-disable-next-line no-unused-vars
const addNewSubtask = () => {
  const newSubtask = `<div class="subtask-edit-host">
                        <div class="fas fa-square subtask-checkbox subtask-unchecked"></div>
                        <label class="subtask-label" contenteditable="true">New Subtask</label>
                      </div>`
  $('#subtask-edit-box').append(newSubtask)
  $('#subtask-edit-box').children().last().children('label').last().focus()
  document.execCommand('selectAll', false, null)
}

// Subtask remove in edit modal
$(document).on('contextmenu', '.subtask-checkbox', (e) => {
  $(e.currentTarget).closest('.subtask-edit-host').remove()
})

// Subtask css class and array update
function setSubtaskCheck (element) {
  element.hasClass('subtask-unchecked') ? element.removeClass('fa-square subtask-unchecked').addClass('fa-check-square subtask-checked') : element.removeClass('fa-check-square subtask-checked').addClass('fa-square subtask-unchecked')
  tasks.updateSubtaskCheck(element.closest('.card').prop('id'), element.parent().prop('id'), element.hasClass('subtask-checked'))
}

// Subtask checkbox click handler
$(document).on('click', '.subtask-checkbox', (e) => {
  setSubtaskCheck($(e.currentTarget))
})

// Subtask label click handler
$(document).on('click', '.subtask-label', (e) => {
  setSubtaskCheck($(e.currentTarget).parent('.subtask-host').find('.subtask-checkbox'))
})

// Add new stack event
// eslint-disable-next-line no-unused-vars
const addNewStackClick = (e) => {
  $(e.currentTarget).tooltip('hide')
  addNewStack($(e.currentTarget).closest('.stack').data('stack-index'))
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

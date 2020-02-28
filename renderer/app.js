/* global activeTask */
// Modules and variable definition
const { ipcRenderer } = require('electron')
const tasks = require('./tasks')
require('bootstrap/js/dist/modal')
require('./menu.js')
const customTitlebar = require('custom-electron-titlebar')
const stackPrefix = 'stack-'
let taskType = 'new'
let winMax = false
let updStack = false

// Custom titlebar instantiation
const bg = getComputedStyle(document.documentElement).getPropertyValue('--background1').trim()
// eslint-disable-next-line no-new
new customTitlebar.Titlebar({
  backgroundColor: customTitlebar.Color.fromHex(bg),
  icon: './res/moby_icon.png'
})

// Load stacks
getStacks()

// Evaluate for scheduled task
addScheduledTasks()

// Archive off tasks in 'Done' for more than a week
archiveDoneTasks()

// Update task age in UI
tasks.updateTaskAge()

// Set intervals for scheduled tasks, update ageing, archive ageing
window.setInterval(addScheduledTasks, 3600000)
window.setInterval(tasks.updateTaskAge, 3600000)
window.setInterval(archiveDoneTasks, 3600000)

// Stack load; if non defined use default
function getStacks () {
  var stacks = JSON.parse(localStorage.getItem('stackList')) || []
  $('#task-status').empty()
  $('.stack-host').children('.stack').remove()
  let index = 1
  if (stacks.length > 1) {
    stacks.forEach(stack => {
      buildStack(stack.stackId, stack.stackTitle, index)
      $(new Option(stack.stackTitle, stack.stackId)).appendTo('#task-status')
      index++
    })
  } else {
    buildStack(`${stackPrefix}do`, 'Do', 1)
    buildStack(`${stackPrefix}today`, 'Today', 2)
    buildStack(`${stackPrefix}doing`, 'Doing', 3)
    buildStack(`${stackPrefix}done`, 'Done', 4)
    $(new Option('Do', `${stackPrefix}do`)).appendTo('#task-status')
    $(new Option('Today', `${stackPrefix}today`)).appendTo('#task-status')
    $(new Option('Doing', `${stackPrefix}doing`)).appendTo('#task-status')
    $(new Option('Done', `${stackPrefix}done`)).appendTo('#task-status')
  }
  // Add tasks to the stacks
  tasks.taskList.forEach(tasks.addTask)
}

// Save stacks to localstorage
function saveStacks () {
  var stacks = []
  $('.th').each(function () {
    var stackData = {
      stackId: $(this).closest('.stack').prop('id'),
      stackTitle: $(this).text()
    }
    stacks.push(stackData)
  })
  localStorage.setItem('stackList', JSON.stringify(stacks))
  $('#task-status').empty()
  stacks.forEach(stack => {
    $(new Option(stack.stackTitle, stack.stackId)).appendTo('#task-status')
  })
}

// Build out and insert stacks
function buildStack (id, title, index) {
  const addStackBtn = id === `${stackPrefix}done` ? '' : '<div class="stack-add fas fa-caret-square-right" data-toggle="tooltip" title="Insert Stack" onclick="addNewStackClick(event)"></div>'
  const stackHtml = `<div class="stack" id="${id}" data-stack-index="${index}" ondrop="drop(event)" ondragover="allowDrop(event)">
                      <div class="dropdown-menu dropdown-menu-sm ddcm" id="context-menu-${id}">
                        <a class="dropdown-item" href="#remove-modal" data-toggle="modal">Remove Stack</a>
                      </div>
                      <div class="header th" contenteditable="true">${title}</div>
                      ${addStackBtn}
                      <div class="box"></div>
                      <div class="footer fas fa-plus fa-2x" href="#task-modal" data-toggle="modal" data-status-id="${id}" data-type-id="new"></div>
                    </div>`
  $('.stack-host').append(stackHtml)
  $(`#${id}`).on('contextmenu', function (e) {
    $(`#context-menu-${id}`).css({
      display: 'block',
      position: 'absolute',
      left: '5px',
      top: '5px'
    }).addClass('show')
  }).click(() => {
    $(`#context-menu-${id}`).removeClass('show').hide()
  })
  $(`#context-menu-${id} a`).on('mouseleave', function () {
    $(this).parent().removeClass('show').hide()
  })
  $('.stack-host').on('mouseleave', () => {
    $(`#context-menu-${id}`).removeClass('show').hide()
  })
}

// Add new user defined stack
function addNewStack (addIndex) {
  if (!localStorage.getItem('stackList')) {
    saveStacks()
  }
  var stacks = JSON.parse(localStorage.getItem('stackList'))
  var stackData = {
    stackId: `${stackPrefix}${Date.now()}`,
    stackTitle: 'New Stack'
  }
  stacks.splice(addIndex, 0, stackData)
  localStorage.setItem('stackList', JSON.stringify(stacks))
  getStacks()
  $(`#${stackData.stackId}`).find('.th').focus()
}

// Remove existing stack
function loadRemoveModal (removeIndex) {
  if (!localStorage.getItem('stackList')) {
    saveStacks()
  }
  $('#stack-task-status').empty()
  var stacks = JSON.parse(localStorage.getItem('stackList'))
  var i = 1
  if (stacks.length > 1) {
    stacks.forEach(stack => {
      if (i !== removeIndex) {
        $(new Option(stack.stackTitle, stack.stackId)).appendTo('#stack-task-status')
      }
      i++
    })
  }
  $(new Option('Archive', `${stackPrefix}archive`)).appendTo('#stack-task-status')
  $('#remove-modal').modal()
}

// Remove stack logic
function removeStack (removeIndex, newStackId) {
  var stacks = JSON.parse(localStorage.getItem('stackList'))
  tasks.taskList.forEach(task => {
    if (task.TaskStatus === stacks[removeIndex - 1].stackId) {
      task.TaskStatus = newStackId
    }
  })
  tasks.saveTasks()
  stacks.splice(removeIndex - 1, 1)
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
  removeStack($(e.currentTarget).data('stack-index'), $('#stack-task-status').val())
})

// In-line stack title update event
$(document).on('input', '.th', () => {
  updStack = true
})

// In-line stack title update commit event
$(document).on('blur', '.th', function () {
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
$('.th').keypress(function (e) {
  if (e.which === 13) {
    this.blur()
  }
})

// In-line stack title update: No paste for you either!
$('.th').on('paste', (e) => {
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
// if in 'schedule' status && date < now:
// if count > 0 or -1 clone task to today, reduce count (except forever -1) and update start date
// if count of scheduled item is 0, archive it
function addScheduledTasks () {
  if (tasks.taskList.length) {
    tasks.taskList.forEach((item) => {
      if (item.TaskStatus === 'schedule' && item.StartDate < Date.now()) {
        tasks.cloneTask(item.TaskId, 'today')
        var i = item.Count > 0 ? item.Count - 1 : item.Count
        if (i === 0) {
          this.archiveTask(item.TaskId)
        } else {
          var getTask = tasks.taskList.find(task => parseInt(task.TaskId) === parseInt(item.TaskId))
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
      if (item.TaskStatus === 'stack-done' && item.StatusDate < Date.now() - (86400000 * 7)) {
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
  tasks.cloneTask(activeTask)
}

// Task menu commands; Archive selected task
window.archiveTaskMenu = () => {
  tasks.archiveTask(activeTask)
}

// Task menu commands; Restore selected task
window.restoreTaskMenu = () => {
  tasks.restoreTask(activeTask)
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
}

// Task modal load event
$('#task-modal').on('show.bs.modal', (e) => {
  var type = $(e.relatedTarget).data('type-id') ? $(e.relatedTarget).data('type-id') : taskType
  var status = $(e.relatedTarget).data('status-id') ? $(e.relatedTarget).data('status-id') : 'stack-do'
  loadTaskModal(type, status)
})

// Task modal load function; recieves new vs edit
function loadTaskModal (type, status) {
  taskType = type
  $('#schedule-modal').modal('hide')
  $('#restore-modal').modal('hide')
  $('#collapse-sched').collapse('hide')
  $('#task-detail').height('46px')
  if (type === 'new') {
    $('#task-modal-title').html('New Task')
    $('form').get(0).reset()
    $('#task-status').val(status)
    $('#choose-days').prop('disabled', true)
  } else {
    $('#task-modal-title').html('Edit Task')
    const getTask = tasks.taskList.find(task => parseInt(task.TaskId) === parseInt(activeTask))
    $('#task-title').val(getTask.TaskTitle)
    $('#task-detail').val(getTask.TaskDetail)
    $('#task-status').val(getTask.TaskStatus)
    // $('#task-status').val(getTask.TaskStatus.replace(/^\w/, c => c.toUpperCase()))
    $(`#option-${getTask.TaskTheme}`)
      .closest('.btn')
      .button('toggle')
    $('#count-select').val(getTask.Count)
    var dt = new Date(getTask.StartDate)
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
  $('#count-select').val(1)
  $('#count-select').prop('disabled', true)
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
  tasks.restoreTask(activeTask)
  $('#restore-modal').modal('hide')
})

// Export task event
$('#export-button').click(() => {
  tasks.exportTasks()
})

// Import task event
$('#import-button').click(() => {
  tasks.importTasks()
})

// Deselect task
$('.click-area').click(() => {
  $('.window-title').text('Moby')
  $('.card').removeClass('card-selected')
  window.activeTask = null
})

// Theme toggle task show
function toggleTheme (themeId) {
  if ($(`#theme${themeId}-button`).hasClass(`color-${themeId}`)) {
    $(`#theme${themeId}-button`).removeClass(`color-${themeId}`)
    $(`.theme-${themeId}`).hide()
  } else {
    $(`#theme${themeId}-button`).addClass(`color-${themeId}`)
    $(`.theme-${themeId}`).show()
  }
}

// Expand all tasks event
const expandAll = (e) => {
  $('.collapse').collapse('show')
}

// Collapse all tasks event
const collapseAll = (e) => {
  $('.collapse').collapse('hide')
}

// Toggle aging on tasks event
const toggleAge = (e) => {
  if ($('.aging').is(':visible')) {
    $('.aging').hide()
  } else {
    $('.aging').show()
  }
}

// Add new stack event
// eslint-disable-next-line no-unused-vars
const addNewStackClick = (e) => {
  $(e.currentTarget).tooltip('hide')
  addNewStack($(e.currentTarget).closest('.stack').data('stack-index'))
}

// Theme toggle event
// eslint-disable-next-line no-unused-vars
const toggleThemeClick = (e) => {
  toggleTheme($(e.currentTarget).data('theme-id'))
}

// Completely close app
// eslint-disable-next-line no-unused-vars
const exit = (e) => {
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
  var data = e.dataTransfer.getData('text')
  if ($(e.target).hasClass('box')) {
    $(e.target).append($(`#${data}`))
  } else if ($(e.target).hasClass('stack')) {
    $(e.target).find('.box').append($(`#${data}`))
  } else {
    return
  }
  tasks.updateTaskStatus(data, $(e.target).closest('.stack').prop('id'))
  tasks.updateTaskAge(data)
}

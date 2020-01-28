/* global activeTask */
// Modules and variable definition
const { ipcRenderer } = require('electron')
const tasks = require('./tasks')
require('bootstrap/js/dist/modal')
require('./menu.js')
const customTitlebar = require('custom-electron-titlebar')
let taskType = 'new'
let winMax = false

// Custom titlebar instantiation
const bg = getComputedStyle(document.documentElement).getPropertyValue('--background1').trim()
// eslint-disable-next-line no-new
new customTitlebar.Titlebar({
  backgroundColor: customTitlebar.Color.fromHex(bg),
  icon: './res/moby1_icon_19.png'
})

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

// Load tasks at startup; Evaluate for scheduled task; Archive off tasks in 'Done' for more than a week; Update task age in UI
if (tasks.taskList.length && document.getElementById('main-window')) {
  tasks.taskList.forEach(tasks.addTask)
  addScheduledTasks()
  archiveDoneTasks()
  updateTaskAge()
  window.setInterval(addScheduledTasks, 3600000)
  window.setInterval(archiveDoneTasks, 3600000)
  window.setInterval(updateTaskAge, 3600000)
}

// IPC event to get task data from tray window
ipcRenderer.on('quick-data', (e, data) => {
  tasks.taskList.push(data)
  tasks.saveTasks()
  tasks.addTask(data)
})

// Scheduled tasks method
function addScheduledTasks () {
  /* Schedule logic
  if in 'schedule' status && date < now:
  if count > 0 or -1 clone task to today, reduce count (except forever -1) and update start date
  if count of scheduled item is 0, archive it
  */
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
      if (item.TaskStatus === 'done' && item.StatusDate < Date.now() - (86400000 * 7)) {
        tasks.archiveTask(item.TaskId)
      }
    })
  }
}

// Update task age field
function updateTaskAge () {
  if (tasks.taskList.length) {
    tasks.taskList.forEach((item) => {
      $(`#a${item.TaskId}`).text(Math.floor((Date.now() - item.StatusDate) / 86400000))
    })
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
$('#task-modal').on('show.bs.modal', function (e) {
  var type = $(e.relatedTarget).data('type-id') ? $(e.relatedTarget).data('type-id') : taskType
  var status = $(e.relatedTarget).data('status-id') ? $(e.relatedTarget).data('status-id') : 'Do'
  loadTaskModal(type, status)
})

// Task modal load function; recieves new vs edit
function loadTaskModal (type, status) {
  taskType = type
  $('#schedule-modal').modal('hide')
  $('#restore-modal').modal('hide')
  $('#collapse-sched').collapse('hide')
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
    $('#task-status').val(getTask.TaskStatus.replace(/^\w/, c => c.toUpperCase()))
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
$('#task-modal').on('shown.bs.modal', function (e) {
  $('#task-title').focus()
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
$('#task-modal').keypress(function (e) {
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
  let col
  if (e.target.id.substring(0, 3) === 'col') {
    e.target.appendChild(document.getElementById(data))
    col = e.target.getAttribute('id').substring(4)
  } else if (e.target.parentElement.parentElement.id.substring(0, 3) === 'col') {
    col = e.target.parentElement.parentElement.getAttribute('id').substring(4)
    e.target.parentElement.parentElement.appendChild(
      document.getElementById(data)
    )
  } else if (e.target.id.substring(0, 4) === 'host') {
    col = e.target.id.substring(5, e.target.id.length)
    document
      .getElementById('col-' + col)
      .appendChild(document.getElementById(data))
  } else {
    return
  }
  tasks.updateTaskStatus(data, col)
}

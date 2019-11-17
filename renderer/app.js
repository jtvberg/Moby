/* global activeTask */
// Modules and variable definition
const { ipcRenderer } = require('electron')
const tasks = require('./tasks')
require('bootstrap/js/dist/modal')
let taskType = 'new'
let winMax = false

// Load tasks at startup; Evaluate for sceduled task; Archive off tasks in 'Done' for more than a week
if (tasks.taskList.length && document.getElementById('main-window')) {
  tasks.taskList.forEach(tasks.addTask)
  addScheduledTasks()
  archiveDoneTasks()
  window.setInterval(addScheduledTasks, 86400000)
  window.setInterval(archiveDoneTasks, 86400000)
}

// IPC events/channels to act on screen state
ipcRenderer.on('efs', () => {
  $('.wrapper').css('grid-template-rows', '0px 1fr')
})

ipcRenderer.on('lfs', () => {
  $('.wrapper').css('grid-template-rows', '17px 1fr')
})

// IPC event to get task data from tray window
ipcRenderer.on('quick-data', (e, data) => {
  tasks.taskList.push(data)
  tasks.saveTasks()
  tasks.addTask(data)
})

// IPC event to maximize window on top bar double click
$('.top-bar').dblclick(() => {
  if (!winMax) {
    ipcRenderer.send('win-max')
    winMax = true
  } else {
    ipcRenderer.send('win-restore')
    winMax = false
  }
})

// Scheduled tasks handler
function addScheduledTasks () {
  /* Schedule logic
  if in 'schedule' status && date < now
  if count > 0 or  clone task to today, reduce count (except forever -1) and update start date
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
          getTask.StartDate = getTask.StartDate + (86400000 * 7)
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

// Task menu commands; Edit selected task
window.openTaskMenu = (type) => {
  taskType = type
  $('#task-modal').modal('show')
}

// Task menu commands; Archive selected task
window.archiveTaskMenu = () => {
  tasks.archiveTask(activeTask)
}

// Task menu commands; Expand all tasks
window.expandAllMenu = () => {
  expandAll()
}

// Task menu commands; Collapse all tasks
window.collapseAllMenu = () => {
  collapseAll()
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
    var getTask = tasks.taskList.find(task => parseInt(task.TaskId) === parseInt(activeTask))
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
    $('#radio-recur').val(getTask.MonthDay)
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
$('#radio-weekly').click(() => {
  enableRecur()
})

$('#radio-biWeekly').click(() => {
  enableRecur()
})

$('#radio-triWeekly').click(() => {
  enableRecur()
})

$('#radio-monthly').click(() => {
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

// Theme toggle event
const toggleThemeClick = (e) => {
  toggleTheme($(e.currentTarget).data('theme-id'))
}

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

const expandAll = (e) => {
  $('.collapse').collapse('show')
}

const collapseAll = (e) => {
  $('.collapse').collapse('hide')
}

// Completely close app
const exit = (e) => {
  const remote = require('electron').remote
  remote.app.exit()
}

// Task drag and drop events
const allowDrop = (e) => {
  e.preventDefault()
}

const drag = (e) => {
  e.dataTransfer.setData('text', e.target.id)
}

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

/* global activeTask */
// Modules
const { ipcRenderer } = require('electron')
const tasks = require('./tasks.js')
const fs = require('fs')
// const menu = require('./menu.js')
require('bootstrap/js/dist/modal')
var desktopPath = ''
var taskType = ''
// Load tasks at startup
if (tasks.taskList.length) {
  tasks.taskList.forEach(tasks.addTask)
  window.setInterval(addScheduledTasks, 10000)
}

ipcRenderer.on('desktopPath', (e, data) => {
  desktopPath = data
})

function addScheduledTasks () {
  var d = new Date()
  var today = d.getDay()
  // if in 'schedule' status && date < now
  // && if getDay integer in days[]
  // if count = 1 move scheduled to today
  // if count > 1 clone task to today and reduce count (except forever)

  if (item.Count > 0 && item.WeekDay.includes(today)) {
    item.TaskStatus = 'Today'
  }
}

$('.wrapper').hover(() => {
  $('.collapse').collapse('hide')
})

$('#task-modal').on('show.bs.modal', function (e) {
  if ($(e.relatedTarget).data('type-id') === 'new') {
    taskType = 'new'
    $('#task-modal-title').html('New Task')
    $(this).find('form').trigger('reset')
    $('#task-status').val($(e.relatedTarget).data('status-id'))
    $('#choose-days').prop('disabled', true)
  } else {
    taskType = 'edit'
    $('#task-modal-title').html('Edit Task')
    var getTask = tasks.taskList.find(task => task.TaskId == activeTask)
    $('#task-title').val(getTask.TaskTitle)
    $('#task-detail').val(getTask.TaskDetail)
    $('#task-status').val(getTask.TaskStatus)
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
    $('#choose-recur').val(getTask.MonthDay)
  }
})

function enableRecur () {
  $('#choose-days').prop('disabled', false)
  $('#count-select').prop('disabled', false)
  $('#recur-count').removeClass('disabled-form-label')
}

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

$('#submit-button').click(() => {
  var taskTitle = $('#task-title').val() || 'No Title'
  var taskDetail = $('#task-detail').val()
  var taskTheme = $('#choose-theme input:radio:checked').val() || 1
  var taskStatus = $('#task-status').val()
  var taskId = Date.now()
  var count = $('#count-select').val() || 1
  var startDate = new Date(Date.parse($('#start-date').val()) || Date.now()).getTime()
  var monthDay = $('#choose-recur input:radio:checked').val() || 0
  var weekDay = []
  $('#check-sun').prop('checked') && weekDay.push(0)
  $('#check-mon').prop('checked') && weekDay.push(1)
  $('#check-tue').prop('checked') && weekDay.push(2)
  $('#check-wed').prop('checked') && weekDay.push(3)
  $('#check-thu').prop('checked') && weekDay.push(4)
  $('#check-fri').prop('checked') && weekDay.push(5)
  $('#check-sat').prop('checked') && weekDay.push(6)
  if (weekDay.length < 1 && monthDay > 0) {
    weekDay.push(new Date(startDate).getDay())
  }
  count *= weekDay.length
  if (startDate > Date.now()) {
    taskStatus = 'Schedule'
  }
  var newTaskData = {
    TaskStatus: taskStatus,
    TaskId: taskId,
    TaskTitle: taskTitle,
    TaskDetail: taskDetail,
    TaskTheme: taskTheme,
    Count: count,
    StartDate: startDate,
    WeekDay: weekDay,
    MonthDay: monthDay
  }
  if (taskType === 'new') {
    tasks.taskList.push(newTaskData)
  } else {
    var getTask = tasks.taskList.find(task => task.TaskId == activeTask)
    getTask.TaskTitle = taskTitle
    getTask.TaskDetail = taskDetail
    getTask.TaskTheme = taskTheme
    getTask.TaskStatus = taskStatus
    getTask.Count = count
    getTask.StartDate = startDate
    getTask.WeekDay = weekDay
    getTask.MonthDay = monthDay
    document.getElementById(getTask.TaskId).remove()
  }
  tasks.saveTasks()
  tasks.addTask(newTaskData)
})

$('#task-modal').keypress(function (e) {
  if (e.which === 13 && !$('#task-detail').is(':focus')) {
    $('#submit-button').click()
  }
})

$('#restore-button').click(() => {
  document
    .getElementById('colDo')
    .appendChild(document.getElementById(activeTask))
  tasks.updateTaskStatus(tasks.taskList, activeTask, 'Do')
  tasks.saveTasks()
  $('#restore-modal').modal('hide')
})

$('#export-button').click(() => {
  if (tasks.taskList.length) {
    var JSONexport = JSON.stringify(tasks.taskList)
    fs.writeFile(`${desktopPath}/moby_export.txt`, JSONexport, err => {
      if (err) {
        alert('An error during the export ' + err.message)
        return
      }
      alert(
        'The export has completed succesfully and is located on your desktop'
      )
    })
  }
})

$('#import-button').click(() => {
  fs.readFile(`${desktopPath}/moby_export.txt`, (err, data) => {
    if (err) {
      alert('An error during the import ' + err.message)
      return
    }
    var JSONimport = JSON.parse(data)
    if (JSONimport.length) {
      JSONimport.forEach(item => {
        tasks.taskList.push(item)
      })
      tasks.saveTasks()
      JSONimport.forEach(tasks.addTask)
      alert('The import has completed succesfully')
    } else {
      alert('No records found')
    }
  })
})

const exit = e => {
  const remote = require('electron').remote
  const w = remote.getCurrentWindow()
  w.close()
}

const allowDrop = e => {
  e.preventDefault()
}

const drag = e => {
  e.dataTransfer.setData('text', e.target.id)
}

const drop = e => {
  e.preventDefault()
  var data = e.dataTransfer.getData('text')
  let col
  if (e.target.id.substring(0, 3) === 'col') {
    e.target.appendChild(document.getElementById(data))
    col = e.target.getAttribute('id').substring(3)
  } else if (e.target.parentElement.parentElement.id.substring(0, 3) === 'col') {
    col = e.target.parentElement.parentElement.getAttribute('id').substring(3)
    e.target.parentElement.parentElement.appendChild(
      document.getElementById(data)
    )
  } else if (e.target.id.substring(0, 4) === 'host') {
    col = e.target.id.substring(4, e.target.id.length)
    document
      .getElementById('col' + col)
      .appendChild(document.getElementById(data))
  } else {
    return
  }
  tasks.updateTaskStatus(tasks.taskList, data, col)
  tasks.saveTasks()
}
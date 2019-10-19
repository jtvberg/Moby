// Modules
const { ipcRenderer } = require('electron')
const tasks = require('./tasks.js')
const menu = require('./menu.js')
require('bootstrap/js/dist/modal')

// Load tasks at startup
if (tasks.taskList.length) {
  // tasks.taskList.forEach(addScheduledTasks)
  tasks.taskList.forEach(tasks.addTask)
  // addScheduledTasks()
  // window.setInterval(addScheduledTasks, 10000)
}

let desktopPath = ''

ipcRenderer.on('desktopPath', (e, data) => {
  desktopPath = data
})

function addScheduledTasks(item) {
  // console.log(Date().valueOf())
  var d = new Date()
  var today = d.getDay()
  if (item.Count > 0 && item.WeekDay.includes(today)) {
    item.TaskStatus = 'Today'
  }
}

$('.wrapper').hover(function() {
  $('.collapse').collapse('hide')
})

$('#add-modal').on('show.bs.modal', function(e) {
  $(this).find('form').trigger('reset')
  $('#taskStatus').val($(e.relatedTarget).data('status-id'))
  $('#choose-days').prop('disabled', true)
  // $('#choose-recur').prop('disabled', true)
})

$('#radio-weekly').click(function () { $('#choose-days').prop('disabled', false) })
$('#radio-biWeekly').click(function () { $('#choose-days').prop('disabled', false) })
$('#radio-triWeekly').click(function () { $('#choose-days').prop('disabled', false) })
$('#radio-monthly').click(function () { $('#choose-days').prop('disabled', false) })
$('#radio-once').click(function () {
  $('#choose-days').prop('disabled', true)
  $(':checkbox').prop('checked', false)
})

$('#edit-modal').on('shown.bs.modal', function () {
  var getTask = tasks.taskList.find(task => task.TaskId == activeTask)
  $('#editTitle').val(getTask.TaskTitle)
  $('#editDetail').val(getTask.TaskDetail)
  $('#editStatus').val(getTask.TaskStatus)
  $(`#editOption${getTask.TaskTheme}`)
    .closest('.btn')
    .button('toggle')
  $('#count-select-edit').val(getTask.Count)
  var dt = new Date(getTask.StartDate)
  $('#start-date-edit').val(dt.getMonth() + 1 + '/' + dt.getDate() + '/' + dt.getFullYear())
  $('#check-sun-edit').prop('checked', getTask.WeekDay.includes(0))
  $('#check-mon-edit').prop('checked', getTask.WeekDay.includes(1))
  $('#check-tue-edit').prop('checked', getTask.WeekDay.includes(2))
  $('#check-wed-edit').prop('checked', getTask.WeekDay.includes(3))
  $('#check-thu-edit').prop('checked', getTask.WeekDay.includes(4))
  $('#check-fri-edit').prop('checked', getTask.WeekDay.includes(5))
  $('#check-sat-edit').prop('checked', getTask.WeekDay.includes(6))
  $('#choose-recur-edit').val(getTask.MonthDay)
})

$('#add-button').click(() => {
  var taskTitle = $('#taskTitle').val() || 'No Title'
  var taskDetail = $('#taskDetail').val()
  var taskTheme = $('#chooseTheme input:radio:checked').val() || 1
  var taskStatus = $('#taskStatus').val()
  var taskId = Date.now()
  var count = $('#count-select').val() || 1
  var startDate = new Date(Date.parse($('#start-date').val()) || Date.now()).getTime()
  var weekDay = []
  $('#check-sun').prop('checked') && weekDay.push(0)
  $('#check-mon').prop('checked') && weekDay.push(1)
  $('#check-tue').prop('checked') && weekDay.push(2)
  $('#check-wed').prop('checked') && weekDay.push(3)
  $('#check-thu').prop('checked') && weekDay.push(4)
  $('#check-fri').prop('checked') && weekDay.push(5)
  $('#check-sat').prop('checked') && weekDay.push(6)
  var monthDay = $('#choose-recur input:radio:checked').val() || 0
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
  tasks.taskList.push(newTaskData)
  tasks.saveTasks()
  tasks.addTask(newTaskData)
})

$(function () {
  $('#add-modal').keypress(function (e) {
    if (e.which === 13 && !$('#taskDetail').is(':focus')) {
      $('#add-button').click()
    }
  })
})

$('#update-button').click(() => {
  var getTask = tasks.taskList.find(task => task.TaskId == activeTask)
  getTask.TaskTitle = $('#editTitle').val()
  getTask.TaskDetail = $('#editDetail').val()
  getTask.TaskTheme = $('#editChooseTheme input:radio:checked').val() || 1
  getTask.TaskStatus = $('#editStatus').val()
  tasks.saveTasks()
  document.getElementById(getTask.TaskId).remove()
  var newTaskData = {
    TaskStatus: getTask.TaskStatus,
    TaskId: getTask.TaskId,
    TaskTitle: getTask.TaskTitle,
    TaskDetail: getTask.TaskDetail,
    TaskTheme: getTask.TaskTheme
  }
  tasks.addTask(newTaskData)
  $('#edit-modal').modal('hide')
})

$(function () {
  $('#edit-modal').keypress(function (e) {
    if (e.which == 13 && !$('#editDetail').is(':focus')) {
      $('#update-button').click()
    }
  })
})

$('#restore-button').click(() => {
  document
    .getElementById('colDo')
    .appendChild(document.getElementById(activeTask))
  tasks.updateTask(tasks.taskList, activeTask, 'Do')
  tasks.saveTasks()
  $('#restore-modal').modal('hide')
})

let fs = require('fs')

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

exit = e => {
  const remote = require('electron').remote
  let w = remote.getCurrentWindow()
  w.close()
}

// Drag and drop events
allowDrop = e => {
  e.preventDefault()
}
drag = e => {
  e.dataTransfer.setData('text', e.target.id)
}
drop = e => {
  e.preventDefault()
  var data = e.dataTransfer.getData('text')
  let col
  if (e.target.id.substring(0, 3) == 'col') {
    e.target.appendChild(document.getElementById(data))
    col = e.target.getAttribute('id').substring(3)
  } else if (e.target.parentElement.parentElement.id.substring(0, 3) == 'col') {
    col = e.target.parentElement.parentElement.getAttribute('id').substring(3)
    e.target.parentElement.parentElement.appendChild(
      document.getElementById(data)
    )
  } else if (e.target.id.substring(0, 4) == 'host') {
    col = e.target.id.substring(4, e.target.id.length)
    document
      .getElementById('col' + col)
      .appendChild(document.getElementById(data))
  } else {
    return
  }
  tasks.updateTask(tasks.taskList, data, col)
  tasks.saveTasks()
}

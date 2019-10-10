// Objects, ids, functions, elements: camelCase: memberId
// css class: member-id
// Html id: member-id
// JS Class: MemberClass

// Modules
const { ipcRenderer } = require('electron')
const tasks = require('./tasks.js')
const menu = require('./menu.js')
require('bootstrap/js/dist/modal')

// Load tasks at startup
if (tasks.taskList.length) {
  tasks.taskList.forEach(tasks.addTask)
  tasks.taskList.forEach(addScheduledTasks)
  //addScheduledTasks()
  //window.setInterval(addScheduledTasks, 10000)
}

let desktopPath = ''

ipcRenderer.on('desktopPath', (e, data) => {
  desktopPath = data
})

function addScheduledTasks(item) {
  //console.log(Date().valueOf())
  var d = new Date()
  var today = d.getDay()
  if (item.Count > 0 && item.WeekDay.includes(today)) {
    //console.log("Is Today")
  }
}

$('.wrapper').hover(function() {
  $(`.collapse`).collapse('hide')
})

$('#add-modal').on('show.bs.modal', function(e) {
  var status = $(e.relatedTarget).data('status-id')
  $('#taskTitle').val('')
  $('#taskDetail').val('')
  $('#taskStatus').val(status)
  $('#option1')
    .closest('.btn')
    .button('toggle')
})

$('#edit-modal').on('shown.bs.modal', function() {
  var getTask = tasks.taskList.find(task => task.TaskId == activeTask)
  $('#editTitle').val(getTask.TaskTitle)
  $('#editDetail').val(getTask.TaskDetail)
  $('#editStatus').val(getTask.TaskStatus)
  $(`#editOption${getTask.TaskTheme}`)
    .closest('.btn')
    .button('toggle')
})

$('#add-button').click(() => {
  var taskTitle = $('#taskTitle').val()
  var taskDetail = $('#taskDetail').val()
  var taskTheme = $('#chooseTheme input:radio:checked').val() || 1
  var taskStatus = $('#taskStatus').val()
  var taskId = Date.now()
  var count = $('#count-select').val() || 1
  var startDate = new Date(Date.parse($('#startDate').val()) || Date.now())
  var weekDay = []
  $('#check-sun').prop('checked') && weekDay.push(0)
  $('#check-mon').prop('checked') && weekDay.push(1)
  $('#check-tue').prop('checked') && weekDay.push(2)
  $('#check-wed').prop('checked') && weekDay.push(3)
  $('#check-thu').prop('checked') && weekDay.push(4)
  $('#check-fri').prop('checked') && weekDay.push(5)
  $('#check-sat').prop('checked') && weekDay.push(6)
  var monthDay = $('#chooseRecur input:radio:checked').val() || 0
  if (weekDay.length < 1 && monthDay > 0 && startDate) {
    weekDay.push(startDate.getDay())
  }
  count *= weekDay.length
  if (startDate > Date.now()) {
    newTaskStatus = 'Schedule'
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
  console.log(newTaskData)
  tasks.taskList.push(newTaskData)
  tasks.saveTasks()
  tasks.addTask(newTaskData)
})

$(function() {
  $('#add-modal').keypress(function(e) {
    if (e.which == 13 && !$('#taskDetail').is(':focus')) {
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

$(function() {
  $('#edit-modal').keypress(function(e) {
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

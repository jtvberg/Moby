// Modules
const {ipcRenderer} = require('electron')
const tasks = require('./tasks.js')
const menu = require('./menu.js')
require('bootstrap/js/dist/modal')

if(tasks.taskList.length) {
  tasks.taskList.forEach(tasks.addTask)
}

// Show add-modal
$('.open-add-modal').click(() => {
    $('#add-modal').modal('show')
})

// Handle add-modal submission
$('#add-button').click(() => {
  var newTaskTitle = $('#taskTitle').val()
  var newTaskDetail = $('#taskDetail').val()
  var newTaskTheme = $('#chooseTheme input:radio:checked').val()
  var newTaskStatus = $('#taskStatus').val()
  var newTaskId = new Date().valueOf()
  console.log(newTaskId)
  var newTaskData = {"TaskStatus":newTaskStatus, "TaskId":newTaskId, "TaskTitle":newTaskTitle, "TaskDetail":newTaskDetail, "TaskTheme":newTaskTheme}
  tasks.taskList.push(newTaskData)
  tasks.saveTasks()
  tasks.addTask(newTaskData)
})

exit = (e) => {
    const remote = require('electron').remote
    let w = remote.getCurrentWindow()
    w.close()
}
allowDrop = (e) => {
    e.preventDefault()
}
drag = (e) => {
    e.dataTransfer.setData("text", e.target.id)
}
drop = (e) => {
    e.preventDefault()
    var data = e.dataTransfer.getData('text')
    if(e.target.parentElement !== document.getElementById(data).parentElement && e.target.parentElement.parentElement !== document.getElementById(data).parentElement) {
      e.target.appendChild(document.getElementById(data))
      tasks.updateTask(tasks.taskList, data, e.target.getAttribute('id').substring(3))
      tasks.saveTasks()
    } else {
      console.log("same column")
    }
}
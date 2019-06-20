// Modules
const {ipcRenderer} = require('electron')
const tasks = require('./tasks.js')
const menu = require('./menu.js')
var schedule = require('node-schedule')
require('bootstrap/js/dist/modal')

// Load tasks at startup
if(tasks.taskList.length) {
  tasks.taskList.forEach(tasks.addTask)
}

var date = new Date(2019, 5, 19, 20, 44, 0);
var testSchedule = schedule.scheduleJob(date, function(){
  var newTaskData = {"TaskStatus":"Today", "TaskId":new Date().valueOf(), "TaskTitle":'Scheduled Task', "TaskDetail":'I was scheduled', "TaskTheme":2}
  tasks.taskList.push(newTaskData)
  tasks.saveTasks()
  tasks.addTask(newTaskData)
});

$('#add-modal').on('show.bs.modal', function(e) {
  var status = $(e.relatedTarget).data('status-id')
  $('#taskTitle').val('');
  $('#taskDetail').val('');
  $('#taskStatus').val(status);
})

$('#del-button').click(() => {
  document.getElementById('colArchive').appendChild(document.getElementById(activeTask))
  tasks.updateTask(tasks.taskList, activeTask, 'Archive')
  tasks.saveTasks()
})

$('#add-button').click(() => {
  var newTaskTitle = $('#taskTitle').val()
  var newTaskDetail = $('#taskDetail').val()
  var newTaskTheme = $('#chooseTheme input:radio:checked').val() || 1
  var newTaskStatus = $('#taskStatus').val()
  var newTaskId = new Date().valueOf()
  var newTaskData = {"TaskStatus":newTaskStatus, "TaskId":newTaskId, "TaskTitle":newTaskTitle, "TaskDetail":newTaskDetail, "TaskTheme":newTaskTheme}
  tasks.taskList.push(newTaskData)
  tasks.saveTasks()
  tasks.addTask(newTaskData)
})

$('#restore-button').click(() => {
  document.getElementById('colDo').appendChild(document.getElementById(activeTask))
  tasks.updateTask(tasks.taskList, activeTask, 'Do')
  tasks.saveTasks()
})

// Drag and drop events
exit = (e) => {
  const remote = require('electron').remote
  let w = remote.getCurrentWindow()
  w.close()
}
allowDrop = (e) => {
  e.preventDefault()
}
drag = (e) => {
  e.dataTransfer.setData('text', e.target.id)
}
drop = (e) => {
  e.preventDefault()
  var data = e.dataTransfer.getData('text')
  let col;
  if(e.target.id.substring(0,3) == 'col') {
    e.target.appendChild(document.getElementById(data))
    col = e.target.getAttribute('id').substring(3);
  } else if (e.target.parentElement.parentElement.id.substring(0,3) == 'col') {
    col = e.target.parentElement.parentElement.getAttribute('id').substring(3);
    e.target.parentElement.parentElement.appendChild(document.getElementById(data))
  } else if (e.target.id.substring(0,4) == 'host') {
    col = e.target.id.substring(4,e.target.id.length)
    document.getElementById('col'+col).appendChild(document.getElementById(data))
  } else {
    return;
  }
  tasks.updateTask(tasks.taskList, data, col)
  tasks.saveTasks()
}
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

// Month is 0 based
var date = new Date(2019, 6, 24, 13, 34, 0)
console.log(date)
var testSchedule = schedule.scheduleJob(date, function(){
  var newTaskData = {"TaskStatus":"Today", "TaskId":new Date().valueOf(), "TaskTitle":'Scheduled Task', "TaskDetail":'I was scheduled', "TaskTheme":3}
  tasks.taskList.push(newTaskData)
  tasks.saveTasks()
  tasks.addTask(newTaskData)
  console.log(newTaskData)
})

$('.wrapper').hover(
    function() {
       $(`.collapse`).collapse('hide')
     }
   );

$('#add-modal').on('show.bs.modal', function(e) {
  var status = $(e.relatedTarget).data('status-id')
  $('#taskTitle').val('')
  $('#taskDetail').val('')
  $('#taskStatus').val(status)
})

$('#edit-modal').on('show.bs.modal', function(e) {
  var getTask = tasks.taskList.find(task => task.TaskId == activeTask)
  $('#editTitle').val(getTask.TaskTitle)
  $('#editDetail').val(getTask.TaskDetail)
  $('#editStatus').val(getTask.TaskStatus)
  $(`input[name=inlineRadioOptions][value=${getTask.TaskTheme}]`).prop('checked',true);
})

$('.cardMenuItemEdit').click(() => {
  $('#edit-modal').modal('show');
})

$('#del-button').click(() => {
  if(activeTask) {
    document.getElementById('colArchive').appendChild(document.getElementById(activeTask))
    tasks.updateTask(tasks.taskList, activeTask, 'Archive')
    tasks.saveTasks()
  }
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
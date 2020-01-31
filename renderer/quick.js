// Modules and variable definition
const { ipcRenderer, remote } = require('electron')

// Task creation from tray window; takes type as parameter from submit by type buttons
function quickTask (type) {
  var taskId = Date.now()
  var newTaskData = {
    TaskStatus: type,
    TaskId: taskId,
    TaskTitle: $('#quick-task-title').val() || 'No Title',
    TaskDetail: $('#quick-task-detail').val(),
    TaskTheme: $('#quick-choose-theme input:radio:checked').val() || 1,
    Count: 1,
    StartDate: taskId,
    WeekDay: [],
    MonthDay: 0,
    StatusDate: taskId,
    Tags: []
  }
  // IPC event/channel to send new task data to app via main
  ipcRenderer.send('quick-task', newTaskData)
  remote.getCurrentWindow().hide()
}

// Submit task from tray window events
$('#do-button').click(() => {
  quickTask('do')
})

$('#today-button').click(() => {
  quickTask('today')
})

$('#doing-button').click(() => {
  quickTask('doing')
})

// IPC event/channel to act on reset of form
ipcRenderer.on('quick-reset', (e) => {
  $('#quick-task-form').trigger('reset')
  $('#quick-task-detail').height('48px')
  $('#quick-task-title').focus()
})

// Size task detail on input
$('#quick-task-detail').on('input keydown', function () {
  if (this.scrollHeight > $('#quick-task-detail').height() + 12) {
    $('#quick-task-detail').height(this.scrollHeight + 'px')
  }
})

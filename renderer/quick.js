const { ipcRenderer, remote } = require('electron')

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
    MonthDay: 0
  }
  ipcRenderer.send('quick-task', newTaskData)
  remote.getCurrentWindow().hide()
}

$('#do-button').click(() => {
  quickTask('do')
})

$('#today-button').click(() => {
  quickTask('today')
})

$('#doing-button').click(() => {
  quickTask('doing')
})

ipcRenderer.on('quick-reset', (e) => {
  $('#quick-task-form').trigger('reset')
  $('#quick-task-title').focus()
})

// Track taskList with array
exports.taskList = JSON.parse(localStorage.getItem('taskList')) || []

// Save taskList to localstorage
exports.saveTasks = () => {
  localStorage.setItem('taskList', JSON.stringify(this.taskList))
}

// Update task details
exports.updateTask = (taskList, taskId, taskStatus) => {
  // Update Status
  for (var i = 0; i < taskList.length; i++) {
    if (taskList[i].TaskId == taskId) {
      taskList[i].TaskStatus = taskStatus
      return
    }
  }
}

// Add task to UI
exports.addTask = task => {
  let taskHTML = `<div class="card theme-${task.TaskTheme}" id="${task.TaskId}" data-toggle="collapse" data-target="#c${task.TaskId}" draggable="true" ondragstart="drag(event)">
                    <div id="b${task.TaskId}" class="collapsible">${task.TaskTitle}</div>
                    <div class="collapse collapseContent" id="c${task.TaskId}">
                      <p style="white-space: pre-wrap;">${task.TaskDetail}</p>
                      <div class="cardMenu">
                        <div class="cardMenuItemDel fas fa-minus-square" id="del-button"></div>
                        <div class="cardMenuItemClone fas fa-clone" id="clone-button-${task.TaskId}"></div>
                        <div class="cardMenuItemEdit fas fa-edit" id="edit-button" data-type-id="edit"></div>
                      <div>
                    </div>
                  </div>`
  $(`#col${task.TaskStatus}`).append(taskHTML)
  $('#add-modal').modal('hide')
  $('.card').on('click', function () {
    window.activeTask = this.id
  })
  $('.card').hover(function () {
    window.activeTask = this.id
  })
  $('.cardMenuItemEdit').click(() => {
    $('#schedule-modal').modal('hide')
    $('#restore-modal').modal('hide')
    $('#edit-modal').modal('show')
  })
  $('.cardMenuItemDel').click(() => {
    if (activeTask) {
      document
        .getElementById('colArchive')
        .appendChild(document.getElementById(activeTask))
      tasks.updateTask(tasks.taskList, activeTask, 'Archive')
      tasks.saveTasks()
    }
  })
  $(`#clone-button-${task.TaskId}`).click(() => {
    if (activeTask) {
      var getTask = tasks.taskList.find(task => task.TaskId == activeTask)
      var newTaskTitle = getTask.TaskTitle
      var newTaskDetail = getTask.TaskDetail
      var newTaskTheme = getTask.TaskTheme
      var newTaskStatus = 'Do'
      var newTaskId = new Date().valueOf()
      var newTaskData = {
        TaskStatus: newTaskStatus,
        TaskId: newTaskId,
        TaskTitle: newTaskTitle,
        TaskDetail: newTaskDetail,
        TaskTheme: newTaskTheme
      }
      tasks.taskList.push(newTaskData)
      tasks.saveTasks()
      tasks.addTask(newTaskData)
    }
  })
}

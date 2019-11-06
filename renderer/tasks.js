/* global tasks, activeTask */
// Track taskList with array
exports.taskList = JSON.parse(localStorage.getItem('taskList')) || []

// Save taskList to localstorage
exports.saveTasks = () => {
  localStorage.setItem('taskList', JSON.stringify(this.taskList))
}

// Update task status helper function
exports.updateTaskStatus = (taskList, taskId, taskStatus) => {
  taskList.find(task => parseInt(task.TaskId) === parseInt(taskId)).TaskStatus = taskStatus
}

// Clone task to 'do'
exports.cloneTask = (taskId) => {
  if (taskId) {
    var getTask = tasks.taskList.find(task => parseInt(task.TaskId) === parseInt(taskId))
    var newTaskStatus = getTask.StartDate > Date.now() ? 'schedule' : 'do'
    var newTaskData = {
      TaskStatus: newTaskStatus,
      TaskId: new Date().valueOf(),
      TaskTitle: getTask.TaskTitle,
      TaskDetail: getTask.TaskDetail,
      TaskTheme: getTask.TaskTheme,
      Count: getTask.Count,
      StartDate: getTask.StartDate,
      WeekDay: getTask.WeekDay,
      MonthDay: getTask.MonthDay
    }
    tasks.taskList.push(newTaskData)
    tasks.saveTasks()
    tasks.addTask(newTaskData)
  }
}

// Add task(s) to UI
exports.addTask = task => {
  const taskHTML = `<div class="card theme-${task.TaskTheme}" id="${task.TaskId}" data-toggle="collapse" data-target="#c${task.TaskId}" draggable="true" ondragstart="drag(event)">
                    <div id="b${task.TaskId}" >${task.TaskTitle}</div>
                    <div class="collapse collapse-content" id="c${task.TaskId}">
                      <p style="white-space: pre-wrap;">${task.TaskDetail}</p>
                      <div class="card-menu">
                        <div class="card-menu-item-del fas fa-minus-square" id="del-button"></div>
                        <div class="card-menu-item-clone fas fa-clone" id="clone-button-${task.TaskId}"></div>
                        <div class="card-menu-item-edit fas fa-edit" id="edit-button" data-type-id="edit"></div>
                      <div>
                    </div>
                  </div>`
  $(`#col-${task.TaskStatus}`).append(taskHTML)
  $('#task-modal').modal('hide')
  // Active task setting events
  $('.card').on('click', function () {
    window.activeTask = this.id
  })
  // TODO: Fix cludgie implementation
  // $('.card').hover(function () {
  //   window.activeTask = this.id
  // })
  // Task mini-menu events
  $('.card-menu-item-edit').click(() => {
    $('#schedule-modal').modal('hide')
    $('#restore-modal').modal('hide')
    $('#task-modal').modal('show')
  })
  $('.card-menu-item-del').click(() => {
    if (activeTask) {
      document
        .getElementById('col-archive')
        .appendChild(document.getElementById(activeTask))
      tasks.updateTaskStatus(tasks.taskList, activeTask, 'archive')
      tasks.saveTasks()
    }
  })
  $(`#clone-button-${task.TaskId}`).click(() => {
    this.cloneTask(activeTask)
  })
}

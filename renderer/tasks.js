/* global activeTask */
// Track taskList with array
exports.taskList = JSON.parse(localStorage.getItem('taskList')) || []

// Save taskList to localstorage
exports.saveTasks = () => {
  localStorage.setItem('taskList', JSON.stringify(this.taskList))
}

// Update task status helper function
exports.updateTaskStatus = (taskId, taskStatus) => {
  this.taskList.find(task => parseInt(task.TaskId) === parseInt(taskId)).TaskStatus = taskStatus
  this.taskList.find(task => parseInt(task.TaskId) === parseInt(taskId)).StatusDate = Date.now()
  this.saveTasks()
}

// Task submittal from modal
exports.submitTask = (taskType) => {
  var taskTitle = $('#task-title').val() || 'No Title'
  var taskDetail = $('#task-detail').val()
  var taskTheme = $('#choose-theme input:radio:checked').val() || 1
  var taskStatus = $('#task-status').val().toLowerCase()
  var taskId = Date.now()
  var count = $('#count-select').val() || 1
  var startDate = new Date(Date.parse($('#start-date').val()) || Date.now()).getTime()
  var monthDay = $('#choose-recur input:radio:checked').val() || 0
  var weekDay = []
  var statusDate = Date.now()
  var tags = []
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
  count *= weekDay.length > 0 ? weekDay.length : 1
  if (startDate > Date.now()) {
    taskStatus = 'schedule'
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
    MonthDay: monthDay,
    StatusDate: statusDate,
    Tags: tags
  }
  if (taskType === 'new') {
    this.taskList.push(newTaskData)
  } else {
    var getTask = this.taskList.find(task => parseInt(task.TaskId) === parseInt(activeTask))
    if (getTask.TaskStatus === taskStatus) {
      statusDate = getTask.StatusDate
    }
    getTask.TaskTitle = taskTitle
    getTask.TaskDetail = taskDetail
    getTask.TaskTheme = taskTheme
    getTask.TaskStatus = taskStatus
    getTask.Count = count
    getTask.StartDate = startDate
    getTask.WeekDay = weekDay
    getTask.MonthDay = monthDay
    getTask.Tags = tags
    getTask.StatusDate = statusDate
    document.getElementById(getTask.TaskId).remove()
  }
  this.saveTasks()
  this.addTask(newTaskData)
}

// Clone task to 'do'
exports.cloneTask = (taskId, taskStatus) => {
  if (taskId) {
    var getTask = this.taskList.find(task => parseInt(task.TaskId) === parseInt(taskId))
    // var newTaskStatus = taskStatus ? getTask.StartDate > Date.now() ? 'schedule' : 'do' : taskStatus
    var newTaskStatus = taskStatus !== undefined ? taskStatus : getTask.StartDate > Date.now() ? 'schedule' : 'do'
    var newTaskData = {
      TaskStatus: newTaskStatus,
      TaskId: Date.now(),
      TaskTitle: getTask.TaskTitle,
      TaskDetail: getTask.TaskDetail,
      TaskTheme: getTask.TaskTheme,
      Count: getTask.Count,
      StartDate: getTask.StartDate,
      WeekDay: getTask.WeekDay,
      MonthDay: getTask.MonthDay,
      Tags: getTask.Tags,
      StatusDate: Date.now()
    }
    this.taskList.push(newTaskData)
    this.saveTasks()
    this.addTask(newTaskData)
  }
}

// Add task(s) to UI
exports.addTask = task => {
  let tagHTML = ''
  if (task.Tags && task.Tags.length > 0) {
    task.Tags.forEach((item) => {
      tagHTML += `<div class="card tags">${item}</div>`
    })
  }
  const taskHTML = `<div class="card theme-${task.TaskTheme}" id="${task.TaskId}" data-toggle="collapse" data-target="#c${task.TaskId}" draggable="true" ondragstart="drag(event)">
                    <div id="b${task.TaskId}" >${task.TaskTitle}</div>
                    <div class="collapse collapse-content" id="c${task.TaskId}">
                      <p style="white-space: pre-wrap;">${task.TaskDetail}</p>
                      <div class="tag-box" id="t${task.TaskId}">${tagHTML}</div>
                      <div class="card-menu">
                        <div class="card-menu-item-del fas fa-minus-square" id="del-button"></div>
                        <div class="card-menu-item-clone fas fa-clone" id="clone-button-${task.TaskId}"></div>
                        <div class="card-menu-item-edit fas fa-edit" id="edit-button" href="#task-modal" data-toggle="modal" data-type-id="edit"></div>
                      <div>
                    </div>
                  </div>`
  // Add task HTML to host
  $(`#col-${task.TaskStatus}`).append(taskHTML)
  // Active task setting event
  $('.card').on('click', function () {
    window.activeTask = this.id
  })
  // Delete active task (send to archive)
  $('.card-menu-item-del').click(() => {
    if (activeTask) {
      this.archiveTask(activeTask)
    }
  })
  // Clone active task (to 'do')
  $(`#clone-button-${task.TaskId}`).click(() => {
    if (activeTask) {
      this.cloneTask(activeTask)
    }
  })
}

// Archive a specific task
exports.archiveTask = (taskId) => {
  if (taskId) {
    document.getElementById('col-archive').appendChild(document.getElementById(taskId))
    this.updateTaskStatus(taskId, 'archive')
    this.saveTasks()
  }
}

// Archive a specific task
exports.restoreTask = (taskId) => {
  if (taskId) {
    document.getElementById('col-do').appendChild(document.getElementById(activeTask))
    this.updateTaskStatus(taskId, 'do')
    this.saveTasks()
  }
}

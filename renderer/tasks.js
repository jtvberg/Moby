/* global activeTask */
// Modules and variable definition
const { ipcRenderer } = require('electron')
const fs = require('fs')
let desktopPath = ''

// IPC event to get system desktop path
ipcRenderer.on('desktopPath', (e, data) => {
  desktopPath = data
})

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
  $(`#a${taskId}`).text('0')
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
    newTaskData.TaskId = activeTask
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
  const taskDays = Math.floor((Date.now() - task.StatusDate) / 86400000)
  const showAge = $('.aging').is(':visible') ? 'style' : 'style="display: none;"'
  const taskHTML = `<div class="card theme-${task.TaskTheme}" id="${task.TaskId}" data-toggle="collapse" data-target="#c${task.TaskId}" draggable="true" ondragstart="drag(event)">
                      <div style="clear: both" id="b${task.TaskId}">
                        <span class="title">${task.TaskTitle}</span>
                        <span class="aging" id="a${task.TaskId}" ${showAge}>${taskDays}</span>
                      </div>
                      <div class="collapse collapse-content" id="c${task.TaskId}">
                        <p style="white-space: pre-wrap;">${task.TaskDetail}</p>
                        <div class="tag-box" id="t${task.TaskId}">${tagHTML}</div>
                        <div class="card-menu">
                          <div class="card-menu-item-del fas fa-minus-square" id="del-button-${task.TaskId}" data-toggle="tooltip" title="Archive Task" ></div>
                          <div class="card-menu-item-clone fas fa-clone" id="clone-button-${task.TaskId}" data-toggle="tooltip" title="Clone Task"></div>
                          <span data-toggle="tooltip" title="Edit Task">
                            <div class="card-menu-item-edit fas fa-edit" id="edit-button" href="#task-modal" data-toggle="modal" data-type-id="edit"></div>
                          </span>
                        <div>
                      </div>
                    </div>`
  // Add task HTML to host
  $(`#col-${task.TaskStatus}`).append(taskHTML)
  // Active task setting event
  $(`#${task.TaskId}`).on('click', function () {
    window.activeTask = this.id
    $('.window-title').text(`Moby: ${task.TaskTitle}`)
  })
  // Delete active task (send to archive)
  $(`#del-button-${task.TaskId}`).click(() => {
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
  // Initialize tooltips
  $(function () {
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 700, hide: 100 } })
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

// Exports all tasks to file to desktop
// TODO: prompt for location
exports.exportTasks = () => {
  if (this.taskList.length) {
    var JSONexport = JSON.stringify(this.taskList)
    fs.writeFile(`${desktopPath}/moby_export_${Date.now()}.txt`, JSONexport, err => {
      if (err) {
        alert('An error occured during the export ' + err.message)
        return
      }
      alert('The export has completed succesfully and is located on your desktop')
    })
  } else {
    alert('Nothing to export')
  }
}

// Imports all tasks (even duplicates) from file from desktop
exports.importTasks = () => {
  let latestExport = 0
  const searchString = 'moby_export_'
  // Find the latest export file by extenstion and suffix
  fs.readdirSync(desktopPath).filter(file => (file.split('.').pop().toLowerCase() === 'txt') && (file.substring(0, searchString.length) === searchString)).forEach((file) => {
    latestExport = file.substring(searchString.length, file.length - 4) > latestExport ? file.substring(searchString.length, file.length - 4) : latestExport
  })
  // Read in the latest file ignoring dupes by ID (not date or content)
  fs.readFile(`${desktopPath}/${searchString}${latestExport}.txt`, (err, data) => {
    if (err) {
      alert('An error occured during the import ' + err.message)
      return
    }
    try {
      var JSONimport = JSON.parse(data)
    } catch (err) {
      alert(err)
    }
    if (JSONimport.length) {
      var i = 0
      JSONimport.forEach(task => {
        if (!this.taskList.some(e => e.TaskId === task.TaskId)) {
          this.taskList.push(task)
          this.addTask(task)
          i++
        }
      })
      this.saveTasks()
      if (i > 1) {
        alert(`${i} tasks imported succesfully`)
      } else if (i === 1) {
        alert('1 task imported succesfully')
      } else {
        alert('No new tasks found')
      }
    } else {
      alert('No tasks found')
    }
  })
}

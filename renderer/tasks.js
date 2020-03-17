/* global activeTask */
// Modules and variable definition
const { ipcRenderer } = require('electron')
const fs = require('fs')
let desktopPath = ''
let updTaskId = null

// IPC event to get system desktop path
ipcRenderer.on('desktop-path', (e, data) => {
  desktopPath = data
})

// Track taskList with array
exports.taskList = updateTaskListModel() // JSON.parse(localStorage.getItem('taskList')) || []

// Track tag list
exports.tagList = []

// Went and changed the model and need to fix it function
function updateTaskListModel () {
  const rl = localStorage.getItem('taskList') || null
  if (rl) {
    const tl = JSON.parse(rl.replace(/TaskStatus/g, 'TaskStack').replace(/TaskTheme/g, 'TaskColor').replace(/StatusDate/g, 'StackDate')) || []
    localStorage.setItem('taskList', JSON.stringify(tl))
    return tl
  }
  return []
}

// Save taskList to localstorage
exports.saveTasks = () => {
  localStorage.setItem('taskList', JSON.stringify(this.taskList))
}

// Update task stack helper function
exports.updateTaskStack = (taskId, taskStack) => {
  var task = this.taskList.find(task => parseInt(task.TaskId) === parseInt(taskId) && task.TaskStack !== taskStack)
  if (task) {
    task.StackDate = Date.now()
    task.TaskStack = taskStack
    const archDelete = task.TaskStack === 'stack-archive' ? 'Delete' : 'Archive'
    $(`#del-button-${task.TaskId}`).attr('data-original-title', `${archDelete} Task`)
    this.saveTasks()
  }
}

// Update task age; id supplied set stack age to 0; otherwise update all tasks
exports.updateTaskAge = (taskId) => {
  if (taskId) {
    $(`#a${taskId}`).text('0/' + Math.floor((Date.now() - taskId) / 86400000))
  } else if (this.taskList.length) {
    this.taskList.forEach((item) => {
      $(`#a${item.TaskId}`).text(Math.floor((Date.now() - item.StackDate) / 86400000) +
      '/' + Math.floor((Date.now() - item.TaskId) / 86400000))
    })
  }
}

// Update task detail helper function
exports.updateTaskDetail = (taskId, taskDetail) => {
  this.taskList.find(task => parseInt(task.TaskId) === parseInt(taskId)).TaskDetail = taskDetail
  this.saveTasks()
}

// Task submittal from modal
exports.submitTask = (taskType) => {
  var taskTitle = $('#task-title').val() || 'No Title'
  var taskDetail = $('#task-detail').val()
  var taskColor = $('#choose-color input:radio:checked').val() || 1
  var taskStack = $('#task-stack').val()
  var taskId = Date.now()
  var count = $('#count-select').val() || 1
  var startDate = new Date(Date.parse($('#start-date').val()) || Date.now()).getTime()
  var monthDay = $('#choose-recur input:radio:checked').val() || 0
  var weekDay = []
  var stackDate = Date.now()
  var tags = []
  $('#tag-edit-box > .tags').each(function () {
    if ($(this).text() !== 'New Tag' && $(this).text().trim() !== '') {
      tags.push($(this).text())
    }
  })
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
    taskStack = 'stack-schedule'
  }
  var newTaskData = {
    TaskStack: taskStack,
    TaskId: taskId,
    TaskTitle: taskTitle,
    TaskDetail: taskDetail,
    TaskColor: taskColor,
    Count: count,
    StartDate: startDate,
    WeekDay: weekDay,
    MonthDay: monthDay,
    StackDate: stackDate,
    Tags: tags
  }
  if (taskType === 'new') {
    this.taskList.push(newTaskData)
  } else {
    var getTask = this.taskList.find(task => parseInt(task.TaskId) === parseInt(activeTask))
    if (getTask.TaskStack === taskStack) {
      newTaskData.StackDate = getTask.StackDate
    } else {
      getTask.StackDate = stackDate
    }
    newTaskData.TaskId = activeTask
    getTask.TaskTitle = taskTitle
    getTask.TaskDetail = taskDetail
    getTask.TaskColor = taskColor
    getTask.TaskStack = taskStack
    getTask.Count = count
    getTask.StartDate = startDate
    getTask.WeekDay = weekDay
    getTask.MonthDay = monthDay
    getTask.Tags = tags
    $(`#${getTask.TaskId}`).remove()
  }
  this.saveTasks()
  this.addTask(newTaskData)
}

// Clone task to 'do'
exports.cloneTask = (taskId, taskStack) => {
  if (taskId) {
    var getTask = this.taskList.find(task => parseInt(task.TaskId) === parseInt(taskId))
    var newTaskStack = taskStack !== undefined ? taskStack : getTask.StartDate > Date.now() ? 'stack-schedule' : 'stack-do'
    var newTaskData = {
      TaskStack: newTaskStack,
      TaskId: Date.now(),
      TaskTitle: getTask.TaskTitle,
      TaskDetail: getTask.TaskDetail,
      TaskColor: getTask.TaskColor,
      Count: getTask.Count,
      StartDate: getTask.StartDate,
      WeekDay: getTask.WeekDay,
      MonthDay: getTask.MonthDay,
      Tags: getTask.Tags,
      StackDate: Date.now()
    }
    this.taskList.push(newTaskData)
    this.saveTasks()
    this.addTask(newTaskData, true)
  }
}

// Add task(s) to UI
exports.addTask = (task, highlight) => {
  let tagHTML = ''
  if (task.Tags && task.Tags.length > 0) {
    task.Tags.forEach((tag) => {
      this.tagList.push(tag)
      tagHTML += `<div class="tags">${tag}</div>`
    })
  }
  // Check if age is toggled
  const showAge = $('.aging').is(':visible') ? 'style' : 'style="display: none;"'
  // Check if archived and update archive tooltip to delete
  const archDelete = task.TaskStack === 'stack-archive' ? 'Delete' : 'Archive'
  // Check if clone to highlight
  const taskHighlight = highlight === true ? 'card-highlighted' : ''
  // Generate task card html
  const taskHtml = `<div class="card ${taskHighlight} color-${task.TaskColor}" id="${task.TaskId}" draggable="true" ondragstart="drag(event)">
                      <div style="clear: both" id="b${task.TaskId}" data-toggle="collapse" data-target="#c${task.TaskId}">
                        <span class="title">${task.TaskTitle}</span>
                        <span class="aging" id="a${task.TaskId}" ${showAge}></span>
                      </div>
                      <div class="collapse collapse-content" id="c${task.TaskId}">
                        <p id="d${task.TaskId}" contenteditable="true" style="white-space: pre-wrap;" draggable="true" ondragstart="event.preventDefault(); event.stopPropagation();">${task.TaskDetail}</p>
                        <div class="tag-box" id="t${task.TaskId}">${tagHTML}</div>
                        <div class="card-menu">
                          <div class="card-menu-item-del fas fa-minus-square" id="del-button-${task.TaskId}" data-toggle="tooltip" title="${archDelete} Task" ></div>
                          <div class="card-menu-item-clone fas fa-clone" id="clone-button-${task.TaskId}" data-toggle="tooltip" title="Clone Task"></div>
                          <span data-toggle="tooltip" title="Edit Task">
                            <div class="card-menu-item-edit fas fa-edit" id="edit-button" href="#task-modal" data-toggle="modal" data-type-id="edit"></div>
                          </span>
                        </div>
                      </div>
                    </div>`
  // Add task html to host
  $(`#${task.TaskStack}`).find('.box').append(taskHtml)
  // Add Ageing
  this.updateTaskAge(task.taskId)
  // Active task setting event
  $(`#${task.TaskId}`).on('click', () => {
    window.activeTask = task.TaskId
    $('.card').removeClass('card-selected')
    $(`#${task.TaskId}`).removeClass('card-highlighted')
    $(`#${task.TaskId}`).addClass('card-selected')
    $('.window-title').text(`Moby - ${task.TaskTitle}`)
  })
  // Stop right-click on card invoking remove stack
  $(`#${task.TaskId}`).contextmenu((e) => {
    e.stopPropagation()
  })
  // In-line detail update event
  $(`#d${task.TaskId}`).on('input', () => {
    updTaskId = task.TaskId
  })
  // In-line detail update commit event
  $(`#d${task.TaskId}`).on('blur', () => {
    window.getSelection().removeAllRanges()
    if (updTaskId) {
      this.updateTaskDetail(updTaskId, $(`#d${task.TaskId}`)[0].innerText)
      updTaskId = null
    }
  })
  // Delete active task (send to archive; delete if in archive)
  $(`#del-button-${task.TaskId}`).click(() => {
    if (task.TaskStack === 'stack-archive') {
      this.deleteTask(task.TaskId)
    } else {
      this.archiveTask(task.TaskId)
    }
  })
  // Clone active task (to 'do')
  $(`#clone-button-${task.TaskId}`).click(() => {
    this.cloneTask(task.TaskId)
  })
  // Initialize tooltips
  $(function () {
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 1000, hide: 100 } })
  })
}

// Archive a specific task
exports.archiveTask = (taskId) => {
  if (taskId) {
    $('#stack-archive').find('.box').append($(`#${taskId}`))
    this.updateTaskStack(taskId, 'stack-archive')
    this.saveTasks()
  }
}

// Delete a specific task
exports.deleteTask = (taskId) => {
  if (taskId) {
    $(`#del-button-${taskId}`).tooltip('hide')
    $(`#${taskId}`).remove()
    this.taskList = this.taskList.filter(task => task.TaskId !== taskId)
    this.saveTasks()
  }
}

// Archive a specific task
exports.restoreTask = (taskId) => {
  if (taskId) {
    $('#stack-do').find('.box').append($(`#${taskId}`))
    this.updateTaskStack(taskId, 'stack-do')
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
      // Convert old import file to new model nonsense
      var tl = data.toString().replace(/TaskStatus/g, 'TaskStack').replace(/TaskTheme/g, 'TaskColor').replace(/StatusDate/g, 'StackDate')
      var JSONimport = JSON.parse(tl)
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
    } catch (err) {
      alert(err)
    }
  })
}

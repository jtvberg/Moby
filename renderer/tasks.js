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
    tl.forEach(task => {
      if ('UpdateTimestamp' in task) { } else {
        task.UpdateTimestamp = task.StackDate
      }
    })
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
  const task = this.taskList.find(task => task.TaskId === parseInt(taskId) && task.TaskStack !== taskStack)
  if (task) {
    task.StackDate = Date.now()
    task.TaskStack = taskStack
    const archDelete = task.TaskStack === 'stack-archive' ? 'Delete' : 'Archive'
    $(`#del-button-${task.TaskId}`).attr('data-original-title', `${archDelete} Task`)
    this.updateTimestamp(taskId)
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
  if (taskId && taskDetail) {
    this.taskList.find(task => task.TaskId === parseInt(taskId)).TaskDetail = taskDetail
    this.updateTimestamp(taskId)
  }
}

// Update subtasks
exports.updateSubtaskCheck = (taskId, subtaskId, checked) => {
  if (taskId && subtaskId) {
    this.taskList.find(task => task.TaskId === parseInt(taskId)).Subtasks.find(stask => stask.SubtaskId === parseInt(subtaskId)).Checked = checked
    this.updateTimestamp(taskId)
  }
}

// Update task global timestamp
exports.updateTimestamp = (taskId) => {
  if (taskId) {
    this.taskList.find(task => task.TaskId === parseInt(taskId)).UpdateTimestamp = Date.now()
    this.saveTasks()
  }
}

// Task submittal from modal
exports.submitTask = (taskType) => {
  const taskTitle = $('#task-title').val() || 'No Title'
  const taskDetail = $('#task-detail').val()
  const taskColor = $('#choose-color input:radio:checked').val() || 1
  let taskStack = $('#task-stack').val()
  const taskId = Date.now()
  let count = $('#count-select').val() || 1
  const startDate = new Date(Date.parse($('#start-date').val()) || Date.now()).getTime()
  const monthDay = $('#choose-recur input:radio:checked').val() || 0
  const weekDay = []
  const updateTimestamp = taskId
  const stackDate = taskId
  const tags = []
  $('#tag-edit-box > .new-tags').each(function () {
    if ($(this).val() !== 'New Tag' && $(this).val().trim() !== '') {
      tags.push($(this).val().trim())
    }
  })
  const subtasks = []
  let offset = 1
  $('#subtask-edit-box > .check-modal-host').each(function () {
    const newSubtaskData = {
      SubtaskId: Date.now() + offset,
      Checked: $(this).find('.check-checkbox').hasClass('check-checked'),
      Text: $(this).find('.check-label').text()
    }
    subtasks.push(newSubtaskData)
    offset++
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
  const newTaskData = {
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
    Tags: tags,
    Subtasks: subtasks,
    UpdateTimestamp: updateTimestamp
  }
  if (taskType === 'new') {
    this.taskList.push(newTaskData)
  } else {
    const getTask = this.taskList.find(task => task.TaskId === window.activeTask)
    if (getTask.TaskStack === taskStack) {
      newTaskData.StackDate = getTask.StackDate
    } else {
      getTask.StackDate = stackDate
    }
    newTaskData.TaskId = window.activeTask
    getTask.TaskTitle = taskTitle
    getTask.TaskDetail = taskDetail
    getTask.TaskColor = taskColor
    getTask.TaskStack = taskStack
    getTask.Count = count
    getTask.StartDate = startDate
    getTask.WeekDay = weekDay
    getTask.MonthDay = monthDay
    $('#tag-edit-box > .tags').each(function () {
      tags.push($(this).text().trim())
    })
    getTask.Tags = tags
    getTask.Subtasks = subtasks
    getTask.UpdateTimestamp = updateTimestamp
    $(`#${getTask.TaskId}`).remove()
  }
  this.saveTasks()
  this.addTask(newTaskData)
}

// Clone task to 'do'
exports.cloneTask = (taskId, taskStack) => {
  if (taskId) {
    const getTask = this.taskList.find(task => task.TaskId === taskId)
    const newTaskStack = taskStack !== undefined ? taskStack : getTask.StartDate > Date.now() ? 'stack-schedule' : 'stack-do'
    const now = Date.now()
    const newTaskData = {
      TaskStack: newTaskStack,
      TaskId: now,
      TaskTitle: getTask.TaskTitle,
      TaskDetail: getTask.TaskDetail,
      TaskColor: getTask.TaskColor,
      Count: getTask.Count,
      StartDate: getTask.StartDate,
      WeekDay: getTask.WeekDay,
      MonthDay: getTask.MonthDay,
      Tags: getTask.Tags,
      Subtasks: getTask.Subtasks,
      StackDate: now,
      UpdateTimestamp: now
    }
    this.taskList.push(newTaskData)
    this.saveTasks()
    this.addTask(newTaskData, true)
  }
}

// Add task(s) to UI
exports.addTask = (task, highlight) => {
  // Add task tags
  let tagHTML = ''
  if (task.Tags && task.Tags.length > 0) {
    task.Tags.forEach((tag) => {
      this.tagList.push(tag)
      tagHTML += `<div class="tags">${tag}</div>`
    })
  }
  // Add subtasks
  let subtaskHTML = ''
  if (task.Subtasks && task.Subtasks.length > 0) {
    task.Subtasks.forEach((subtask) => {
      const checked = subtask.Checked === true ? 'fa-check-square check-checked' : 'fa-square check-unchecked'
      subtaskHTML += `<div class="check-host" id="${subtask.SubtaskId}">
                        <div class="fas check-checkbox ${checked}"></div>
                        <label class="check-label">${subtask.Text}</label>
                      </div>`
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
                        <div class="detail" id="d${task.TaskId}" contenteditable="true" style="white-space: pre-wrap;" draggable="true" ondragstart="event.preventDefault(); event.stopPropagation();">${task.TaskDetail}</div>
                        <div class="subtask-box">${subtaskHTML}</div>
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
    $(`#${task.TaskId}`).removeClass('card-highlighted').addClass('card-selected').parent().animate({ scrollTop: $(`#${task.TaskId}`).offset().top - $(`#${task.TaskId}`).parent().offset().top + $(`#${task.TaskId}`).parent().scrollTop() })
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
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 1500, hide: 100 } })
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
    this.taskList.find(task => task.TaskId === taskId).Tags.forEach(tag => {
      this.tagList.splice(this.tagList.indexOf(tag), 1)
    })
    this.taskList = this.taskList.filter(task => task.TaskId !== taskId)
    this.saveTasks()
    ipcRenderer.send('delete-task')
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
    const JSONexport = JSON.stringify(this.taskList)
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
      const tl = data.toString().replace(/TaskStatus/g, 'TaskStack').replace(/TaskTheme/g, 'TaskColor').replace(/StatusDate/g, 'StackDate')
      const JSONimport = JSON.parse(tl)
      if (JSONimport.length) {
        let i = 0
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

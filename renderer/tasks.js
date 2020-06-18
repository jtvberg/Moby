// Modules and variable definition
const { ipcRenderer, clipboard } = require('electron')
let updTaskId = null

// Function for when I change something about the data model
function updateTaskListModel () {
  const rl = localStorage.getItem('taskList') || null
  if (rl) {
    const tl = JSON.parse(rl) || []
    tl.forEach(task => {
      // Use to update task model
      if (task.ScheduleStack === undefined) {
        task.ScheduleStack = null
      }
    })
    localStorage.setItem('taskList', JSON.stringify(tl))
    return tl
  }
  return []
}

// Track taskList with array
exports.taskList = updateTaskListModel() // JSON.parse(localStorage.getItem('taskList')) || []

// Track tag list
exports.tagList = []

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
  if (taskId) {
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
  const now = Date.now()
  const taskTitle = $('#task-title').val() || 'No Title'
  const taskDetail = $('#task-detail').val()
  const taskColor = parseInt($('#choose-color input:radio:checked').val()) || 1
  let scheduleStack = null
  let taskStack = $('#task-stack').val()
  const taskId = now
  const count = parseInt($('#count-select').val()) || 1
  const startDate = new Date(Date.parse($('#start-date').val()) || now).getTime()
  const monthDay = parseInt($('#choose-recur input:radio:checked').val()) || 0
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
    if ($(this).find('.check-label').text() !== 'New Subtask' && $(this).find('.check-label').text().trim() !== '') {
      const newSubtaskData = {
        SubtaskId: now + offset,
        Checked: $(this).find('.check-checkbox').hasClass('check-checked'),
        Text: $(this).find('.check-label').text().trim()
      }
      subtasks.push(newSubtaskData)
      offset++
    }
  })
  // $('#check-sun').prop('checked') && weekDay.push(0)
  // $('#check-mon').prop('checked') && weekDay.push(1)
  // $('#check-tue').prop('checked') && weekDay.push(2)
  // $('#check-wed').prop('checked') && weekDay.push(3)
  // $('#check-thu').prop('checked') && weekDay.push(4)
  // $('#check-fri').prop('checked') && weekDay.push(5)
  // $('#check-sat').prop('checked') && weekDay.push(6)
  // if (weekDay.length < 1 && monthDay > 0) {
  //   weekDay.push(new Date(startDate).getDay())
  // }
  // count *= weekDay.length > 0 ? weekDay.length + 1 : 1
  if (startDate > now || count !== 1) {
    scheduleStack = taskStack
    taskStack = 'stack-schedule'
  }
  const newTaskData = {
    TaskStack: taskStack,
    ScheduleStack: scheduleStack,
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
    getTask.ScheduleStack = scheduleStack
  }
  this.saveTasks()
  return this.addTask(newTaskData)
}

// Clone task to 'do'
exports.cloneTask = (taskId, taskStack) => {
  if (taskId) {
    const getTask = this.taskList.find(task => task.TaskId === taskId)
    const now = Date.now()
    const newTaskStack = taskStack !== undefined ? taskStack : getTask.StartDate > now ? 'stack-schedule' : 'stack-do'
    const subtasks = getTask.Subtasks
    if (subtasks) { subtasks.forEach((sub) => { sub.Checked = false }) }
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
      Subtasks: subtasks,
      StackDate: now,
      UpdateTimestamp: now
    }
    this.taskList.push(newTaskData)
    this.saveTasks()
    this.addTask(newTaskData)
  }
}

// Add task(s) to UI
exports.addTask = (task) => {
  // Reomove existing card
  $(`#${task.TaskId}`).remove()
  // Add task tags
  let tagHTML = ''
  if (task.Tags && task.Tags.length > 0) {
    task.Tags.forEach((tag) => {
      if (task.TaskStack !== 'stack-archive' && task.TaskStack !== 'stack-schedule') {
        this.tagList.push(tag)
      }
      let tagColor = `#${asciiToHex(tag)}`
      tagColor = hexToHSL(tagColor, 60)
      tagHTML += `<div class="tags" style="background-color: ${tagColor}">${tag}</div>`
    })
  }
  // Add subtasks
  let subtaskHTML = ''
  if (task.Subtasks && task.Subtasks.length > 0) {
    task.Subtasks.forEach((subtask) => {
      const checked = subtask.Checked === true ? 'fa-check-square check-checked' : 'fa-square check-unchecked'
      subtaskHTML += `<div class="check-host" id="${subtask.SubtaskId}">
                        <div class="fas check-checkbox ${checked} check-card-checkbox"></div>
                        <label class="check-label check-card-label">${subtask.Text}</label>
                      </div>`
    })
  }
  // Color glyphs
  let colorGlyph = ''
  switch (task.TaskColor) {
    case 1:
      colorGlyph = 'cloud'
      break
    case 2:
      colorGlyph = 'heart'
      break
    case 3:
      colorGlyph = 'crown'
      break
    case 4:
      colorGlyph = 'carrot'
      break
    case 5:
      colorGlyph = 'tree'
      break
  }
  // Show color glyphs
  const showColorGlyphs = $('.color-glyph').is(':visible') ? '' : 'style="display: none;"'
  // Check if age is toggled
  const showAge = $('.aging').is(':visible') ? '' : 'style="display: none;"'
  // Check if archived and update archive tooltip to delete
  const archDelete = task.TaskStack === 'stack-archive' ? 'Delete' : 'Archive'
  // Show banded cards $('.card-bar').is(':visible')
  const bandedCards = $('.card-bar').is(':visible') ? '' : 'style="display: none;"'
  const colorCards = $('.card-bar').is(':visible') ? ' color-trans' : ''
  // Generate task card html
  const taskHtml = `<div class="card color-${task.TaskColor}${colorCards}" id="${task.TaskId}" draggable="true" ondragstart="drag(event)">
                      <div class="card-bar color-${task.TaskColor}"${bandedCards}></div>                    
                      <div class="card-header" style="clear: both" id="b${task.TaskId}" data-toggle="collapse" data-target="#c${task.TaskId}">
                        <span class="color-glyph fas fa-${colorGlyph}" ${showColorGlyphs}></span>
                        <span class="title">${task.TaskTitle}</span>
                        <span class="aging" id="a${task.TaskId}" ${showAge}></span>
                      </div>
                      <div class="card-content collapse collapse-content" id="c${task.TaskId}">
                        <div class="card-detail" id="d${task.TaskId}" contenteditable="true" style="white-space: pre-wrap;" draggable="true" ondragstart="event.preventDefault(); event.stopPropagation();">${task.TaskDetail}</div>
                        <div class="subtask-box">${subtaskHTML}</div>
                        <div class="tag-box" id="t${task.TaskId}">${tagHTML}</div>
                        <div class="card-menu">
                          <div class="card-menu-item fas fa-minus-square card-del-button" data-toggle="tooltip" title="${archDelete} Task" ></div>
                          <div class="card-menu-item fas fa-clone" id="clone-button-${task.TaskId}" data-toggle="tooltip" title="Clone Task"></div>
                          <div class="card-menu-item fas fa-clipboard" id="copy-button-${task.TaskId}" data-toggle="tooltip" title="Copy To Clipboard"></div>
                          <div class="card-menu-item fas fa-edit card-edit-button" data-toggle="tooltip" title="Edit Task"></div>
                        </div>
                      </div>
                    </div>`
  // Add task html to host
  $(`#${task.TaskStack}`).find('.box').append(taskHtml)
  // Add Ageing
  this.updateTaskAge(task.taskId)
  // Stop right-click on card invoking remove stack
  $(`#${task.TaskId}`).contextmenu((e) => {
    e.stopPropagation()
  })

  $(`#d${task.TaskId}`).on('dblclick', (e) => {
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
      this.updateTaskDetail(updTaskId, $(`#d${task.TaskId}`)[0].innerText || '')
      updTaskId = null
    }
  })
  // Clone active task (to 'do')
  $(`#clone-button-${task.TaskId}`).click(() => {
    this.cloneTask(task.TaskId)
  })
  // Copy task details to clipboard
  $(`#copy-button-${task.TaskId}`).click(() => {
    clipboard.writeText(`${task.TaskTitle}\n${task.TaskDetail}\n`)
  })
  // Initialize tooltips
  $(function () {
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 1500, hide: 100 } })
  })
  // Return the ID created
  return task.TaskColor + '' + task.TaskId
}

// Archive a specific task
exports.archiveTask = (taskId) => {
  if (taskId) {
    const id = parseInt(taskId)
    $('#stack-archive').find('.box').append($(`#${id}`))
    this.updateTaskStack(id, 'stack-archive')
    this.saveTasks()
  }
}

// Delete a specific task
exports.deleteTask = (taskId) => {
  if (taskId) {
    const id = parseInt(taskId)
    $(`#del-button-${id}`).tooltip('hide')
    $(`#${id}`).remove()
    this.taskList.find(task => task.TaskId === id).Tags.forEach(tag => {
      this.tagList.splice(this.tagList.indexOf(tag), 1)
    })
    this.taskList = this.taskList.filter(task => task.TaskId !== id)
    this.saveTasks()
    ipcRenderer.send('delete-task')
  }
}

// Archive a specific task
exports.restoreTask = (taskId) => {
  if (taskId) {
    const id = parseInt(taskId)
    $('#stack-do').find('.box').append($(`#${id}`))
    this.updateTaskStack(id, 'stack-do')
    this.saveTasks()
  }
}

// Convert hex color to HSL
function hexToHSL (hex, saturation) {
  // Convert hex to RGB first
  let r = 0
  let g = 0
  let b = 0
  if (hex.length === 4) {
    r = '0x' + hex[1] + hex[1]
    g = '0x' + hex[2] + hex[2]
    b = '0x' + hex[3] + hex[3]
  } else if (hex.length === 7) {
    r = '0x' + hex[1] + hex[2]
    g = '0x' + hex[3] + hex[4]
    b = '0x' + hex[5] + hex[6]
  }
  // Then to HSL
  r /= 255
  g /= 255
  b /= 255
  const cmin = Math.min(r, g, b)
  const cmax = Math.max(r, g, b)
  const delta = cmax - cmin
  let h = 0
  let s = 0
  let l = 0

  if (delta === 0) {
    h = 0
  } else if (cmax === r) {
    h = ((g - b) / delta) % 6
  } else if (cmax === g) {
    h = (b - r) / delta + 2
  } else {
    h = (r - g) / delta + 4
  }

  h = Math.round(h * 60)

  if (h < 0) { h += 360 }
  l = (cmax + cmin) / 2
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  s = saturation || +(s * 200).toFixed(1)
  l = +(l * 100).toFixed(1)
  return 'hsl(' + h + ',' + s + '%,' + l + '%)'
}

// Convert string to 6 character Hex
function asciiToHex (str) {
  const arr = []
  for (let i = 0, t = 3; i < t; i++) {
    for (let n = 0, l = str.length; n < l; n++) {
      const hex = Number(str.charCodeAt(n)).toString(16)
      arr.push(hex)
    }
  }
  return arr.join('').substring(0, 6)
}

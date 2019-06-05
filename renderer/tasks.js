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
      return;
    }
  }
}

// Add task to UI
exports.addTask = (task) => {
  let taskHTML = `<div class="card drag${task.TaskTheme}" id="${task.TaskId}" draggable="true" ondragstart="drag(event)">
                    <button id="b${task.TaskId}" class="collapsible">${task.TaskTitle}</button>
                    <div class="content">
                        <p>${task.TaskDetail}</p>
                    </div>
                  </div>`
  $(`#col${task.TaskStatus}`).append(taskHTML)
  $('#add-modal').modal('hide')
  // Attach collapse event
  $('.collapsible').off('click').on('click', function() {
      var content = this.nextElementSibling
      if (content.style.maxHeight){
        content.style.maxHeight = null
      } else {
        content.style.maxHeight = content.scrollHeight + "px"
      }
    })
}

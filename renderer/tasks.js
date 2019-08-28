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
  // let taskHTML = `<div class="card drag${task.TaskTheme}" id="${task.TaskId}" draggable="true" ondragstart="drag(event)">
  //                   <button data-toggle="collapse" data-target="#c${task.TaskId}" id="b${task.TaskId}" class="collapsible">${task.TaskTitle}</button>
  //                   <div class="collapse" id="c${task.TaskId}">
  //                     <p>${task.TaskDetail}</p>
  //                   </div>
  //                 </div>`
  let taskHTML = `<div class="card theme-${task.TaskTheme}" id="${task.TaskId}" draggable="true" ondragstart="drag(event)">
                    <div id="b${task.TaskId}" class="collapsible">${task.TaskTitle}</div>
                    <div class="collapse collapseContent" id="c${task.TaskId}">
                      <p style="white-space: pre-wrap;">${task.TaskDetail}</p>
                      <div class="cardMenu">
                        <div class="cardMenuItemDel fas fa-minus-square" id="del-button"></div>
                        <div class="cardMenuItemEdit fas fa-edit" id="edit-button"></div>
                      <div>
                    </div>
                  </div>`

  $(`#col${task.TaskStatus}`).append(taskHTML)

  $('#add-modal').modal('hide')

  $('.card').on('click', function() {
    window.activeTask = this.id
  })

  $('.cardMenuItemEdit').click(() => {
    $('#edit-modal').modal('show');
  })

  $('.cardMenuItemDel').click(() => {
    if(activeTask) {
      console.log("del")
      document.getElementById('colArchive').appendChild(document.getElementById(activeTask))
      tasks.updateTask(tasks.taskList, activeTask, 'Archive')
      tasks.saveTasks()
    }
  })

  $(`#${task.TaskId}`).mouseenter(
    function() {
       $(`#c${task.TaskId}`).collapse('show')

     }//, function() {
       //$(`#c${task.TaskId}`).collapse('hide')
     //}
   );
  //  $(`#c${task.TaskId}`).mouseout(
  //   function() {
  //      $(`#c${task.TaskId}`).collapse('hide')
  //    }
  //  );
  // $('.collapsible').off('click').on('click', function() {
  //   var content = this.nextElementSibling
  //   if (content.style.maxHeight){
  //     content.style.maxHeight = null
  //   } else {
  //     content.style.maxHeight = content.scrollHeight + "px"
  //   }
  // })
}
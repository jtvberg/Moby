// Modules and variable definition
const { ipcRenderer, remote } = require('electron')

// IPC event/channel to act on reset of form
ipcRenderer.on('quick-reset', () => {
  $('#quick-task-form').trigger('reset')
  $('#quick-task-detail').height('48px')
  $('#color-option-1').closest('.btn').button('toggle')
  $('#submit-button-group').children('.submit-button').remove()
  const stacks = JSON.parse(localStorage.getItem('stackList'))
  let i = 1
  stacks.forEach(stack => {
    if (i < stacks.length) {
      makeSubmitButton(stack.StackId, stack.StackTitle)
      i++
    }
  })
  $('#quick-task-title').trigger('focus')
})

// IPC call to set quick menu theme
ipcRenderer.on('quick-theme', (e, data) => {
  setTheme(data)
})

// IPC call to set quick menu glyph toggle
ipcRenderer.on('quick-glyph', (e, data) => {
  toggleColorGlyphs(data)
})

// Task creation from tray window; takes type as parameter from submit by type buttons
function quickTask (type) {
  const taskId = Date.now()
  const newTaskData = {
    TaskStack: type,
    TaskId: taskId,
    TaskTitle: $('#quick-task-title').val() || 'No Title',
    TaskDetail: $('#quick-task-detail').val(),
    TaskColor: $('#quick-choose-color input:radio:checked').val() || 1,
    Count: 1,
    StartDate: taskId,
    WeekDay: [],
    MonthDay: 0,
    StackDate: taskId,
    Tags: []
  }
  // IPC event/channel to send new task data to app via main
  ipcRenderer.send('quick-task', newTaskData)
  remote.getCurrentWindow().hide()
}

// Make quick submit buttons against available stacks
function makeSubmitButton (stackId, stackTitle) {
  const btnHtml = `<button id="${stackId}" type="button" class="btn btn-primary btn-sm submit-button">${stackTitle}</button>`
  $('#submit-button-group').append(btnHtml)
  // Submit task from tray window events
  $(`#${stackId}`).on('click', (e) => {
    quickTask(e.currentTarget.id)
  })
}

// Set theme
function setTheme (themeId) {
  $('.css-theme').prop('disabled', true)
  $(`#${themeId}`).prop('disabled', false)
}

// Toggle color glyphs on tasks handler
function toggleColorGlyphs (check) {
  if (check === true) {
    $('.color-glyph-edit').show()
  } else {
    $('.color-glyph-edit').hide()
  }
}

// Size task detail on input
$('#quick-task-detail').on('input keydown', function () {
  if (this.scrollHeight > $('#quick-task-detail').height() + 12) {
    $('#quick-task-detail').height(this.scrollHeight + 'px')
  }
})

// Ignore enter on title
$('#quick-task-title').on('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault()
  }
})

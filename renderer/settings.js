
exports.mobySettings = JSON.parse(localStorage.getItem('mobySettings'))

exports.defaultSettings = () => {
  const settings = {
    Theme: 'default',
    ColorGlyphs: false,
    Aging: false,
    DblClick: false,
    GhToggle: false
  }
  localStorage.setItem('mobySettings', JSON.stringify(settings))
}

exports.saveSettings = (themeId) => {
  const theme = themeId || this.mobySettings.Theme
  const settings = {
    Theme: theme,
    ColorGlyphs: $('#settings-glyphs').hasClass('check-checked'),
    Aging: $('#settings-aging').hasClass('check-checked'),
    DblClick: $('#settings-dblclick').hasClass('check-checked'),
    GhToggle: $('#settings-github-toggle').hasClass('check-checked')
  }
  localStorage.setItem('mobySettings', JSON.stringify(settings))
  console.log(settings)
}

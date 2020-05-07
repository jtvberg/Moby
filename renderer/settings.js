// Track app settings list
exports.mobySettings = JSON.parse(localStorage.getItem('mobySettings')) || []

// Refresh app settings list
exports.refreshSettings = () => {
  this.mobySettings = JSON.parse(localStorage.getItem('mobySettings'))
}

// Apply default settings
exports.defaultSettings = () => {
  const settings = {
    Theme: 'default',
    ColorGlyphs: false,
    BandedCards: false,
    Aging: false,
    DblClick: false,
    ArchiveDone: 7,
    ArchivePrune: 120,
    ServToggle: false,
    GhToggle: false,
    SnToggle: false
  }
  localStorage.setItem('mobySettings', JSON.stringify(settings))
  this.mobySettings = JSON.parse(localStorage.getItem('mobySettings'))
}

// Save settings to local storage
exports.saveSettings = (themeId) => {
  const theme = themeId || this.mobySettings.Theme
  const colorGlyphs = themeId ? this.mobySettings.ColorGlyphs : $('#settings-glyphs').hasClass('check-checked')
  const bandedCards = themeId ? this.mobySettings.BandedCards : $('#settings-bands').hasClass('check-checked')
  const aging = themeId ? this.mobySettings.Aging : $('#settings-aging').hasClass('check-checked')
  const dblClick = themeId ? this.mobySettings.DblClick : $('#settings-dblclick').hasClass('check-checked')
  const archiveDone = themeId ? this.mobySettings.ArchiveDone : parseInt($('#choose-archive input:radio:checked').val()) || 7
  const archivePrune = themeId ? this.mobySettings.ArchivePrune : parseInt($('#choose-prune input:radio:checked').val()) || 0
  const servToggle = themeId ? this.mobySettings.ServToggle : $('#settings-serv-toggle').hasClass('check-checked')
  const ghToggle = themeId ? this.mobySettings.GhToggle : $('#settings-github-toggle').hasClass('check-checked')
  const snToggle = themeId ? this.mobySettings.SnToggle : $('#settings-servicenow-toggle').hasClass('check-checked')

  const settings = {
    Theme: theme,
    ColorGlyphs: colorGlyphs,
    BandedCards: bandedCards,
    Aging: aging,
    DblClick: dblClick,
    ArchiveDone: archiveDone,
    ArchivePrune: archivePrune,
    ServToggle: servToggle,
    GhToggle: ghToggle,
    SnToggle: snToggle
  }
  localStorage.setItem('mobySettings', JSON.stringify(settings))
  this.mobySettings = JSON.parse(localStorage.getItem('mobySettings'))
}

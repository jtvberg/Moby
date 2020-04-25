// Track app settings list
exports.mobySettings = JSON.parse(localStorage.getItem('mobySettings'))

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
    ArchivePrune: 120,
    GhToggle: false
  }
  localStorage.setItem('mobySettings', JSON.stringify(settings))
}

// Save settings to local storage
exports.saveSettings = (themeId) => {
  const theme = themeId || this.mobySettings.Theme
  const colorGlyphs = themeId ? this.mobySettings.ColorGlyphs : $('#settings-glyphs').hasClass('check-checked')
  const bandedCards = themeId ? this.mobySettings.BandedCards : $('#settings-bands').hasClass('check-checked')
  const aging = themeId ? this.mobySettings.Aging : $('#settings-aging').hasClass('check-checked')
  const dblClick = themeId ? this.mobySettings.DblClick : $('#settings-dblclick').hasClass('check-checked')
  const archivePrune = themeId ? this.mobySettings.ArchivePrune : parseInt($('#choose-prune input:radio:checked').val()) || 0
  const ghToggle = themeId ? this.mobySettings.GhToggle : $('#settings-github-toggle').hasClass('check-checked')

  const settings = {
    Theme: theme,
    ColorGlyphs: colorGlyphs,
    BandedCards: bandedCards,
    Aging: aging,
    DblClick: dblClick,
    ArchivePrune: archivePrune,
    GhToggle: ghToggle
  }
  localStorage.setItem('mobySettings', JSON.stringify(settings))
  this.mobySettings = JSON.parse(localStorage.getItem('mobySettings'))
}

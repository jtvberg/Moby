// Track app settings list
exports.mobySettings = JSON.parse(localStorage.getItem('mobySettings')) || []

// Refresh app settings list
exports.refreshSettings = () => {
  this.mobySettings = JSON.parse(localStorage.getItem('mobySettings'))
}

// Apply default settings
exports.defaultSettings = (fill) => {
  let settings = []
  if (fill) {
    settings = {
      Theme: this.mobySettings.Theme || 'default',
      ColorGlyphs: this.mobySettings.ColorGlyphs || false,
      BandedCards: this.mobySettings.BandedCards || false,
      Aging: this.mobySettings.Aging || false,
      DblClick: this.mobySettings.DblClick || false,
      ArchiveDone: this.mobySettings.ArchiveDone || 7,
      ArchivePrune: this.mobySettings.ArchivePrune || 120,
      ServToggle: this.mobySettings.ServToggle || false,
      GhToggle: this.mobySettings.GhToggle || false,
      SnToggle: this.mobySettings.SnToggle || false,
      SnDomain: this.mobySettings.SnDomain || '',
      SnToken: this.mobySettings.SnToken || ''
    }
  } else {
    settings = {
      Theme: 'default',
      ColorGlyphs: false,
      BandedCards: false,
      Aging: false,
      DblClick: false,
      ArchiveDone: 7,
      ArchivePrune: 120,
      ServToggle: false,
      GhToggle: false,
      SnToggle: false,
      SnDomain: '',
      SnToken: ''
    }
  }
  this.mobySettings = settings
  localStorage.setItem('mobySettings', JSON.stringify(this.mobySettings))
}

// Save settings to local storage
exports.saveSettings = (themeId) => {
  if (themeId) {
    this.mobySettings.Theme = themeId
  } else {
    const settings = {
      Theme: this.mobySettings.Theme,
      ColorGlyphs: $('#settings-glyphs').hasClass('check-checked'),
      BandedCards: $('#settings-bands').hasClass('check-checked'),
      Aging: $('#settings-aging').hasClass('check-checked'),
      DblClick: $('#settings-dblclick').hasClass('check-checked'),
      ArchiveDone: parseInt($('#choose-archive input:radio:checked').val()) || 7,
      ArchivePrune: parseInt($('#choose-prune input:radio:checked').val()) || 0,
      ServToggle: $('#settings-serv-toggle').hasClass('check-checked'),
      GhToggle: $('#settings-github-toggle').hasClass('check-checked'),
      SnToggle: $('#settings-servicenow-toggle').hasClass('check-checked'),
      SnDomain: $('#settings-servicenow-domain').val().trim(),
      SnToken: $('#settings-servicenow-token').val().trim()
    }
    this.mobySettings = settings
  }
  localStorage.setItem('mobySettings', JSON.stringify(this.mobySettings))
}

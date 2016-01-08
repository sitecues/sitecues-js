// TODO do not incude in extension -- not used
define(['core/bp/model/state', 'core/conf/site', 'core/bp/constants'], function(state, site, BP_CONST) {
  var isInitialized,
    lastBgColor;

  function checkBackgroundColorChange(doForceBadgeUpdate) {
    var newBgColor = getBackgroundColor(),
      doBadgeUpdate = doForceBadgeUpdate;

    if (newBgColor !== lastBgColor) {
      lastBgColor = newBgColor;
      doBadgeUpdate = true;
    }

    if (doBadgeUpdate) {
      sitecues.emit('bp/did-change');
      if (SC_DEV) { console.log('Updating badge palette'); }
    }
  }

  function getBackgroundColor() {
    return getComputedStyle(document.body).backgroundColor;
  }

  // Input event has occurred that may trigger a theme change produced from the website code
  // (as opposed to sitecues-based themes). For example, harpo.com, cnib.ca, lloydsbank have their own themes.
  function onPossibleWebpageThemeChange() {
    setTimeout(checkBackgroundColorChange, 0);
  }

  // Listen for change in the web page's custom theme (as opposed to the sitecues-based themes).
  // We don't know when they occur so we check shortly after a click or keypress.
  function addWebPageThemeListener() {
    document.body.addEventListener('click', onPossibleWebpageThemeChange);
    document.body.addEventListener('keyup', onPossibleWebpageThemeChange);
    lastBgColor = getBackgroundColor();
  }

  // Listen for changes in the sitecues theme
  function addSitecuesThemeListener() {
    sitecues.on('theme/did-apply', onSitecuesThemeChange);
  }

  function onSitecuesThemeChange(newTheme) {
    // If sitecues theme changes to dark, force adaptive palette. Otherwise use default palette.
    state.set('isAdaptivePalette', newTheme === 'dark');
    checkBackgroundColorChange(true);
  }

  function getBadgePalette(badgeElem, overridePaletteName) {
    var paletteName = overridePaletteName || site.get('palette') || '',
      fullNames = Object.keys(BP_CONST.PALETTE_NAME_MAP),
      index = 0;

    // Check for a string because site.get('palette')
    // returns an Object if a custom palette is used.
    if (typeof paletteName === 'string') {

      for (; index < fullNames.length; index ++) {
        var fullName = fullNames[index];
        if (paletteName.indexOf(fullName) >= 0) {
          return BP_CONST.PALETTE_NAME_MAP[fullName];
        }
      }

    }

    return '';
  }

  function init(badgeElement, overridePaletteName) {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    var paletteName = getBadgePalette(badgeElement, overridePaletteName);
    if (paletteName === BP_CONST.PALETTE_NAME_MAP.adaptive) {
      state.set('isAdaptivePalette', true);
      addWebPageThemeListener();
    }

    addSitecuesThemeListener();

    state.set('paletteName', paletteName);
  }

  return {
    init: init
  };
});

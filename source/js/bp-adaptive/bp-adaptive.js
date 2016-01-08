/**
 * Handle theme changes either from website itself or from sitecues,
 * and automatically adjust the badge palette colors if the background changes (e.g. from white to black)
 *
 * For theme changes implemented by the web page itself:
 * - Listen for user input and check the page background to see if it changed via onWebPageThemeChange()
 *
 * For theme changes implemented by sitecues:
 * - Get notification of theme change via onSitecuesThemeChange()
 * TODO Do not include in extension, not used
 */
define(['core/bp/model/state'], function(state) {
  var lastBgColor;

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

  function onSitecuesThemeChange(newTheme) {
    // If sitecues theme changes to dark, force adaptive palette. Otherwise use default palette.
    state.set('isAdaptivePalette', newTheme === 'dark');
    checkBackgroundColorChange(true);
  }

  // Input event has occurred that may trigger a theme change produced from the website code
  // (as opposed to sitecues-based themes). For example, harpo.com, cnib.ca, lloydsbank have their own themes.
  function onPossibleWebpageThemeChange() {
    setTimeout(checkBackgroundColorChange, 0);
  }

  // Listen for change in the web page's custom theme (as opposed to the sitecues-based themes).
  // We don't know when they occur so we check shortly after a click or keypress.
  function initAdaptivePalette() {
    state.set('isAdaptivePalette', true);

    document.body.addEventListener('click', onPossibleWebpageThemeChange);
    document.body.addEventListener('keyup', onPossibleWebpageThemeChange);
    lastBgColor = getBackgroundColor();
  }

  return {
    initAdaptivePalette: initAdaptivePalette,
    onSitecuesThemeChange: onSitecuesThemeChange
  };
});

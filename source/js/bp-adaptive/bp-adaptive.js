/**
 * Handle theme changes either from website itself or from sitecues,
 * and automatically adjust the badge palette colors if the background changes (e.g. from white to black)
 *
 * For theme changes implemented by the web page itself:
 * - Listen for user input and check the page background to see if it changed via onWebPageThemeChange()
 *
 * For theme changes implemented by sitecues:
 * - Get notification of theme change via onSitecuesThemeChange()
 */
define(['core/bp/model/state', 'core/bp/view/view', 'core/bp/constants'], function(state, bpView, BP_CONST) {
  var lastBgColor;

  function getBadgeElem() {
    return document.getElementById(BP_CONST.BADGE_ID);
  }

  function checkBackgroundColorChange(onPaletteUpdate, doForceBadgeUpdate) {
    var newBgColor = getBackgroundColor(),
      doBadgeUpdate = doForceBadgeUpdate;

    if (newBgColor !== lastBgColor) {
      lastBgColor = newBgColor;
      doBadgeUpdate = true;
    }

    if (doBadgeUpdate) {
      require(['page/util/color'], function(colorUtil) {
        if (SC_DEV) { console.log('Updating badge palette'); }
        var badgeElem = getBadgeElem();
        state.set('paletteKey', colorUtil.isOnDarkBackground(badgeElem) ? BP_CONST.PALETTE_NAME_REVERSE_BLUE : getDefaultPalette());
        if (onPaletteUpdate) {
          onPaletteUpdate();
        }
      });
    }
  }

  function getDefaultPalette() {
    return state.get('defaultPaletteKey');
  }

  function getBackgroundColor() {
    return getComputedStyle(document.body).backgroundColor;
  }

  function adaptToSitecuesThemeChange(newTheme) {
    if (state.get('isToolbarBadge')) {
        return; // Toolbars don't adapt to theme changes
    }
    // If sitecues theme changes to dark, force adaptive palette. Otherwise use default palette.
    state.set('isAdaptivePalette', newTheme === 'dark');
    checkBackgroundColorChange(bpView.update, true);
  }

  // Input event has occurred that may trigger a theme change produced from the website code
  // (as opposed to sitecues-based themes). For example, harpo.com, cnib.ca, lloydsbank have their own themes.
  function onPossibleWebpageThemeChange() {
    setTimeout(function() {
      checkBackgroundColorChange(bpView.update);
    }, 0);
  }

  // Listen for change in the web page's custom theme (as opposed to the sitecues-based themes).
  // We don't know when they occur so we check shortly after a click or keypress.
  function initAdaptivePalette(onPaletteUpdate) {
    state.set('isAdaptivePalette', true);

    document.body.addEventListener('click', onPossibleWebpageThemeChange);
    document.body.addEventListener('keyup', onPossibleWebpageThemeChange);
    checkBackgroundColorChange(onPaletteUpdate, true);
  }

  return {
    initAdaptivePalette: initAdaptivePalette,
    adaptToSitecuesThemeChange: adaptToSitecuesThemeChange
  };
});

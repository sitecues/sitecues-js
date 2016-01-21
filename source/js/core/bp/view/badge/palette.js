// Badge palette code.
// Not included in the extension since that always uses the same colors in the toolbar.
define(['core/bp/model/state', 'core/conf/site', 'core/bp/constants'], function(state, site, BP_CONST) {

  // badgeFileName is optional, and used in the case of old <img> badge placeholders.
  // In that case the filename defines which palette to use, e.g. sitecues-badge-reverse-blue.png
  // If no badge file name, check the site preferences for a palette
  // Otherwise use the default palette.
  // Custom palettes are a different story ...
  function getSimplePaletteType(badgeFileName) {
    var paletteName = badgeFileName || site.get('palette') || '',
      paletteMap = BP_CONST.PALETTE_NAME_MAP,
      fullNames = Object.keys(paletteMap),
      index = 0;

    // Check for a string because site.get('palette')
    // returns an Object if a custom palette is used.
    if (typeof paletteName === 'string') {
      for (; index < fullNames.length; index ++) {
        var fullName = fullNames[index];
        if (paletteName.indexOf(fullName) >= 0) {
          return fullNames[index];
        }
      }
    }

    return '';
  }

  // initialize the badge color palette support
  // @badgeFileName is optional -- provided when the badge is from an <img>, which clues us into the palette
  function init(badgeFileName, onComplete) {

    var paletteKey = getSimplePaletteType(badgeFileName);
    if (paletteKey === BP_CONST.PALETTE_NAME_ADAPTIVE) {
      require(['bp-adaptive/bp-adaptive'], function(bpAdaptive) {
        state.set('defaultPaletteKey', BP_CONST.PALETTE_NAME_NORMAL);
        bpAdaptive.initAdaptivePalette(onComplete);
      });
    }
    else {
      state.set('defaultPaletteKey', paletteKey);
      state.set('paletteKey', paletteKey);
      onComplete();
    }
  }

  return {
    init: init
  };
});

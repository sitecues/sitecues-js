// TODO do not incude in extension -- not used
define(['core/bp/model/state', 'core/conf/site', 'core/bp/constants'], function(state, site, BP_CONST) {
  function getBadgePalette(badgeFileName) {
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
          return paletteMap[fullName];
        }
      }
    }

    return '';
  }

  // initialize the badge color palette support
  // @badgeFileName is optional -- provided when the badge is from an <img>, which clues us into the palette
  function init(badgeFileName) {
    var paletteName = getBadgePalette(badgeFileName);
    if (paletteName === BP_CONST.PALETTE_NAME_MAP.adaptive) {
      require(['bp-adaptive/bp-adaptive'], function(bpAdaptive) {
        bpAdaptive.initAdaptivePalette();
      });
    }

    state.set('paletteName', paletteName);
  }

  return {
    init: init
  };
});

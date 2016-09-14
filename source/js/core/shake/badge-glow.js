/**
 * Badge glow feature
 * - Badge glows based on mouse shake
 */
define([
  'core/events',
  'core/bp/constants',
  'core/bp/view/view'
], function(events,
            BP_CONST,
            badgeView) {

  var
    isFirstGlow = true,
    isToolbar,
    badgeElem,
    badgeStyle,
    origCss,
    TRANSITION_MS = 400;

  function willExpand() {
    changeBadgeGlow(false);
  }

  function getHslString(hue, saturation, lightness) {
    return 'hsl(' + hue + ',' + saturation + '%,' + lightness + '%)';
  }

  function isDarkBadge() {
    function getFastLuminance(rgb) {
      var DIVISOR = 2550; // 255 * (2 + 7 + 1)
      return (rgb.r*2 + rgb.g*7 + rgb.b) / DIVISOR;
    }

    function getRgb(rgbString) {
      var MATCH_COLORS = /rgba?\((\d+), ?(\d+), ?(\d+)/,
        match = MATCH_COLORS.exec(rgbString) || {};

      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }

    var smallAElement = document.getElementById(BP_CONST.SMALL_A_ID),
      smallAColor = getRgb(getComputedStyle(smallAElement).fill),
      DARK_THRESHOLD = 0.6,
      luminance = getFastLuminance(smallAColor);

    return luminance < DARK_THRESHOLD;
  }

  function getDarkGlow() {
    var HUE = 245, // Out of 360
      SATURATION = 62, // Out of 100
      LIGHTNESS = 34; // Out of 100

    return getHslString(HUE, SATURATION, LIGHTNESS);
  }

  function getLightGlow() {
    var HUE = 50, // Out of 360
      SATURATION = 72, // Out of 100
      LIGHTNESS = 88; // Out of 100

    return getHslString(HUE, SATURATION, LIGHTNESS);
  }

  function changeBadgeGlow(isOn) {
    if (isOn) {
      if (isFirstGlow) {
        onFirstGlow();
        isFirstGlow = false;
      }
      var color = isDarkBadge() ? getLightGlow() : getDarkGlow(),
        bgColor = color,
        boxShadow = '-3px 2px 5px 12px ' + color;

      badgeStyle.backgroundColor = bgColor;
      badgeStyle.boxShadow = boxShadow;
    }
    else {
      badgeElem.setAttribute('style', origCss);
    }
  }

  function getBadge() {
    return document.getElementById('sitecues-badge');
  }

  function onFirstGlow() {
    // Badge glow not available while BP is open
    events.on('bp/will-expand', willExpand);

    badgeElem = getBadge();
    isToolbar = badgeView.isToolbar();
    badgeStyle = badgeElem.style;
    badgeStyle.transition = 'background-color ' + TRANSITION_MS + 'ms, box-shadow ' + TRANSITION_MS + 'ms';
    badgeStyle.borderColor = 'transparent';
    if (!isToolbar) {
      badgeStyle.borderRadius = '99px'; // Rounded glow
    }
    origCss = badgeStyle.cssText;
  }

  function init() {
    // Badge glow
    events.on('shake/did-pass-threshold', changeBadgeGlow);
  }

  return {
    init: init
  };
});


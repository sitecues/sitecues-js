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
    var HUE = 230, // Out of 360
      SATURATION = 62, // Out of 100
      LIGHTNESS = 44; // Out of 100

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
        boxShadow = '-3.5px 2px 4px 10px ' + color;

      badgeStyle.backgroundColor = bgColor;
      if (!isToolbar) {
        badgeStyle.borderColor = 'transparent';
        badgeStyle.boxShadow = boxShadow;
        if (!isToolbar && getComputedStyle(badgeElem).borderRadius === '0px') {
          badgeStyle.borderRadius = '99px'; // Rounded glow
        }
      }
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

    isToolbar = badgeView.isToolbar();
    badgeStyle = badgeElem.style;
    badgeStyle.transition = 'background-color ' + TRANSITION_MS + 'ms, border-radius ' + TRANSITION_MS * 1.5 + 'ms, box-shadow ' + TRANSITION_MS + 'ms';
    origCss = badgeStyle.cssText;
  }

  // Only allow glow if it won't be clipped by an ancestor
  function isGlowAllowed() {
    badgeElem = getBadge();
    var ancestor = badgeElem,
      badgeRect = badgeElem.getBoundingClientRect(),
      SAFETY_ZONE = 10,
      safeRect = {
        left: badgeRect.left - SAFETY_ZONE,
        right: badgeRect.right + SAFETY_ZONE,
        top: badgeRect.top - SAFETY_ZONE,
        bottom: badgeRect.bottom + SAFETY_ZONE
      },
      css,
      rect;
    while (ancestor) {
      css = getComputedStyle(ancestor);
      if (css.overflow !== 'visible' || css.clip !== 'auto') {
        return false;
      }
      ancestor = ancestor.parentElement;
      if (ancestor === document.documentElement) {
        break;
      }

      rect = ancestor.getBoundingClientRect();
      if (rect.left < safeRect.left && rect.top < safeRect.top && rect.right > safeRect.right && rect.bottom > safeRect.bottom) {
        break; // No need to keep checking for clip
      }
    }

    return true;
  }

  function init() {
    // Badge glow
    if (isGlowAllowed()) {
      events.on('shake/did-pass-threshold', changeBadgeGlow);
    }
  }

  return {
    init: init
  };
});


/**
 * Badge glow feature
 * - Badge glows based on mouse shake
 */
define([
  'core/events',
  'core/bp/constants',
  'core/bp/view/view',
  'core/inline-style/inline-style'
], function(events,
            BP_CONST,
            badgeView,
            inlineStyle) {

  var
    isFirstGlow = true,
    isToolbar,
    badgeElem,
    badgeStyle,
    TRANSITION_MS = 800,
    TIMING_FUNCTION = 'ease-out',
    CSS_TRANSITION = TIMING_FUNCTION + ' ' + TRANSITION_MS + 'ms';

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
    var HUE = 56, // Out of 360 (56 = yellow, 210 = light blue)
      SATURATION = 100, // Out of 100
      LIGHTNESS = 90; // Out of 100

    return getHslString(HUE, SATURATION, LIGHTNESS);
  }

  function changeBadgeGlow(isOn) {
    if (isOn) {
      if (isFirstGlow) {
        onFirstGlow();
        isFirstGlow = false;
      }
      var color = isDarkBadge() ? getLightGlow() : getDarkGlow();

      var newStyles = {
        backgroundColor: color
      };
      if (!isToolbar) {
        //boxShadow = '-3.5px 2px 12px 10px ' + color;
        newStyles.boxShadow = '-4px 2px 20px 0px ' + color  + ', -4px 2px 32px 6px ' + color + ', -4px 2px 44px 6px ' + color;
      }
      inlineStyle.override(badgeElem, newStyles);
    }
    else {
      inlineStyle.restore(badgeElem);
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
    badgeStyle.transition = 'background-color ' + CSS_TRANSITION + ', box-shadow ' + CSS_TRANSITION;
  }

  // Only allow glow if it won't be clipped by an ancestor
  function isGlowAllowed() {
    badgeElem = getBadge();
    var ancestor = badgeElem,
      badgeRect = badgeElem.getBoundingClientRect(),
      SAFETY_ZONE = 6,
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
    else {
      if (SC_DEV) {
        console.log('Sitecues badge glow disallowed');
      }
    }
  }

  return {
    init: init
  };
});


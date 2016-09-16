/**
 * Badge glow feature
 * - Badge glows based on mouse shake
 */
define([
  'core/events',
  'core/bp/constants',
  'core/bp/view/view',
  'core/native-functions',
  'core/inline-style/inline-style'
], function(events,
            BP_CONST,
            badgeView,
            nativeFn,
            inlineStyle) {

  var
    isFirstGlow = true,
    isToolbar,
    badgeElem,
    badgeStyle,
    pulseTimer,
    TRANSITION_MS = 600,
    TIMING_FUNCTION = 'ease-in-out',
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
    var HUE = 210, // Out of 360 (56 = yellow, 210 = light blue)
      SATURATION = 100, // Out of 100
      LIGHTNESS = 90; // Out of 100

    return getHslString(HUE, SATURATION, LIGHTNESS);
  }

  function getBoxShadow(color, multiplier) {
    function getLayer(size, offset) {
      return '0 0 ' + size * multiplier + 'px ' + offset * multiplier + 'px ' + color;
    }
    return ['0 0 3px 1px ' + color, getLayer(4, 2), getLayer(15, 3), getLayer(22,6),  getLayer(30, 6)].join(',');
  }

  function changeBadgeGlow(isOn) {
    var pulseNum = 0,
      MAX_PULSES = 5,
      color;
    function pulse() {
      inlineStyle.set(badgeElem, {
        boxShadow: getBoxShadow(color, pulseNum % 2 ? 2.2 : 1.2)
      });
      if (++pulseNum < MAX_PULSES) {
        pulseTimer = nativeFn.setTimeout(pulse, TRANSITION_MS);
      }
    }

    if (isOn) {
      if (isFirstGlow) {
        onFirstGlow();
        isFirstGlow = false;
      }
      color = isDarkBadge() ? getLightGlow() : getDarkGlow();
      var newStyles = {
        backgroundColor: color
      };
      if (!isToolbar) {
        newStyles.boxShadow = getBoxShadow(color, 2.2);
        // Pulse the box shadow
        pulseTimer = nativeFn.setTimeout(pulse, TRANSITION_MS);
      }
      inlineStyle.override(badgeElem, newStyles);
    }
    else {
      clearTimeout(pulseTimer);
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


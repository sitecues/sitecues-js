/**
 * Badge glow feature
 * - Badge glows based on mouse shake
 */
define([
  'core/events',
  'core/native-functions'
], function(events,
            nativeFn) {

  var isPanelOpen,
    badgeSvgStyle,
    lastGlowPercent,
    FADE_TIME_MS = 100,
    FADE_PERCENT = 3,
    isGlowPrevented,
    GLOW_COLOR = 'rgba(255, 223, 31, .7)',
    fadeTimeout;

  function willExpand() {
    isPanelOpen = true;
    changeBadgeGlow(0);
  }

  function didShrink() {
    isPanelOpen = false;
    isGlowPrevented = false;
  }

  function changeBadgeGlow(glowPercent) {
    var MAX_BADGE_GLOW = 5,
      glowAmount = isPanelOpen ? 0 : MAX_BADGE_GLOW * glowPercent / 100,
      newFilter = 'drop-shadow( 0 0 ' + glowAmount + 'px ' + GLOW_COLOR + ' )';

    badgeSvgStyle.filter = newFilter;

    lastGlowPercent = glowPercent;

    clearTimeout(fadeTimeout);
    if (glowPercent) {
      fadeTimeout = nativeFn.setTimeout(fadeBadgeGlow, FADE_TIME_MS);
    }
  }

  function onShake(percent) {
    if (percent === 0) {
      isGlowPrevented = false;  // Shake has reached 0, we can allow glow again
    }
    if (!isGlowPrevented) {
      changeBadgeGlow(percent);
    }
  }

  // Unlike mouse size growth, badge glow looks better when it fades linearly from a timer
  function fadeBadgeGlow() {
    if (lastGlowPercent > 0) {
      var newGlowPercent = Math.max(0, lastGlowPercent - FADE_PERCENT);
      changeBadgeGlow(newGlowPercent);
      if (!newGlowPercent) {
        isGlowPrevented = true;
      }
    }
  }

  function getBadgeSvgStyle() {
    return document.getElementById('scp-svg').style;
  }

  function init() {
    // Badge glow
    events.on('core/mouseshake', onShake);
    // Badge glow not available while BP is open
    events.on('bp/will-expand', willExpand);
    events.on('bp/did-shrink', didShrink);

    badgeSvgStyle = getBadgeSvgStyle();
  }

  return {
    init: init
  };
});


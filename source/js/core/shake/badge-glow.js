/**
 * Badge glow feature
 * - Badge glows based on mouse shake
 */
define([
  'core/events'
], function(events) {

  var badgeStyle,
    HUE = 50, // Out of 360
    SATURATION = 72, // Out of 100
    LIGHTNESS = 88, // Out of 100
    TRANSITION_MS = 400;

  function willExpand() {
    changeBadgeGlow(false);
  }

  function onShakePassedThreshold(isOn) {
    changeBadgeGlow(isOn);
  }

  function changeBadgeGlow(isOn) {
    var MAX_BADGE_GLOW = 1,
      glowAmount = isOn ? MAX_BADGE_GLOW : 0,
      alpha = glowAmount,
      color = 'hsla(' + HUE + ',' + SATURATION + '%,' + LIGHTNESS + '%,' + alpha + ')',
      boxShadow = isOn ? '-3px 2px 5px 12px ' + color : 'none';

    badgeStyle.backgroundColor = color;
    badgeStyle.boxShadow = boxShadow;
  }

  function getBadgeStyle() {
    return document.getElementById('sitecues-badge').style;
  }

  function init() {
    // Badge glow
    events.on('shake/did-pass-threshold', onShakePassedThreshold);
    // Badge glow not available while BP is open
    events.on('bp/will-expand', willExpand);

    badgeStyle = getBadgeStyle();
    badgeStyle.borderRadius = '99px'; // Rounded glow
    badgeStyle.transition = 'background-color ' + TRANSITION_MS + 'ms, box-shadow ' + TRANSITION_MS + 'ms';
  }

  return {
    init: init
  };
});


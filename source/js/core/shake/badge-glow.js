/**
 * Badge glow feature
 * - Badge glows based on mouse shake
 */
define([
  'core/events'
], function(events) {

  var
    badgeElem,
    badgeStyle,
    origCss,
    HUE = 50, // Out of 360
    SATURATION = 72, // Out of 100
    LIGHTNESS = 88, // Out of 100
    TRANSITION_MS = 400;

  function willExpand() {
    changeBadgeGlow(false);
  }

  function changeBadgeGlow(isOn) {
    if (isOn) {
      var alpha = 1,
        color = 'hsla(' + HUE + ',' + SATURATION + '%,' + LIGHTNESS + '%,' + alpha + ')',
        bgColor = color,
        boxShadow = '-3px 2px 5px 12px ' + color;

      badgeStyle.borderRadius = '99px'; // Rounded glow
      badgeStyle.borderColor = 'transparent';
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

  function init() {
    // Badge glow
    events.on('shake/did-pass-threshold', changeBadgeGlow);
    // Badge glow not available while BP is open
    events.on('bp/will-expand', willExpand);

    badgeElem = getBadge();
    badgeStyle = badgeElem.style;
    badgeStyle.transition = 'background-color ' + TRANSITION_MS + 'ms, box-shadow ' + TRANSITION_MS + 'ms';
    origCss = badgeStyle.cssText;
  }

  return {
    init: init
  };
});


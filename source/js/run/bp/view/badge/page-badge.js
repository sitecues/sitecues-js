/**
 * Page badge view. Not included in the extension since that always uses the toolbar.
 */
define(
  [
    'run/bp/view/view',
    'run/bp/view/palette',
    'Promise',
    'run/inline-style/inline-style'
  ],
  function (
    baseView,
    palette,
    Promise,
    inlineStyle
  ) {
  'use strict';

  // Make sure the badge has non-static positioning to make it easy to place
  // the position: absolute sc-bp-container inside of it
  function ensureNonStaticPositioning(badge) {

    var existingPositionCss = getComputedStyle(badge).position;

    if (existingPositionCss === 'static') {
      inlineStyle(badge).position = 'relative';
    }
  }

  function initBadgeView(badge, badgeFileName) {
    return palette.init(badgeFileName)
      .then(function() {
        ensureNonStaticPositioning(badge);
        baseView.init(badge);
      });
  }

  function init(origBadgeElem) {
    return new Promise(function(resolve) {
      if (origBadgeElem.localName !== 'img') {
        // Normal placeholder badge
        return resolve({badgeElem: origBadgeElem});
      }
      // If a customer uses the <img> placeholder...
      require(['bp-img-placeholder/bp-img-placeholder'], function (imagePlaceHolder) {
        var newBadge = imagePlaceHolder.init(origBadgeElem);
        resolve({
          badgeElem: newBadge,
          origSrc: origBadgeElem.src
        });
      });
    }).then(function(badgeInfo) {
      return initBadgeView(badgeInfo.badgeElem, badgeInfo.origSrc);
    });
  }

  return {
    init: init
  };
});

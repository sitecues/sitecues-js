/**
 * Page badge view. Not included in the extension since that always uses the toolbar.
 */
define(
  [
    'core/bp/view/view',
    'core/bp/view/badge/palette'
  ],
  function(baseView, palette) {

  // Make sure the badge has non-static positioning to make it easy to place
  // the position: absolute sc-bp-container inside of it
  function ensureNonStaticPositioning(badge) {

    var existingPositionCss = getComputedStyle(badge).position;

    if (existingPositionCss === 'static') {
      badge.style.position = 'relative';
    }
  }

  function onBadgeReady(badge, onComplete, badgeFileName) {
    palette.init(badgeFileName, function() {
      ensureNonStaticPositioning(badge);
      baseView.init(badge, onComplete);
    });
  }

  function init(badge, onComplete) {
    if (badge.localName === 'img') {
      // If a customer uses the <img> placeholder...
      require(['bp-img-placeholder/bp-img-placeholder'], function(imagePlaceHolder) {
        var newBadge = imagePlaceHolder.init(badge);
        onBadgeReady(newBadge, onComplete, badge.src);
      });
    }
    else {
      // Normal placeholder badge
      onBadgeReady(badge, onComplete);
    }
  }

  return {
    init: init
  };

});

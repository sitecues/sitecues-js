/**
 * Badge view
 */
define(['core/bp/view/view'], function(baseView) {

  function init(badge, onComplete) {
    function onBadgeReady(badge, onComplete, badgeFileName) {
      require('core/bp/view/badge/palette', function(badgePalette) {
        badgePalette.init(badge, badgeFileName, function() {
          baseView.init(onComplete);
        });
      });
    }

    if (badge.localName === 'img') {
      // If a customer uses the <img> placeholder...
      require(['bp-img-placeholder/bp-img-placeholder'], function(imagePlaceHolder) {
        var newBadge = imagePlaceHolder.init(badge),
          badgeFileName = imagePlaceHolder.getFileName();
        onBadgeReady(newBadge, onComplete, badgeFileName);
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

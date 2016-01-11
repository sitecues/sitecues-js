/**
 * Badge view
 */
define(['core/bp/view/view', 'core/bp/view/badge/palette'], function(baseView, palette) {

  function init(badge, onComplete) {
    function onBadgeReady(badge, onComplete, badgeFileName) {
      palette.init(badge, badgeFileName, function() {
        baseView.init(badge, onComplete);
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

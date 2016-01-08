/**
 * Badge view
 */
define(['core/bp/view/badge/base-badge'], function(baseBadge) {

  function getViewClasses() {

    var classBuilder = BP_CONST.WANT_BADGE;

    if (state.isBadge()) {
      classBuilder += ' ' + BP_CONST.IS_BADGE;
    }

    if (state.get('isRealSettings')) {
      // *** scp-realsettings ***
      // Show the real settings for the badge (not the fake ones)
      // Why it's used:
      // The initial badge is easier-to-see, more attractive and more inviting when speech is on and zoom is
      // somewhere in the middle. Therefore the initial badge uses fake settings.
      // However, once the user has ever expanded the badge or used sitecues we show the real settings.
      classBuilder += ' scp-realsettings';
    }

    return classBuilder;
  }

  function init(badge, onComplete) {
    function onBadgeReady(badge, onComplete, badgeFileName) {
      require('core/bp/view/badge-palette', function(badgePalette) {
        badgePalette.init(badgeFileName);
      });

      // Finish callback right away:
      // Badge palette initialization does not need to complete before we move on
      baseBadge.init(onComplete);
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

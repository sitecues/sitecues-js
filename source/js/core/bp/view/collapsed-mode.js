/**
 * Badge and toolbar support
 */
define(['core/bp/constants', 'core/bp/model/state', 'core/locale', 'core/bp/helper', 'core/conf/site'],
  function(BP_CONST, state, locale, helper, site) {

  var isInitialized;

  /*
   *** Private ***
   */

  function isToolbarUIRequested() {
    return site.get('uiMode') === 'toolbar';
  }

  function onBadgeOrToolbarFound(badgeOrToolbarElement) {
    helper.setAttributes(badgeOrToolbarElement, BP_CONST.BADGE_ATTRS);
    labelBadgeOrToolbar(badgeOrToolbarElement);
  }

  function labelBadgeOrToolbar(badgeOrToolbarElement) {
    // Insert badge label into an element (using aria-label didn't work as NVDA cut off the label text at 100 characters)
    // The badge label will be absolutely positioned offscreen in order to not affect layout
    var badgeLabelElement = document.createElement('sc');
    badgeLabelElement.innerHTML = locale.translate(BP_CONST.STRINGS.BADGE_LABEL);
    badgeLabelElement.style.position = 'absolute';
    badgeLabelElement.style.left = '-9999px';

    badgeOrToolbarElement.appendChild(badgeLabelElement);
  }

  function onBadgeReady(badge, badgeFileName) {
    require('core/bp/view/badge-palette', function(badgePalette) {
      badgePalette.init(badgeFileName);
    });
    onBadgeOrToolbarFound(badge);
  }

  function onBadgeFound(badge) {
    if (badge.localName === 'img') {
      // If a customer uses the <img> placeholder...
      require(['bp-img-placeholder/bp-img-placeholder'], function(imagePlaceHolder) {
        var newBadge = imagePlaceHolder.init(badge),
          badgeFileName = imagePlaceHolder.getFileName();
        onBadgeReady(newBadge, badgeFileName);
      });
    }
    else {
      // Normal placeholder badge
      onBadgeReady(badge);
    }
  }

  /**
   *** Publics ***
   */

  function init() {

    if (isInitialized) {
      return;
    }

    isInitialized = true;

    var badge = !isToolbarUIRequested() && helper.byId(BP_CONST.BADGE_ID);

    // Get site's in-page placeholder badge or create our own
    if (badge) {
      onBadgeFound(badge);
    }
    else {
      // Toolbar mode requested or no badge (toolbar is default)
      require(['bp-toolbar/bp-toolbar'], function(toolbar) {
        onBadgeOrToolbarFound(toolbar.init());
      });
    }
  }

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

  return {
    init: init,
    getViewClasses: getViewClasses
  };

});

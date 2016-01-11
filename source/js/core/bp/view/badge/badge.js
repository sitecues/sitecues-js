/**
 * Badge, toolbar and panel base view
 */
define([
  'core/bp/constants',
  'core/bp/model/state',
  'core/bp/view/view',
  'core/conf/site',
  'core/conf/user/manager',
  'core/locale',
  'core/bp/helper'
], function(BP_CONST,
            state,
            baseView,
            site,
            conf,
            locale,
            helper) {

  var badgeElement;

  function hasSitecuesEverBeenOn() {
    return typeof conf.get('zoom') !== 'undefined' ||
      typeof conf.get('ttsOn') !== 'undefined';
  }

  /**
   *** Public ***
   */

  function getViewClasses() {

    var classBuilder = BP_CONST.WANT_BADGE;

    if (state.isBadge()) {
      classBuilder += ' ' + BP_CONST.IS_BADGE;
    }

    if (!SC_EXTENSION) {
      if (state.get('isRealSettings')) {
        // *** scp-realsettings ***
        // Show the real settings for the badge (not the fake ones)
        // Why it's used:
        // The initial badge is easier-to-see, more attractive and more inviting when speech is on and zoom is
        // somewhere in the middle. Therefore the initial badge uses fake settings.
        // However, once the user has ever expanded the badge or used sitecues we show the real settings.
        classBuilder += ' scp-realsettings';
      }
    }

    classBuilder += ' scp-palette' + state.get('paletteKey');

    return classBuilder;
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

  function init(badgePlacementElem, onComplete) {

    badgeElement = badgePlacementElem;

    // Set attributes
    helper.setAttributes(badgeElement, BP_CONST.BADGE_ATTRS);

    // Label it
    labelBadgeOrToolbar(badgeElement);

    if (!SC_EXTENSION) {
      // Use fake settings if undefined -- user never used sitecues before.
      // This will be turned off once user interacts with sitecues.
      state.set('isRealSettings', site.get('alwaysRealSettings') || hasSitecuesEverBeenOn());
    }

    baseView.init(badgeElement, onComplete);
  }

  return {
    getViewClasses: getViewClasses,
    init: init
  };

});

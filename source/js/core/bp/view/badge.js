// todo: add getBadge() and other methods for public API.

/**
 * Plan:
 * 1. On document ready
 * 2. Create and insert badge:
 *    - If page has an existing badge, use it as an pivot point to insert badge b/c
 *      we need badge to stay within body to scale properly while zoom
 *    - Also, create a new badge and insert it as sibling to body(direct child to html) to use it later(see item 5 below)
 * 3. Initialize and show badge internals(SVG) based on...
 *    - User preferences for zoom level
 *    - TTS state
 *    - Color schema
 *    - etc.
 * 4. Build panel(later: "More" button) and attach listeners
 * 5. On badge hover trigger panel to reparent b/c we don't want it to scale and to show(animate expansion)
 *    because we don't want it to scale while page zooms (e.g. while slider is manipulated)
 * 6. On panel leave shrink bp from panel to badge state
 * 7. On zoom make sure badge is inside the body to scale it
 * 8. On panel open make sure panel container and internals are outside the body to avoid scaling.
 */

// TODO Better close panel animation from secondary panel (try Seth's ideas)
// TODO Add to docs: accessibility explanation, palettes, etc.

define(['core/bp/constants', 'core/bp/model/state', 'core/locale', 'core/bp/helper', 'core/conf/user/manager', 'core/conf/site'],
  function(BP_CONST, state, locale, helper, conf, site) {

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

  function onBadgeReady(badge, palette) {
    require('core/bp/view/badge-palette', function(badgePalette) {
      badgePalette.init(badge, palette);
    });
    onBadgeOrToolbarFound(badge);
  }

  function onBadgeFound(badge) {
    if (badge.localName === 'img') {
      // If a customer uses the <img> placeholder...
      require(['bp-img-placeholder/bp-img-placeholder'], function(imagePlaceHolder) {
        var newBadge = imagePlaceHolder.init(badge),
          palette = imagePlaceHolder.getPalette();
        onBadgeReady(newBadge, palette);
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

  /*
   Augments the customers placeholder if found, otherwise creates the floating badge.

   If the customer uses an <img> as a placeholder:
     We determine the color palette to be used based on the .src attribute.
     We create a <div> and insert it into the DOM as the previous sibling of the <img>
     We insert the <img> into the newly created <div>
     We remove the id from the <img>
     We set the id of the newly created <div> to BP_CONST.BADGE_ID

   Badge will never be statically positioned.  It must be relative or absolute
   so its contents can be absolutely positioned.

   Sets attributes on badge elements (ARIA).

   * @returns {Object|Element}
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

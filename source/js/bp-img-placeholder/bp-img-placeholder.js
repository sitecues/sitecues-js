/*
 * Code to support the classic <img>-based placeholders. We ask customers to use <div display="inline-block"> now.
 * TODO Once these go away we can remove this code.
 */

define(['core/bp/constants', 'core/bp/helper'], function(BP_CONST, helper) {
  var isInitialized,
    palette;

    // Create <div> and put the existing badge inside it.
  // Transfer necessary styles from the <img> to the <div>
  function convertExistingBadge(badge) {

    // Transfer styles from placeholder <img> to <div>
    // Remove those styles from placeholder <img>
    function transferStylesFromExistingBadge (styles) {
      var len = styles.length,
        i  = 0;
      for (; i < len; i++) {
        div.style[styles[i]] = helper.getNumberFromString(badgeComputedStyles[styles[i]]) + 'px';
        badge.style[styles[i]] = 0;
      }
    }

    var div               = document.createElement('sc'),
      badgeImgBoundingBox = helper.getRect(badge),
      badgeComputedStyles = window.getComputedStyle(badge),
      stylesToTransfer    = [
        'marginTop',
        'marginBottom',
        'marginLeft',
        'marginRight',
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight'
      ];

    // Added to fix issue on ruhglobal.com
    if (badge.style.position === 'relative') {
      stylesToTransfer.push('top');
      stylesToTransfer.push('left');
    }

    transferStylesFromExistingBadge(stylesToTransfer);

    // Set other styles that cannot be abstracted into a helper function.
    div.style.display = 'inline-block';
    div.style.height  = badgeImgBoundingBox.height - (badgeComputedStyles.paddingTop  + badgeComputedStyles.paddingBottom) + 'px';
    div.style.width   = badgeImgBoundingBox.width  - (badgeComputedStyles.paddingLeft + badgeComputedStyles.paddingRight)  + 'px';
    div.style.float   = badgeComputedStyles.float;

    badge.setAttribute('aria-hidden', true); // Existing badge is hidden from screen readers, because the new <div> parent will be the real badge
    badge.parentElement.insertBefore(div, badge);

    div.appendChild(badge);

  }

  function moveBadgeIdToParent(badge) {
    badge.removeAttribute('id');
    badge.parentElement.id = BP_CONST.BADGE_ID;
  }

  // Make sure the badge has non-static positioning to make it easy to place
  // the position: absolute sc-bp-container inside of it
  function setCSSPositioningForBadge(badge) {

    var existingPositionCss = getComputedStyle(badge).position;

    if (existingPositionCss === 'static') {
      badge.style.position = 'relative';
    }
  }

  function getPalette() {
    return palette;
  }

  function init(badge) {
    var newBadge;

    if (isInitialized) {
      return;
    }
    isInitialized = true;

    badge.setAttribute('data-sc-reversible', false); // Will use a different palette dark theme is used

    palette = badge.src;

    convertExistingBadge();
    moveBadgeIdToParent(badge);

    // Invalidate the cache because we just removed the BADGE_ID
    // from the <img> and set it on the <div>
    helper.invalidateId(BP_CONST.BADGE_ID);

    newBadge = badge.parentElement;

    setCSSPositioningForBadge(newBadge);

    return newBadge;
  }

  return {
    init: init,
    getPalette: getPalette
  };
});

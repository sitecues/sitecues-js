/*
 * Code to support the classic <img>-based placeholders. We ask customers to use <div display="inline-block"> now.
 * TODO Once these go away we can remove this code.

 If the customer uses an <img> as a placeholder:
 We determine the color palette to be used based on the .src attribute.
 We create a <div> and insert it into the DOM as the previous sibling of the <img>
 We insert the <img> into the newly created <div>
 We remove the id from the <img>
 We set the id of the newly created <div> to BP_CONST.BADGE_ID

 Badge will never be statically positioned.  It must be relative or absolute
 so its contents can be absolutely positioned.

 */

define(['core/bp/constants', 'core/bp/helper'], function(BP_CONST, helper) {
  'use strict';
  // Create <div> and put the existing badge inside it.
  // Transfer necessary styles from the <img> to the <div>
  function convertExistingBadge(badgeImg) {

    var
      newBadge            = document.createElement('sc'),
      badgeImgBoundingBox = helper.getRect(badgeImg),
      badgeComputedStyles = window.getComputedStyle(badgeImg),
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

    // Transfer styles from placeholder <img> to <div>
    // Remove those styles from placeholder <img>
    function transferStylesFromExistingBadge(styles) {
      var len = styles.length,
        i  = 0;
      for (; i < len; i++) {
        newBadge.style[styles[i]] = helper.getNumberFromString(badgeComputedStyles[styles[i]]) + 'px';
        badgeImg.style[styles[i]] = 0;
      }
    }

    // Added to fix issue on ruhglobal.com
    if (badgeImg.style.position === 'relative') {
      stylesToTransfer.push('top');
      stylesToTransfer.push('left');
    }

    transferStylesFromExistingBadge(stylesToTransfer);

    // Set other styles that cannot be abstracted into a helper function.
    newBadge.style.display = 'inline-block';
    var newHeight = badgeImgBoundingBox.height,
      WIDTH_TO_HEIGHT_RATIO = 6.5;
    newBadge.style.height  = newHeight + 'px';
    newBadge.style.width   = newHeight * WIDTH_TO_HEIGHT_RATIO + 'px';
    newBadge.style.float   = badgeComputedStyles.float;

    // Existing badge is hidden from screen readers, because the new <sc> parent will be the real badge
    badgeImg.setAttribute('aria-hidden', true);
    badgeImg.parentElement.insertBefore(newBadge, badgeImg);

    moveBadgeIdToParent(badgeImg, newBadge);

    badgeImg.parentElement.removeChild(badgeImg);

    return newBadge;
  }

  function moveBadgeIdToParent(badgeImg, newBadge) {
    newBadge.id = BP_CONST.BADGE_ID;

    // Invalidate the id in the cache because we just removed the BADGE_ID
    // from the <img> and set it on the <div>
    helper.invalidateId(BP_CONST.BADGE_ID);
  }

  function init(badgeImg) {
    // Will automatically use a different palette when dark theme is used
    badgeImg.setAttribute('data-sc-reversible', false);

    return convertExistingBadge(badgeImg);
  }

  return {
    init: init
  };
});

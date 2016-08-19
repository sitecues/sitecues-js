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

define(
  [
    'core/bp/constants',
    'core/bp/helper',
    'core/inline-style/inline-style'
  ],
  function (
    BP_CONST,
    helper,
    inlineStyle
  ) {
  'use strict';
  // Create <div> and put the existing badge inside it.
  // Transfer necessary styles from the <img> to the <div>
  function convertExistingBadge(badgeImg) {

    var
      styleOpts = {
        doProxy : false
      },
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
      var
        len = styles.length,
        newBadgeStyles   = {},
        badgeImageStyles = {};
      for (var i = 0; i < len; i++) {
        newBadgeStyles[styles[i]]   = helper.getNumberFromString(badgeComputedStyles[styles[i]]) + 'px';
        badgeImageStyles[styles[i]] = 0;
      }
      inlineStyle.set(newBadge, newBadgeStyles, styleOpts);
      inlineStyle.set(badgeImg, badgeImageStyles, styleOpts);
    }

    // Added to fix issue on ruhglobal.com
    if (inlineStyle.get(badgeImg, 'position') === 'relative') {
      stylesToTransfer.push('top');
      stylesToTransfer.push('left');
    }

    transferStylesFromExistingBadge(stylesToTransfer);

    // Set other styles that cannot be abstracted into a helper function.
    inlineStyle.get(newBadge).display = 'inline-block';

    var
      newHeight = badgeImgBoundingBox.height,
      WIDTH_TO_HEIGHT_RATIO = 6.5,
      newBadgeStyle = {};
    newBadgeStyle.height = newHeight + 'px';
    newBadgeStyle.width  = newHeight * WIDTH_TO_HEIGHT_RATIO + 'px';
    newBadgeStyle.float  = badgeComputedStyles.float;

    inlineStyle.set(newBadge, newBadgeStyle, styleOpts);

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
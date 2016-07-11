/**
 * This module forces the showing or hiding of document scrollbars (CSS overflow for <html>) when:
 * - Zooming in IE
 * - Transforming elements in the positioner, and we're aware of the need add scrollbars
 *   (in some cases a fixed element will reach farther than the original body content, and the browser may incorrectly
 *   determine the scrollbars)
 */

define(
  [
    'core/platform',
    'page/viewport/viewport',
    'core/native-functions'
  ],
  function (
    platform,
    viewport,
    nativeFn
  ) {
  'use strict';

  var mainBodyRect,
    shouldComputeMainBodyScrollbars,
    doForceHorizScrollbar,
    doForceVertScrollbar,
    finalizeScrollbarsTimer,
    isInitialized,
    // CSS overflow to use when we aren't forcing a scrollbar
    defaultOverflowX,
    defaultOverflowY;

  function onBodyRectChange(newBodyRect) {
    // We use visible content rect (as opposed to element bounding client rect which contains whitespace)
    mainBodyRect = newBodyRect;
    // IE/Edge don't know when to put in scrollbars after CSS transform
    // Edge does, but we need to do this because of SC-3722 -- jiggling of Sitecues toolbar during vertical scrolls
    shouldComputeMainBodyScrollbars = platform.browser.isMS;

    if (shouldComputeMainBodyScrollbars) {
      determineScrollbars();
    }
  }

  function forceScrollbars(doTransformOnHorizontalScroll, doTransformOnVerticalScroll) {
    doForceHorizScrollbar = doTransformOnHorizontalScroll;
    doForceVertScrollbar = doTransformOnVerticalScroll;

    determineScrollbars();
  }

  function isBodyTooWide() {
    if (mainBodyRect) {
      var right = Math.max(mainBodyRect.right, mainBodyRect.width);

      return right > viewport.getInnerWidth();
    }
  }

  function isBodyTooTall() {
    if (mainBodyRect) {
      var bottom = Math.max(mainBodyRect.bottom, mainBodyRect.height);

      return bottom > viewport.getInnerHeight();
    }
  }

  function setOverflow(overflowX, overflowY) {
    var docElemStyle = document.documentElement.style;
    if (docElemStyle.overflowX !== overflowX) {
      docElemStyle.overflowX = overflowX;
    }
    if (docElemStyle.overflowY !== overflowY) {
      docElemStyle.overflowY = overflowY;
    }
  }

  // We are going to remove scrollbars and re-add them ourselves, because we can do a better job
  // of knowing when the visible content is large enough to need scrollbars.
  // This also corrects the dreaded IE scrollbar bug, where fixed position content
  // and any use of getBoundingClientRect() was off by the height of the horizontal scrollbar, or the
  // width of the vertical scroll bar, but only when the user scrolled down or to the right.
  // By controlling the visibility of the scrollbars ourselves, the bug magically goes away.
  // This is also good because we're better than IE at determining when content is big enough to need scrollbars.
  function determineScrollbars() {

    var docElemStyle = document.documentElement.style;

    // -- Clear the scrollbars --
    if (!isInitialized) {
      if (shouldComputeMainBodyScrollbars) {
        defaultOverflowX = defaultOverflowY = 'hidden';
      }
      else {
        defaultOverflowX = docElemStyle.overflowX;
        defaultOverflowY = docElemStyle.overflowY;
      }
      isInitialized = true;
    }

    // -- Set the scrollbars after a delay --
    // If the right side of the visible content is beyond the window width,
    // or the visible content is wider than the window width, show the scrollbars.
    // Doing this after a timeout fixes SC-3722 for some reason -- the toolbar was moving up and down by the height
    // of the horizontal scrollbar. It's as if doing it on a delay gives IE/Edge a chance to
    // deal with zoom first, and then scrollbars separately
    // The delay also allows us to collect several concurrent requests and handle them once.
    clearTimeout(finalizeScrollbarsTimer);
    var doUseHorizScrollbar = doForceHorizScrollbar || isBodyTooWide(),
      doUseVertScrollbar = doForceVertScrollbar || isBodyTooTall(),
      newOverflowX = doUseHorizScrollbar ? 'scroll' : defaultOverflowX,
      newOverflowY = doUseVertScrollbar ? 'scroll' : defaultOverflowY;

    if (newOverflowX !== docElemStyle.overflowX || newOverflowY !== docElemStyle.overflowY) {
      if (shouldComputeMainBodyScrollbars) {
        // MS browsers need to reset first, otherwise causes SC-3722
        setOverflow('hidden', 'hidden');
      }
      finalizeScrollbarsTimer = nativeFn.setTimeout(function() {
        setOverflow(newOverflowX, newOverflowY);
      }, 0);
    }
  }

  return {
    onBodyRectChange: onBodyRectChange,
    forceScrollbars: forceScrollbars
  };
});

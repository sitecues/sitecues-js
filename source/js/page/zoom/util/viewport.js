define(
  [
    '$',
    'page/zoom/util/body-geometry',
    'core/platform'
  ],
  function (
    $,
    bodyGeo,
    platform
  ) {

  'use strict';

  var
  // Should document scrollbars be calculated by us?
  // Should always be true for IE, because it fixes major positioning bugs
    shouldManuallyAddScrollbars;

  // We are going to remove scrollbars and re-add them ourselves, because we can do a better job
  // of knowing when the visible content is large enough to need scrollbars.
  // This also corrects the dreaded IE scrollbar bug, where fixed position content
  // and any use of getBoundingClientRect() was off by the height of the horizontal scrollbar, or the
  // width of the vertical scroll bar, but only when the user scrolled down or to the right.
  // By controlling the visibility of the scrollbars ourselves, the bug magically goes away.
  // This is also good because we're better than IE at determining when content is big enough to need scrollbars.
  function determineScrollbars() {
    if (!shouldManuallyAddScrollbars) {
      return;
    }

    // Use scrollbars if necessary for size of content
    // Get the visible content rect (as opposed to element rect which contains whitespace)
    var rect = bodyGeo.computeBodyInfo(),
      right = Math.max(rect.right, rect.width),
      bottom = Math.max(rect.bottom, rect.height),
      winHeight = window.innerHeight,
      winWidth = window.innerWidth;

    // -- Clear the scrollbars --
    $('html').css({
      overflow: 'hidden'
    });

    // -- Set the scrollbars after a delay --
    // If the right side of the visible content is beyond the window width,
    // or the visible content is wider than the window width, show the scrollbars.
    // Doing this after a timeout fixes SC-3722 for some reason -- the toolbar was moving up and down by the height
    // of the horizontal scrollbar. It's as if doing it on a delay gives IE/Edge a chance to
    // deal with zoom first, and then scrollbars separately
    setTimeout(function() {
      $('html').css({
        overflowX: right > winWidth ? 'scroll' : 'hidden',
        overflowY: bottom > winHeight ? 'scroll' : 'hidden'
      });
    }, 0);
  }

  // After the user's initial zoom we need to realign any location hash target to the top of the screen
  function jumpToLocationHash() {
    var hash = document.location.hash,
      EXTRA_SPACE_SCROLL_TOP = 60;
    if (hash) {
      try {  // Not all ids are necessarily valid -- protect against that
        var elem = document.querySelector(hash + ',[name="' + hash.substring(1) + '"]');
        if (elem) {
          elem.scrollIntoView(true);
          window.scrollBy(0, -EXTRA_SPACE_SCROLL_TOP);
        }
      }
      catch(ex) {}
    }
  }

  // Scroll content to maximize the use of screen real estate, showing as much content as possible.
  // In effect, stretch the bottom-right corner of the visible content down and/or right
  // to meet the bottom-right corner of the window.
  function maximizeContentVisibility() {
    var bodyRight = bodyGeo.getOriginalBodyInfo().rightMostNode.getBoundingClientRect().right, // Actual right coord of visible content
      bodyHeight = document.body.scrollHeight,
      winWidth = window.innerWidth,
      winHeight = window.innerHeight,
      hScrollNow = window.pageXOffset,
      vScrollNow = window.pageYOffset,
    // How much do we need to scroll by to pull content to the bottom-right corner
      hScrollDesired = Math.max(0, winWidth - bodyRight), // Amount to pull right as a positive number
      vScrollDesired = Math.max(0, winHeight - bodyHeight), // Amount to pull down as a positive number
    // Don't scroll more than we actually can
      hScroll = Math.min(hScrollNow, hScrollDesired),
      vScroll = Math.min(vScrollNow, vScrollDesired);

    window.scrollBy(-hScroll, -vScroll); // Must negate the numbers to get the expected results
  }

  function init() {
    // IE doesn't know when to put in scrollbars after CSS transform
    // Edge does, but we need to do this because of SC-3722 -- jiggling of Sitecues toolbar during vertical scrolls
    shouldManuallyAddScrollbars = platform.browser.isMS;
  }

  return {
    maximizeContentVisibility: maximizeContentVisibility,
    jumpToLocationHash: jumpToLocationHash,
    determineScrollbars: determineScrollbars,
    init: init
  };

});

/**
 * This is module for common positioning utilities that might need to be used across all of the different modules.
 * See more info on https://equinox.atlassian.net/wiki/display/EN/positioning+utility
 */
define(['$', 'util/common', 'keys/element-classifier', 'zoom/zoom', 'core/platform', 'mouse-highlight/traitcache'],
  function ($, common, elemClassifier, zoomMod, platform, traitcache) {

  var MIN_RECT_SIDE = 4;

  /**
   * Get the fixed position rectangles for the target's actual rendered content.
   * This is necessary when an inline element such as a link wraps at the end of a line -- there are multiple rects
   * DOM function object.getClientRects() returns rectangle objects for each rectangle associated with an object.
   * It also helps get just what's visible, as opposed to a parent element's rectangle which could bleed
   * over neighboring floats.
   * Recursive so that we don't miss any bounds (sometimes children escape the bounds of their parents).
   * For example, child images escape the bounds of inline parents and
   * relatively positioned children can be outside of the parent that way.
   * When adjacent rectangles are within |proximityBeforeRectsMerged| pixels,
   * they will be combined into a single rectangle.
   * @param selector -- what to get bounding boxes
   * @param proximityBeforeBoxesMerged -- if two boxes are less than this number of pixels apart, they will be merged into one
   * @param doStretchForSprites -- true if it's important to add rects for background sprites
   * @return {
   *   allRects: [],  // Array of rectangles
   *   hiddenElements: []   // Elements whose contents are not included in the highlight, e.g. have absolutely positioned or hidden subtrees
   * }
   */
  function getHighlightPositionInfo(selector, proximityBeforeBoxesMerged, doStretchForSprites, doIgnoreFloats) {
    var
      accumulatedPositionInfo = {
        allRects: [],
        hiddenElements: []
      },
      $selector = $(selector);

    getHighlightInfoRecursive($selector, accumulatedPositionInfo, doStretchForSprites, doIgnoreFloats, true);
    combineIntersectingRects(accumulatedPositionInfo.allRects, proximityBeforeBoxesMerged); // Merge overlapping boxes

    return accumulatedPositionInfo;
  }

  // Get a single rectangle that covers the entire area defined by the selector
  // doIgnoreFloats is optional
  function getRect(selector, doIgnoreFloats) {
    var COMBINE_ALL_RECTS = 99999;
    return getHighlightPositionInfo(selector, COMBINE_ALL_RECTS, true, doIgnoreFloats).allRects[0];
  }

  function getZoom() {
    return zoomMod.getCompletedZoom();
  }

  // Get the rect for the contents of a node (text node or contents inside element node)
  // @param node -- an element that contains visible content, or a text node
  function getContentsRangeRect(node) {
    var range = document.createRange(),
      parent,
      // ********** Some browsers are fine **********
      doFirefoxCorrections = platform.browser.isFirefox && platform.browser.version < 34,
      doIECorrections = platform.browser.isIE && platform.browser.version < 11,
      isElement = node.nodeType === 1;

    if (isElement) {
      // Case 1: element -- get the rect for the element's descendant contents
      parent = node;
      range.selectNodeContents(node);
    }
    else {
      // Case 2: text node -- get the rect for the text
      parent = node.parentNode;
      range.selectNode(node);
    }

    var contentsRangeRect = $.extend({}, range.getBoundingClientRect());

    if (doIECorrections) {
      contentsRangeRect = getOldIECorrectionsToRangeRect(contentsRangeRect);
    }

    if (doFirefoxCorrections) {
      contentsRangeRect = getFirefoxCorrectionsToRangeRect(parent, contentsRangeRect);
    }

    if (!isElement) {
      var textVerticalClipRect = getTextVerticalClipping(node, contentsRangeRect, range);

      if (textVerticalClipRect) {
        // Clip text to the bounding element, otherwise the top and bottom will
        // encompass the entire line-height, which can contain a lot of whitespace/
        // We only use this technique to clip the top and bottom -- left and right do not need this treatment.
        contentsRangeRect.top = Math.max(contentsRangeRect.top, textVerticalClipRect.top);
        contentsRangeRect.bottom = Math.min(contentsRangeRect.bottom, textVerticalClipRect.bottom);
        contentsRangeRect.height = contentsRangeRect.bottom - contentsRangeRect.top;
      }
    }

    return contentsRangeRect;
  }

  function getOldIECorrectionsToRangeRect(origRangeRect) {
    // Factor in IE native browser zoom
    var nativeZoom = screen.deviceXDPI / screen.logicalXDPI;
    origRangeRect.top /= nativeZoom;
    origRangeRect.left /= nativeZoom;
    origRangeRect.width /= nativeZoom;
    origRangeRect.height /= nativeZoom;

    return normalizeRect(origRangeRect);
  }

  function getFirefoxCorrectionsToRangeRect(parent, origRangeRect) {
    // ********** Firefox has bugs with range rects in some versions **********
    // https://bugzilla.mozilla.org/show_bug.cgi?id=863618
    // This must be done for range.getBoundingClientRect(),
    // but not for element.getBoundingClientRect()
    // The Firefox range.getBoundingClientRect() doesn't adjust for CSS transform.

    var parentRange = document.createRange();
    parentRange.selectNode(parent);

    var currZoom = zoomMod.getCompletedZoom(),
      parentRangeRect = parentRange.getBoundingClientRect(),
      parentElementRect = parent.getBoundingClientRect(),
      // Additional content offsets from top,left of parentElementRect
      contentLeftOffset = (origRangeRect.left - parentRangeRect.left) * currZoom,
      contentTopOffset = (origRangeRect.top - parentRangeRect.top) * currZoom,
      correctedRect = {
        // 1. Multiply the width and height by the scale
        width: origRangeRect.width * currZoom,
        height: origRangeRect.height * currZoom,
        // 2. Use the element's top,left, and use ranges to see what the delta is between
        // the element's range rect and the content range rect. Add the delta * currZoom
        left: parentElementRect.left + contentLeftOffset,
        top: parentElementRect.top + contentTopOffset
      };

    return normalizeRect(correctedRect);
  }

  function getRectMinusPadding(rect, style) {
    // Reduce by padding amount -- useful for images such as Google Logo
    // which have a ginormous amount of padding on one side
    var
      paddingTop = parseFloat(style.paddingTop),
      paddingLeft = parseFloat(style.paddingLeft),
      paddingBottom = parseFloat(style.paddingBottom),
      paddingRight = parseFloat(style.paddingRight);

    return {
      top: rect.top + paddingTop,
      left: rect.left + paddingLeft,
      width: rect.width - paddingLeft - paddingRight,
      height: rect.height - paddingTop - paddingBottom,
      right: rect.top + rect.height - paddingRight,   // In case rect.right not set
      bottom: rect.left + rect.width - paddingBottom  // In case rect.bottom not set
    };
  }

  function hasHiddenBullets(style) {
    return style.listStyleType === 'none' && style.listStyleImage === 'none';
  }

  function getBulletRect(element, style) {
    if (style.display !== 'list-item' || hasHiddenBullets(style)) {
      // Do not perform the measurement on anything but a list item with visible bullets
      return;
    }

    var INSIDE_BULLET_PADDING = 5,  // Add this extra space to the left of bullets if list-style-position: inside, otherwise looks crammed
      bulletWidth = style.listStylePosition === 'inside' ? INSIDE_BULLET_PADDING :
        common.getBulletWidth(element.parentNode, style),
      boundingRect = traitcache.getScreenRect(element),
      paddingLeft = parseFloat(traitcache.getStyleProp(element, 'paddingLeft'));

    return {
      top: boundingRect.top,
      height: boundingRect.height,
      left: boundingRect.left + paddingLeft - bulletWidth,
      width: bulletWidth
    };
  }

  function getSpriteRect(element, style) {
    // Check special case for sprites, often used for fake bullets
    // The following cases are unlikely to be sprites:
    // - Repeating backgrounds
    // - Percentage-positioned or centered (computed background-position-x is 50%)

    // Check for elements with only a background-image
    var rect = $.extend({}, traitcache.getScreenRect(element, true));
    if ($(element).is(':empty') || style.textIndent !== '0px') {
      // Empty elements have no other purpose than to show background sprites
      // Also, background image elements with text-indent are used to make accessible images
      // (the text is offscreen -- screen readers see it but the eye doesn't)
      return rect;
    }

    var backgroundPos = style.backgroundPosition;
    if (style.backgroundImage === 'none' || style.backgroundRepeat !== 'no-repeat' ||
      (parseFloat(backgroundPos) > 0 && backgroundPos.indexOf('%') > 0)) {
      return;
    }

    // Background sprites tend to be to the left side of the element
    var
      backgroundLeftPos = backgroundPos ? parseFloat(backgroundPos) : 0,
      // Use positive background positions (used for moving the sprite to the right within the element)
      // Ignore negative background positions (used for changing which sprite is used within a larger image)
      actualLeft = isNaN(backgroundLeftPos) || backgroundLeftPos < 0 ? 0 : backgroundLeftPos,
      currZoom = getZoom();
    rect.left += actualLeft;
    rect.width = parseFloat(style.paddingLeft) * currZoom;
    return rect.width > MIN_RECT_SIDE * currZoom ? rect : null;
  }

  function getLineHeight(style) {
    // Values possible from computed style: normal | <number>px
    return parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
  }

  function getOverflowRect(element, style) {
    if (element === document.body) {
      return; // The <body> element is generally reporting a different scroll width than client width
    }
    var clientHeight = element.clientHeight;
    if (!clientHeight) {
      return; // This is just what parents of inline images in IE do -- we're looking for the cases where clientHeight is at least 1
    }

    var
      hasOverflowX = style.overflowX === 'visible' && element.scrollWidth - element.clientWidth > 1,
      hasOverflowY = style.overflowY === 'visible' &&
        element.scrollHeight - clientHeight >= getLineHeight(style);

    if (!hasOverflowX && !hasOverflowY) {
      return;
    }

    // Check hidden or out-of-flow descendants -- those break our overflow check.
    // Example: google search results with hidden drop down menu
    // For now, we will not support overflow in this case.
    var hasHiddenDescendant = false,
      MAX_ELEMENTS_TO_CHECK = 40;
    $(element).find('*').each(function(index) {
      if (index > MAX_ELEMENTS_TO_CHECK) {
        return false;
      }
      var rect = traitcache.getRect(this),
        style = traitcache.getStyle(this);
      if (rect.right < 0 || rect.bottom < 0 ||
        style.visibility === 'hidden' ||
        style.position === 'absolute' ||
        style.position === 'fixed') {
        hasHiddenDescendant = true;
        return false;
      }
    });
    if (hasHiddenDescendant) {
      return;
    }

    // Overflow is visible: add right and bottom sides of overflowing content
    var rect = traitcache.getScreenRect(element),
      zoom = getZoom(),
      newRect = {
        left: rect.left,
        top: rect.top,
        width: hasOverflowX ? element.scrollWidth * zoom : Math.min(rect.width, MIN_RECT_SIDE),
        height: hasOverflowY ? element.scrollHeight * zoom : Math.min(rect.height, MIN_RECT_SIDE)
      };

    return getRectMinusPadding(newRect, style);
  }

  function normalizeRect(rect) {
    var newRect = $.extend({}, rect);
    newRect.right = rect.left + rect.width;
    newRect.bottom = rect.top + rect.height;
    return newRect;
  }

  // Add rectangle to collected list of all rectangles
  function addRect(allRects, rect, doLoosenMinSizeRule) {
    if (!rect) {
      return;
    }
    var zoom = getZoom(),
      minRectSide = MIN_RECT_SIDE * zoom;
    if (!doLoosenMinSizeRule && (rect.width < minRectSide || rect.height < minRectSide)) {
      return; // Not large enough to matter
    }

    rect = normalizeRect(rect);
    allRects.push(rect);
  }

  function getHighlightInfoRecursive($selector, accumulatedResults, doStretchForSprites, doIgnoreFloats, isTop) {
    var
      allRects = accumulatedResults.allRects,
      hiddenElements = accumulatedResults.hiddenElements,
      viewPos = traitcache.getCachedViewPosition();


    $selector.each(function () {
      var isElement = this.nodeType === 1;

      // --- Leaf nodes ---
      if (!isElement) {
        if (this.nodeType === 3 && this.data.trim() !== '') { /* Non-empty text node */
          // ----------------------------------------------------------------------------------------------------
          // --- FAST PATH -- REMOVED BECAUSE SOME CHILD ELEMENTS MAY USING CLIPPING! SC-2047 --
          // Fast path for text containers:
          // We found a child text node, so get the bounds of all children at once via a DOM range.
          // This is much faster than iterating through all of the sibling text/inline nodes, by
          // reducing the number of nodes we touch.
          // Note: this would not work if any of the children were display: block, because
          // the returned rectangle would be the larger element rect, rather for just the visible content.
          //
          // var parentContentsRect = getContentsRangeRect(this.parentNode);
          // addRect(allRects, parentContentsRect);
          // return false;  // Don't keep iterating over text/inlines in this container
          // ----------------------------------------------------------------------------------------------------

          // ----------------------------------------------------------------------------------------------------
          // -- NORMAL -- NO LONGER NEED TO USE ABOVE 'FAST PATH' METHOD --
          // Our other performance fixes (such as traitcache, and better picking) have removed the need
          // for the above old 'fast path' method which fixed slow sites like http://en.wikipedia.org/wiki/Cat
          // This 'normal' method goes through the nodes one at a time, so that we can be sure to deal with
          // hidden and clipped elements.
          // ----------------------------------------------------------------------------------------------------
          var rect = getContentsRangeRect(this);

          addRect(allRects, rect);

          // --- Overflowing content ---
          addRect(allRects, getOverflowRect(this.parentNode, traitcache.getStyle(this.parentNode)));
        }
        return;
      }

      var style = traitcache.getStyle(this);

      // --- Invisible elements ---
      if (style.visibility === 'hidden' || style.visibility === 'collapse'  || style.display === 'none') {
        hiddenElements.push(this);
        return;
      }

      if (doIgnoreFloats && style.float !== 'none') {
        return;
      }

      var thisRect = traitcache.getScreenRect(this);

      if (thisRect.right < -viewPos.x || thisRect.bottom < -viewPos.y) {
        // Hidden off the page
        // This is a technique used to hide contents offscreen without hiding it from screen readers
        hiddenElements.push(this);
        return;
      }

      // -- Out of flow and is not the top element --
      if (!isTop && (style.position === 'absolute' || style.position === 'fixed')) {
        var parentRect = traitcache.getScreenRect(this.parentNode),
          FUZZ_FACTOR = 4;
        // If the child bounds pop out of the parent bounds by more
        // than FUZZ_FACTOR, it will need to be kept separate and
        // not included in the current bounds calculation for this subtree
        if (Math.abs(thisRect.left - parentRect.left) > FUZZ_FACTOR ||
          Math.abs(thisRect.top - parentRect.top) > FUZZ_FACTOR ||
          Math.abs(thisRect.right - parentRect.right) > FUZZ_FACTOR ||
          Math.abs(thisRect.bottom - parentRect.bottom) > FUZZ_FACTOR) {
          hiddenElements.push(this);
          return;
        }
      }

      // --- Media elements ---
      if (elemClassifier.isVisualMedia(this)) {
        // Elements with rendered content such as images and videos
        addRect(allRects, getRectMinusPadding(thisRect, style));
        return;
      }

      // --- Visible border or form controls ---
      if (common.isVisualRegion(this, style, traitcache.getStyle(this.parentNode)) ||
        elemClassifier.isFormControl(this)) {
        addRect(allRects, thisRect); // Make it all visible, including padding and border
        // Keep iterating: there may be some content outside
      }

      // --- List bullets ---
      addRect(allRects, getBulletRect(this, style), true);

      // --- Background sprites ---
      if (doStretchForSprites) {
        addRect(allRects, getSpriteRect(this, style));
      }

      // --- Elements with children ---
      if (this.hasChildNodes()) {
        // Use bounds of visible descendants
        getHighlightInfoRecursive($(this.childNodes), accumulatedResults, doStretchForSprites, doIgnoreFloats);  // Recursion
        return;
      }
    });
  }

  // A text range is clipped by the vertical bounds of it's parent element
  // when the line height of the text is larger than the text rect's height --
  // this avoids extra spacing above and below, especially around headings.
  // Return either nothing for no clip, or an object with a top: and bottom: to clip to
  function getTextVerticalClipping(textNode, textRect, range) {
    var parent = textNode.parentNode,
      zoom = getZoom(),
      lineHeight = parseFloat(traitcache.getStyleProp(parent, 'lineHeight')) * zoom,
      numLines = range.getClientRects().length,
      // TODO Can we clip always? Unfortunately we did not document the counter-case. Maybe we can always do it.
      shouldClip = lineHeight * (numLines + 0.7) > textRect.height,
      clipInfo;

    if (shouldClip) {
      // Clip the text vertically to the parent element, because the large
      // line-height causes the element bounds to be larger than the text
      clipInfo = traitcache.getScreenRect(parent);
      while (traitcache.getStyleProp(parent, 'display') === 'inline') {
        parent = parent.parentNode;
        if (parent) {
          var parentRect = parent.getBoundingClientRect();
          if (parentRect.top > clipInfo.top) {
            clipInfo.top = parentRect.top;
          }
          if (parentRect.bottom < clipInfo.bottom) {
            clipInfo.bottom = parentRect.bottom;
          }
        }
      }
      return clipInfo;
    }
  }

  /**
   * Combine intersecting rects. If they are within |extraSpace| pixels of each other, merge them.
   */
  function combineIntersectingRects(rects, extraSpace) {
    function intersects(r1, r2) {
      return !( r2.left - extraSpace > r1.left + r1.width + extraSpace ||
        r2.left + r2.width + extraSpace < r1.left - extraSpace ||
        r2.top - extraSpace > r1.top + r1.height + extraSpace ||
        r2.top + r2.height + extraSpace < r1.top - extraSpace
        );
    }

    function merge(r1, r2) {
      var left = Math.min(r1.left, r2.left);
      var top = Math.min(r1.top, r2.top);
      var right = Math.max(r1.left + r1.width, r2.left + r2.width);
      var bottom = Math.max(r1.top + r1.height, r2.top + r2.height);
      return {
        left: left,
        top: top,
        width: right - left,
        height: bottom - top,
        right: right,
        bottom: bottom
      };
    }

    // TODO O(n^2), not ideal.
    // Probably want to use well-known algorithm for merging adjacent rects
    // into a polygon, such as:
    // http://stackoverflow.com/questions/643995/algorithm-to-merge-adjacent-rectangles-into-polygon
    // http://www.raymondhill.net/puzzle-rhill/jigsawpuzzle-rhill-3.js
    // http://stackoverflow.com/questions/13746284/merging-multiple-adjacent-rectangles-into-one-polygon
    for (var index1 = 0; index1 < rects.length - 1; index1 ++) {
      var index2 = index1 + 1;
      while (index2 < rects.length) {
        if (intersects(rects[index1], rects[index2])) {
          rects[index1] = merge(rects[index1], rects[index2]);
          rects.splice(index2, 1);
        }
        else {
          index2++;
        }
      }
    }
  }

  var publics = {
    getHighlightPositionInfo: getHighlightPositionInfo,
    getRect: getRect,
    getContentsRangeRect: getContentsRangeRect,
    combineIntersectingRects: combineIntersectingRects
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});

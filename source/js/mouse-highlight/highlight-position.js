/**
 * This is module for common positioning utilities that might need to be used across all of the different modules.
 * See more info on https://equinox.atlassian.net/wiki/display/EN/positioning+utility
 */
sitecues.def('mouse-highlight/highlight-position', function (mhpos, callback) {
  'use strict';

  var MIN_RECT_SIDE = 4;

  sitecues.use('jquery', 'util/common', 'conf', 'platform', 'mouse-highlight/traitcache',
               function ($, common, conf, platform, traitcache) {

    mhpos.convertFixedRectsToAbsolute = function(fixedRects) {
      var absoluteRects = [];
      var scrollPos = getScrollPosition();
      for (var count = 0; count < fixedRects.length; count ++) {
        absoluteRects[count] = getCorrectedBoundingBox(fixedRects[count], scrollPos);
      }
      // AK: this is quick'n'dirty fix for the case rect is undefined
      if (absoluteRects.length === 0) {
        absoluteRects = {'left': 0, 'top': 0, 'width': 0, 'height': 0};
      }
                  
      return absoluteRects;
    };

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
     * @param stretchForSprites -- true if it's important to add rects for background sprites
     */
    mhpos.getAllBoundingBoxes = function (selector, proximityBeforeBoxesMerged, stretchForSprites) {
      var allRects = [],
        $selector = $(selector),
        clipRects = getAncestorClipRects($selector);
      getAllBoundingBoxesExact($selector, allRects, clipRects, stretchForSprites, true);
      mhpos.combineIntersectingRects(allRects, proximityBeforeBoxesMerged); // Merge overlapping boxes

      return allRects;
    };

    function scaleRect(rect, scale, offsetX, offsetY) {
      var newRect = {
        width  : rect.width * scale,
        height : rect.height * scale,
        left   : ((rect.left + offsetX) * scale) - offsetX,
        top    : ((rect.top + offsetY) * scale) - offsetY
      };
      newRect.right  = newRect.left + newRect.width;
      newRect.bottom = newRect.top  + newRect.height;

      return newRect;
    }

    mhpos.getRangeRect = function(containerNode) {
      var range = document.createRange();
      range.selectNodeContents(containerNode);
      return getUserAgentCorrectionsForRangeRect(range.getBoundingClientRect());
    };

    function getUserAgentCorrectionsForRangeRect(rect) {
      if (platform.browser.isFirefox && platform.browser.version < 33) {
        // This must be done for range.getBoundingClientRect(),
        // but not for element.getBoundingClientRect()
        var currZoom = conf.get('zoom'),
          mozRect = $.extend({}, rect),
          scaledRect = scaleRect(mozRect, currZoom, window.pageXOffset, window.pageYOffset);

        // The Firefox range.getBoundingClientRect() doesn't adjust for translateX and transformOrigin used
        // on the body. The most accurate thing we can do here is compare rects from the two approaches on an element
        // and add in the difference in left coordinates.
        var bodyRange = document.createRange();
        bodyRange.selectNode(document.body);
        var bodyRangeLeft = (bodyRange.getBoundingClientRect().left + window.pageXOffset) * currZoom - window.pageXOffset,
          bodyLeft = traitcache.getScreenRect(document.body).left;
        scaledRect.left += bodyLeft - bodyRangeLeft;

        return scaledRect;
      }
      return rect;
    }

    function getBoundingRectMinusPadding(node) {
      var rect = traitcache.getScreenRect(node);
      return getRectMinusPadding(node, rect);
    }

    function getRectMinusPadding(node, rect) {
      // Reduce by padding amount -- useful for images such as Google Logo
      // which have a ginormous amount of padding on one side
      var style = traitcache.getStyle(node),
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

    function getEmsToPx(fontSize, ems) {
      // Create a div to measure the number of px in an em with this font-size
      var measureDiv = $('<div/>')
           .appendTo(document.body)
           .css({
          fontSize: fontSize,
          width: ems + 'em',
          visibility: 'hidden'
        }),
        // Multiply by zoom because our <div> is not affected by the document's current zoom level
        px = measureDiv.width() * conf.get('zoom');
      measureDiv.remove();
      return px;
    }

    function getBulletWidth(listElement, style) {
      var bulletType = style.listStyleType,
        ems = 2.5;  // Browsers seem use max of 2.5 em for bullet width -- use as a default
      if ($.inArray(bulletType, ['circle', 'square', 'disc', 'none']) >= 0) {
        ems = 1.6; // Simple bullet
      } else if (bulletType === 'decimal') {
        var start = parseInt($(listElement).attr('start'), 10),
          end = (start || 1) + listElement.childElementCount - 1;
        ems = (0.9 + 0.5 * end.toString().length);
      }
      return getEmsToPx(style.fontSize, ems);
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
          getBulletWidth(element.parentNode, style),
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
      if ($(element).is(':empty')) {
        // Empty elements have no other purpose than to show background sprites
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
        actualLeft = isNaN(backgroundLeftPos) || backgroundLeftPos < 0 ? 0 : backgroundLeftPos;
      rect.left += actualLeft;
      return rect.width > 0 ? rect : null;
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
        overflowX = style.overflowX === 'visible' && element.scrollWidth - element.clientWidth > 1,
        overflowY = style.overflowY === 'visible' &&
          element.scrollHeight - clientHeight >= getLineHeight(style);

      if (!overflowX && !overflowY) {
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
        zoom = conf.get('zoom'),
        newRect = {
          left: rect.left,
          top: rect.top,
          width: overflowX ? element.scrollWidth * zoom : Math.min(rect.width, MIN_RECT_SIDE),
          height: overflowY ? element.scrollHeight * zoom : Math.min(rect.height, MIN_RECT_SIDE)
        };

      return getRectMinusPadding(element, newRect);
    }

    function normalizeRect(rect) {
      var newRect = $.extend({}, rect);
      newRect.right = rect.left + rect.width;
      newRect.bottom = rect.top + rect.height;
      return newRect;
    }

    function addRect(allRects, clipRect, unclippedRect, doLoosenMinSizeRule) {
      if (!unclippedRect) {
        return;
      }
      var rect = getClippedRect(unclippedRect, clipRect),
        zoom = conf.get('zoom'),
        minRectSide = MIN_RECT_SIDE * zoom;
      if (!doLoosenMinSizeRule && (rect.width < minRectSide || rect.height < minRectSide)) {
        return; // Not large enough to matter
      }

      rect = normalizeRect(rect);

      if (rect.right < 0 || rect.bottom < 0) {
        var absoluteRect = mhpos.convertFixedRectsToAbsolute([rect], zoom)[0];
        if (absoluteRect.right < 0 || absoluteRect.bottom < 0) {
          // Don't be fooled by items hidden offscreen -- those rects don't count
          return;
        }
      }

      allRects.push(rect);
    }

    function getAllBoundingBoxesExact($selector, allRects, clipRects, stretchForSprites, isTop) {

      $selector.each(function (index) {
        var isElement = this.nodeType === 1,
          clipRect = Array.isArray(clipRects) ? clipRects[index] : clipRects;

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
            // var parentContentsRect = mhpos.getRangeRect(this.parentNode);
            // addRect(allRects, clipRect, parentContentsRect);
            // return false;  // Don't keep iterating over text/inlines in this container
            // ----------------------------------------------------------------------------------------------------

            // ----------------------------------------------------------------------------------------------------
            // -- NORMAL -- NO LONGER NEED TO USE ABOVE 'FAST PATH' METHOD --
            // Our other performance fixes (such as traitcache, and better picking) have removed the need
            // for the above old 'fast path' method which fixed slow sites like http://en.wikipedia.org/wiki/Cat
            // This 'normal' method goes through the nodes one at a time, so that we can be sure to deal with
            // hidden and clipped elements.
            // ----------------------------------------------------------------------------------------------------
            var range = document.createRange(),
              rect,
              textRangeVerticalClipRect = traitcache.getScreenRect(this.parentNode);

            range.selectNode(this);
            rect = getUserAgentCorrectionsForRangeRect($.extend({}, range.getBoundingClientRect()));

            // Text must always be clipped to the bounding element, otherwise the top and bottom will
            // encompass the entire line-height, which can contain a lot of whitespace/
            // We only use this technique to clip the top and bottom -- left and right do not need this treatment.
            rect.top = Math.max(rect.top, textRangeVerticalClipRect.top);
            rect.bottom = Math.min(rect.bottom, textRangeVerticalClipRect.bottom);
            rect.height = rect.bottom - rect.top;

            addRect(allRects, clipRect, rect);
          }
          return;
        }

        var style = traitcache.getStyle(this);

        // --- Invisible elements ---
        if (style.visibility === 'hidden' || style.visibility === 'collapse'  || style.display === 'none') {
          return;
        }

        // -- Clipping rules ---
        clipRect = getChildClipRect(this, style, clipRect);

        // --- Media elements ---
        if (common.isVisualMedia(this)) {
          // Elements with rendered content such as images and videos
          addRect(allRects, clipRect, getBoundingRectMinusPadding(this));
          return;
        }

        // -- Out of flow and is not the top element --
        if (!isTop && (style.position === 'absolute' || style.position === 'fixed')) {
          var thisRect = traitcache.getScreenRect(this),
            parentRect = traitcache.getScreenRect(this.parentNode),
            FUZZ_FACTOR = 4;
          // If the child bounds pop out of the parent bounds by more
          // than FUZZ_FACTOR, it will need to be kept separate and
          // not included in the current bounds calculation for this subtree
          if (Math.abs(thisRect.left - parentRect.left) > FUZZ_FACTOR ||
            Math.abs(thisRect.top - parentRect.top) > FUZZ_FACTOR ||
            Math.abs(thisRect.right - parentRect.right) > FUZZ_FACTOR ||
            Math.abs(thisRect.bottom - parentRect.bottom) > FUZZ_FACTOR) {
            return;
          }
        }

        // --- Overflowing content ---
        addRect(allRects, clipRect, getOverflowRect(this, style));

        // --- Visible border or form controls ---
        if (common.isVisualRegion(this, style, traitcache.getStyle(this.parentNode)) ||
          common.isFormControl(this)) {
          addRect(allRects, clipRect, traitcache.getScreenRect(this)); // Make it all visible, including padding and border
          // Keep iterating: there may be some content outside
        }

        // --- List bullets ---
        addRect(allRects, clipRect, getBulletRect(this, style), true);

        // --- Background sprites ---
        if (stretchForSprites) {
          addRect(allRects, clipRect, getSpriteRect(this, style));
        }

        // --- Elements with children ---
        if (this.hasChildNodes()) {
          // Use bounds of visible descendants, but clipped by the bounds of this ancestor
          getAllBoundingBoxesExact($(this.childNodes), allRects, clipRect, stretchForSprites);  // Recursion
          return;
        }
      });
    }

    function isClipElement(style) {
      return style.clip !== 'auto' || style.overflow !== 'visible';
    }

    // Return the portion of unclippedRect after clipRect gets to clip it
    function getClippedRect(unclippedRect, clipRect) {
      if (!clipRect) {
        return normalizeRect(unclippedRect); // Convert to non-native object so that properties can be modified if necessary
      }
      if (!unclippedRect) {
        return normalizeRect(clipRect);
      }
      var left = Math.max(unclippedRect.left, clipRect.left),
        right = Math.min(unclippedRect.left + unclippedRect.width, clipRect.left + clipRect.width),
        top = Math.max(unclippedRect.top, clipRect.top),
        bottom = Math.min(unclippedRect.top + unclippedRect.height, clipRect.top + clipRect.height);
      return {
        left: left,
        top: top,
        bottom: bottom,
        right: right,
        width: right - left,
        height: bottom - top
      };
    }

    // Return the new clip rect for the child, taking into account
    // the old clip rect and usage of CSS positioning
    // TODO What if overflow-X is hidden and overflow-y is visible?
    function getChildClipRect(element, style, clipRect) {
      if (clipRect && clipRect.willOutOfFlowCancel && (style.position === 'absolute' || style.position === 'fixed')) {
        clipRect = null; // Out-of-flow content does not get clipped by overflow:hidden
      }
      if (isClipElement(style)) {
        clipRect = getClippedRect(clipRect, traitcache.getScreenRect(element));
        clipRect.willOutOfFlowCancel = true;
      }
      if (clipRect) {
        // Turns to false if we have non-static positioning because
        // next out of flow descendant doesn't affect the current clip rect
        clipRect.willOutOfFlowCancel = clipRect.willOutOfFlowCancel &&
          style.position === 'static';
      }

      return clipRect;
    }

    // Get clip rectangle from ancestors in the case any of them are clipping us
    function getAncestorClipRects($selector) {
      var allClipRects = [];

      $selector.each(function() {
        var ancestors = $selector.parentsUntil(document.body).get().reverse(),
          clipRect,
          style;
        $(ancestors).each(function() {
          style = traitcache.getStyle(this);
          clipRect = getChildClipRect(this, style, clipRect);
        });
        allClipRects.push(clipRect);
      });

      return allClipRects;
    }

    /**
     * Combine intersecting rects. If they are withing |extraSpace| pixels of each other, merge them.
     */
    mhpos.combineIntersectingRects = function(rects, extraSpace) {
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
    };

    /**
    * Return a corrected bounding box given the total zoom for the element and current scroll position
    */
    function getCorrectedBoundingBox(boundingBox, scrollPosition) {
      var rect = {
        left: boundingBox.left + scrollPosition.left,
        top:  boundingBox.top + scrollPosition.top,
        width: boundingBox.width,
        height: boundingBox.height
      };
      rect.right = rect.left + rect.width;
      rect.bottom = rect.top + rect.height;
      return rect;
    }

    /**
     * Obtain the scroll position.
     */
    function getScrollPosition() {
      return {
        left: window.pageXOffset,
        top:  window.pageYOffset
      };
    }

    // Done.
    callback();

  });

});

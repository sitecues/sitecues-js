/**
 * This is module for common positioning utilities that might need to be used across all of the different modules.
 * See more info on https://equinox.atlassian.net/wiki/display/EN/positioning+utility
 */
sitecues.def('mouse-highlight/highlight-position', function (mhpos, callback) {
  'use strict';

  var MIN_RECT_WIDTH = 4;
  var MIN_RECT_HEIGHT = 4;

  sitecues.use('jquery', 'util/common', 'conf', 'platform', 'mouse-highlight/traitcache', 'util/geo',
               function ($, common, conf, platform, traitcache, geo) {

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
     * @param exact -- true if it's important to iterate over each line of text as a separate rectangle (slower)
     */
    mhpos.getAllBoundingBoxes = function (selector, proximityBeforeBoxesMerged, stretchForSprites) {
      var allRects = [];

      var $selector = $(selector);
      var clipRect = getAncestorClipRect($selector);
      getAllBoundingBoxesExact($selector, allRects, clipRect, stretchForSprites);
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

    function getRangeRect(containerNode) {
      var range = document.createRange();
      range.selectNodeContents(containerNode);
      return getUserAgentCorrectionsForRangeRect(range.getBoundingClientRect());
    }

    function getUserAgentCorrectionsForRangeRect(rect) {
      if (platform.browser.isFirefox) {
        // This must be done for range.getBoundingClientRect(),
        // but not for element.getBoundingClientRect()
        return scaleRect(rect, conf.get('zoom'), window.pageXOffset, window.pageYOffset);
      }
      return rect;
    }

    function getBoundingRectMinusPadding(node) {
      var rect = getRangeRect(node);

      // If range is created on node w/o text, getBoundingClientRect() returns zero values.
      // This concerns images and other nodes such as paragraphs - with no text inside.
      var isEmptyRect = true;

      for (var prop in rect) {
        if (rect[prop] !== 0) {
          isEmptyRect = false;
          continue;
        }
      }

      if (isEmptyRect) {rect = node.getBoundingClientRect && traitcache.getScreenRect(node);}

      if (node.nodeType !== 1) {
        return rect;
      }
      // Reduce by padding amount -- useful for images such as Google Logo
      // which have a ginormous amount of padding on one side
      var style = traitcache.getStyle(node);
      var paddingTop = parseFloat(style.paddingTop);
      var paddingLeft = parseFloat(style.paddingLeft);
      var paddingBottom = parseFloat(style.paddingBottom);
      var paddingRight = parseFloat(style.paddingRight);
      return {
        top: rect.top + paddingTop,
        left: rect.left + paddingLeft,
        width: rect.width - paddingLeft - paddingRight,
        height: rect.height - paddingTop - paddingBottom,
        right: rect.right - paddingRight,
        bottom: rect.bottom - paddingBottom
      };
    }

    function hasVisibleBorder(style) {
      return parseFloat(style['border-left-width']) || parseFloat(style['border-top-width']);
    }

    function getEmsToPx(fontSize, ems) {
      var measureDiv = $('<div/>')
         .appendTo(document.body)
         .css({
        'font-size': fontSize,
        'width': ems + 'em',
        'visibility': 'hidden'
      });
      var px = measureDiv.width();
      measureDiv.remove();
      return px;
    }

    function getBulletWidth(element, style, bulletType) {
      var ems = 2.5;  // Browsers seem use max of 2.5 em for bullet width -- use as a default
      if ($.inArray(bulletType, ['circle', 'square', 'disc', 'none']) >= 0) {
        ems = 1; // Simple bullet
      } else if (bulletType === 'decimal') {
        var start = parseInt($(element).attr('start'), 10);
        var end = (start || 1) + element.childElementCount - 1;
        ems = 0.9 + 0.5 * end.toString().length;
      }
      return getEmsToPx(style['font-size'], ems);
    }

    function getBulletRect(element, style) {
      var bulletType = style['list-style-type'];
      if ((bulletType === 'none' && style['list-style-image'] === 'none') || style['list-style-position'] !== 'outside') {
        return null; // inside, will already have bullet incorporated in bounds
      }
      if (style.display !== 'list-item') {
        var firstChild = element.firstElementChild;
        if (!firstChild || traitcache.getStyleProp(firstChild, 'display') !== 'list-item') {
          return null; /// Needs to be list-item or have list-item child
        }
      }
      var bulletWidth = getBulletWidth(element, style, bulletType);
      var boundingRect = getBoundingRectMinusPadding(element);
      return {
        top: boundingRect.top,
        height: boundingRect.height,
        left: boundingRect.left - bulletWidth,
        width: bulletWidth
      };
    }

    function getSpriteRect(element, style) {
      // Check special case for sprites, often used for fake bullets
      if (style['background-image'] === 'none' || style['background-repeat'] !== 'no-repeat') {
        return null;
      }

      // Background sprites tend to be to the left side of the element
      var backgroundPos = style['background-position'];
      var left = backgroundPos ? parseFloat(backgroundPos) : 0;
      var rect = traitcache.getScreenRect(element);
      rect = {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
      rect.left += left;
      return rect.width > 0 ? rect : null;
    }

    function getLineHeight(style) {
      // Values possible from computed style: normal | <number>px
      return parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
    }

    function getOverflowRect(element, style) {
      var overflowX = style['overflow-x'] === 'visible' && element.scrollWidth - element.clientWidth > 1;
      var overflowY = style['overflow-y'] === 'visible' &&
        element.scrollHeight - element.clientHeight >= getLineHeight(style);
      if (!overflowX && !overflowY) {
        return null;
      }
    

      // Check for descendant with visibility: hidden -- those break our overflow check.
      // Example: google search results with hidden drop down menu
      // For now, we will not support overflow in this case.
      var hasVisibilityHiddenDescendant = false;

      $(element).find('*').each(function() {
        if (traitcache.getStyleProp(this, 'visibility') === 'hidden') {
          hasVisibilityHiddenDescendant = true;
          return false;
        }
      });
      if (hasVisibilityHiddenDescendant) {
        return null;
      }

      // Overflow is visible: add right and bottom sides of overflowing content
      var rect = traitcache.getScreenRect(element);
      var newRect = {
        left: rect.left,
        top: rect.top,
        width: overflowX ? element.scrollWidth : rect.width,
        height: overflowY ? element.scrollHeight : rect.height
      };
      return newRect;
    }

    function addRect(allRects, clipRect, unclippedRect) {
      if (!unclippedRect) {
        return;
      }
      var rect = getClippedRect(unclippedRect, clipRect);
      if (rect.width < MIN_RECT_WIDTH|| rect.height < MIN_RECT_HEIGHT) {
        return; // Not large enough to matter
      }

      if (rect.right < 0 || rect.bottom < 0) {
        var zoom = conf.get('zoom');
        var absoluteRect = mhpos.convertFixedRectsToAbsolute([rect], zoom)[0];
        if (absoluteRect.right < 0 || absoluteRect.bottom < 0) {
          // Don't be fooled by items hidden offscreen -- those rects don't count
          return;
        }
      }

      allRects.push(rect);
    }

    function getAllBoundingBoxesExact($selector, allRects, clipRect, stretchForSprites) {

      $selector.each(function () {

        var isElement = this.nodeType === 1;

        // --- Leaf nodes ---
        if (!isElement) {
          if (this.nodeType === 3 && this.data.trim() !== '') { /* Non-empty text node */
            // Fast path for text containers:
            // We found a child text node, so get the bounds of all children at once via a DOM range.
            // This is much faster than iterating through all of the sibling text/inline nodes, by
            // reducing the number of nodes we touch.
            // Note: this would not work if any of the children were display: block, because
            // the returned rectangle would be the larger element rect, rather for just the visible content.
            var parentContentsRect = getRangeRect(this.parentNode);
            addRect(allRects, clipRect, parentContentsRect);
            return false;  // Don't keep iterating over text/inlines in this container
          }
          return true;
        }

        var style = traitcache.getStyle(this);

        // --- Invisible elements ---
        if (style.visibility === 'hidden' || style.visibility === 'collapse') {
          return true;
        }


        // --- Overflowing content ---
        addRect(allRects, clipRect, getOverflowRect(this, style));


        // --- Visible border or form controls ---
        if (hasVisibleBorder(style) || common.isFormControl(this)) {
          addRect(allRects, clipRect, traitcache.getScreenRect(this)); // Make it all visible, including padding and border
          return true; // Don't iterate ... although it case of Washington post they position a child outside the box, doh
        }

        // --- List bullets ---
        addRect(allRects, clipRect, getBulletRect(this, style));


        // --- Background sprites ---
        if (stretchForSprites) {
          addRect(allRects, clipRect, getSpriteRect(this, style));
        }

        // --- Media elements ---
        if (common.isVisualMedia(this)) {
          // Elements with rendered content such as images and videos
          addRect(allRects, clipRect, getBoundingRectMinusPadding(this));
          return true;
        }


        // --- Elements with children ---
        if (this.hasChildNodes()) {
          // Use bounds of visible descendants, but clipped by the bounds of this ancestor
          var isClip = isClipElement(this);
          var newClipRect = clipRect;
          if (isClip) {
            newClipRect = traitcache.getScreenRect(this);
            if (clipRect) {  // Combine parent clip rect with new clip
              newClipRect = getClippedRect(clipRect, newClipRect);
            }

          }
          getAllBoundingBoxesExact($(this.childNodes), allRects, newClipRect, stretchForSprites);  // Recursion
          return true;
        }
      });
    }

    function isClipElement(element) {
      var style = traitcache.getStyle(element);
      return style.clip !== 'auto' || style.overflow !== 'visible';
    }

    function getClippedRect(unclippedRect, clipRect) {
      if (!clipRect) {
        // Ensure right and bottom are set as well
        //unclippedRect.right = unclippedRect.left + unclippedRect.width;
        //unclippedRect.bottom = unclippedRect.top + unclippedRect.height;
        return $.extend({}, unclippedRect); // Convert to non-native object so that properties can be modified if necessary
      }
      var left   = Math.max( unclippedRect.left, clipRect.left);
      var right  = Math.min( unclippedRect.left + unclippedRect.width, clipRect.left + clipRect.width);
      var top    = Math.max( unclippedRect.top, clipRect.top );
      var bottom = Math.min( unclippedRect.top + unclippedRect.height, clipRect.top + clipRect.height);
      return {
        left: left,
        top: top,
        bottom: bottom,
        right: right,
        width: right - left,
        height: bottom - top
      };
    }

    // Get clip rectangle from ancestors in the case any of them are clipping us
    function getAncestorClipRect($selector) {
      var kMaxAncestorsToCheck = 5;
      var allClipRects = [];
      $selector.each(function() {
        // Get ancestor clip rect -- do up to kMaxAncestorsToCheck ancestors (beyond that, it's unlikely to clip)
        var ancestors = $selector.parents();
        var clipRect = null;
        ancestors.each(function(index) {
          if (index >= kMaxAncestorsToCheck) {
            return false;
          }
            
          if (isClipElement(this)) {
            var newClipRect = traitcache.getScreenRect(this);
            clipRect = clipRect ? getClippedRect(clipRect, newClipRect) : newClipRect;
          }
        });
        allClipRects.push(clipRect);
      });
      mhpos.combineIntersectingRects(allClipRects, 9999);
      return allClipRects[0];
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
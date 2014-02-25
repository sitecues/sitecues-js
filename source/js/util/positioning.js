/**
 * This is module for common positioning utilities that might need to be used across all of the different modules.
 * See more info on https://equinox.atlassian.net/wiki/display/EN/positioning+utility
 */
sitecues.def('util/positioning', function (positioning, callback, log) {


  'use strict';
  
  positioning.kMinRectWidth = 4;
  positioning.kMinRectHeight = 4;

  sitecues.use('jquery', 'util/common', 'platform', function ($, common, platform) {
    /**
     * Get the cumulative zoom for an element.
     * @param {selector} selector
     * @param {boolean} andZoom False if we only want to get 'transform:scale' zoom;
     * True if we want to take full zoom, union of 'transfor:scale' + 'zoom' property.
     * @returns {undefined|single result|array} The value or an array of values
     * of current page's zoom.
     */
    positioning.getBoundingClientRect = function (element, clone) {
      return element.getBoundingClientRect();
    };

    positioning.getTotalZoom = (function () {
      var recurse = function (element, andZoom) {
        if (!element) {
          return 1;
        }
        var value = getMagnification(element, andZoom);
        return (value ? value : 1) * recurse(element.parentElement, andZoom);
      };
      return function (selector, andZoom) {
        var result = [];
        $(selector).each(function () {
            result.push(recurse(this, andZoom));
          });
        return processResult(result);
      };
    }());
    /**
     * Sets the zoom of an element, with the body being the default element.
     */
    positioning.setZoom = function (selector, zoom, origin) {
      // Ensure a zoom exists.
      var transformCenter = origin ? origin.x + ' ' + origin.y : '50% 50%', // default
          zoomStyle = {'transform-origin': transformCenter};
      
      zoom = zoom || 1;
      selector = (selector ? selector : document.body);

      $(selector).each(function () {
          zoomStyle.transform = 'scale(' + zoom + ')';
          $(this).style(zoomStyle, '', 'important');
        });
    };

    /**
     * Get the mouse event coordinates relative to the document origin.
     */
    positioning.getMouseCoords = function (e, zoom) {
      // Ensure a zoom exists.
      zoom = zoom || 1;
      return {
        left: e.clientX,
        top:  e.clientY
      };
    };

  /**
   * Return a corrected bounding box given the total zoom for the element and current scroll position
   */
    positioning.getCorrectedBoundingBox = function(boundingBox, totalZoom, scrollPosition) {
      var rect = {
        left: boundingBox.left + scrollPosition.left,
        top:  boundingBox.top + scrollPosition.top,
        width: boundingBox.width,
        height: boundingBox.height,
      };
      rect.right = rect.left + rect.width;
      rect.bottom = rect.top + rect.height;
      return rect;
    };

  /**
   * Get the elements' bounding box.
   * DOM function object.getBoundingClientRect() returns a text rectangle object that encloses a group of text rectangles.
   */
    positioning.getBoundingBox = function (selector) {
      // Perform the calculations for all selected elements.
      var result = [];
      var scrollPosition = positioning.getScrollPosition();
      $(selector).each(function () {
        var totalZoom = positioning.getTotalZoom(this, true);
        var boundingBox = this.getBoundingClientRect();
        result.push(positioning.getCorrectedBoundingBox(boundingBox, totalZoom, scrollPosition));
      });
      return processResult(result);
    };

    positioning.convertFixedRectsToAbsolute = function(fixedRects, zoom) {
      var absoluteRects = [];
      var scrollPos = positioning.getScrollPosition();
      for (var count = 0; count < fixedRects.length; count ++) {
        absoluteRects[count] = positioning.getCorrectedBoundingBox(fixedRects[count], zoom, scrollPos);
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
    positioning.getAllBoundingBoxes = function (selector, proximityBeforeBoxesMerged, stretchForSprites) {
      var allRects = [];

      var $selector = $(selector);
      var clipRect = getAncestorClipRect($selector);
      getAllBoundingBoxesExact($selector, allRects, clipRect, stretchForSprites);
      positioning.combineIntersectingRects(allRects, proximityBeforeBoxesMerged); // Merge overlapping boxes

      return allRects;
    };

    /**
     * Use shrink-wrapped box for potentially wrapped content
     * Otherwise use element bounds -- this way there is enough room for single-line content and it doesn't need to wrap
     * when it didn't need to wrap before.
     */
    positioning.getSmartBoundingBox = function(item) {
      var contentRect = positioning.getAllBoundingBoxes(item, 9999)[0];
      var lineHeight = common.getLineHeight(item);
      var isSingleLine = contentRect && (contentRect.height < lineHeight * 1.5); // Quickly determined whether not line-wrapped
      if (isSingleLine) {
        return item.getBoundingClientRect();// AK: this is quick'n'dirty fix for the case rect is undefined
      }
      return contentRect || {'left': 0, 'top': 0, 'width': 0, 'height': 0};
    };
  var scaleRect = function (rect, scale, offsetX, offsetY) {
    var newRect = {
          'width'  : rect.width * scale,
          'height' : rect.height * scale,
          'left'   : ((rect.left + offsetX) * scale) - offsetX,
          'top'    : ((rect.top + offsetY) * scale) - offsetY
        }
    newRect.right  = newRect.left + newRect.width;
    newRect.bottom = newRect.top  + newRect.height;
    
    return newRect;
  }
  var createBox = function (box) {
  
    var element = $('<div></div>').css({
      'position'        : 'absolute',
      'left'            : box.left   + 'px',
      'top'             : box.top    + 'px',
      'width'           : box.width  + 'px',
      'height'          : box.height + 'px',
      'backgroundColor' : 'blue',
      'opacity'         : '1',
      'zIndex'          : 99999
    }).attr('id', 'box')
    
    $('html').append(element);

    return element;
  
  }
    function getBoundingRectMinusPadding(node) {
      var range = document.createRange();
      range.selectNode(node);
      var rect = range.getBoundingClientRect(),
          zoom = positioning.getTotalZoom(node, true);

      // If range is created on node w/o text, getBoundingClientRect() returns zero values.
      // This concerns images and other nodes such as paragraphs - with no text inside.
      var isEmptyRect = true;

      for (var prop in rect) {
       if (rect[prop] !== 0) {
           isEmptyRect = false;
           continue;
       }   
      }

      if (isEmptyRect) {rect = node.getBoundingClientRect && node.getBoundingClientRect();}

      if ((navigator && navigator.userAgent) ? navigator.userAgent.indexOf(' Firefox/') > 0 : false) {
        //return
        //console.log('FF Normalize')
        rect = scaleRect(rect, zoom, window.pageXOffset, window.pageYOffset);

      }
      // console.log(rect);
      
      if (node.nodeType !== 1) {
        return rect;
      }
      // Reduce by padding amount -- useful for images such as Google Logo
      // which have a ginormous amount of padding on one side
      // TODO: should we use common.getElementComputedStyles() ?
      var $node = $(node);
      var paddingTop = parseFloat($node.css('padding-top'));
      var paddingLeft = parseFloat($node.css('padding-left'));
      var paddingBottom = parseFloat($node.css('padding-bottom'));
      var paddingRight = parseFloat($node.css('padding-right'));
      rect = {
        top: rect.top + paddingTop,
        left: rect.left + paddingLeft,
        width: rect.width - paddingLeft - paddingRight,
        height: rect.height - paddingTop - paddingBottom,
        right: rect.right - paddingRight,
        bottom: rect.bottom - paddingBottom
      };
      return rect;
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
        var start = parseInt($(element).attr('start'));
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
        if ($(element).children(':first').css('display') !== 'list-item') {
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
      var rect = element.getBoundingClientRect();
      rect = {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
      rect.left += left;
    //  rect.width = positioning.kMinRectWidth - left;   // Don't go all the way to the right -- that's likely to overrun a float
      return rect.width > 0 ? rect : null;
    }

    function getOverflowRect(element, style) {
      var overflowX = style['overflow-x'] === 'visible' && element.scrollWidth - element.clientWidth > 1;
      var overflowY = style['overflow-y'] === 'visible' && element.scrollHeight - element.clientHeight >= common.getLineHeight(element);
      if (!overflowX && !overflowY) {
        return null;
      }
    

      // Check for descendant with visibility: hidden -- those break our overflow check.
      // Example: google search results with hidden drop down menu
      // For now, we will not support overflow in this case.
      var hasVisibilityHiddenDescendant = false;
      $(element).find('*').each(function() {
        if ($(this).css('visibility') === 'hidden') {
          hasVisibilityHiddenDescendant = true;
          return false;
        }
      });
      if (hasVisibilityHiddenDescendant) {
        return null;
      }

      // Overflow is visible: add right and bottom sides of overflowing content
      var rect = element.getBoundingClientRect();
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
      if (rect.width < positioning.kMinRectWidth || rect.height < positioning.kMinRectHeight) {
        return; // Not large enough to matter
      }

      if (rect.right < 0 || rect.bottom < 0) {
        var zoom = positioning.getTotalZoom(this, true);
        var absoluteRect = positioning.convertFixedRectsToAbsolute([rect], zoom)[0];
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
          if (this.nodeType === 3 && $.trim(this.textContent) !== '') {
            // -- Acutal text rect --
            addRect(allRects, clipRect, getBoundingRectMinusPadding(this));
          }
          return true;
        }

        var style = common.getElementComputedStyles(this);

        // --- Invisible elements ---
        if (style.visibility === 'hidden' || style.visibility === 'collapse') {
          return true;
        }

        // --- Overflowing content ---
        addRect(allRects, clipRect, getOverflowRect(this, style));


        // --- Visible border ---
        if (hasVisibleBorder(style)) {
          addRect(allRects, clipRect, this.getBoundingClientRect()); // Make it all visible, including padding and border
          return true;
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
            newClipRect = this.getBoundingClientRect();
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
      // TODO: should we use common.getElementComputedStyles() ?
      return $(element).css('clip') !== 'auto' || $(element).css('overflow') !== 'visible';
    }

    function getClippedRect(unclippedRect, clipRect) {
      if (!clipRect) {
        // Ensure right and bottom are set as well
        //unclippedRect.right = unclippedRect.left + unclippedRect.width;
        //unclippedRect.bottom = unclippedRect.top + unclippedRect.height;
        return unclippedRect;
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
            var newClipRect = this.getBoundingClientRect();
            clipRect = clipRect ? getClippedRect(clipRect, newClipRect) : newClipRect;
          }
        });
        allClipRects.push(clipRect);
      });
      positioning.combineIntersectingRects(allClipRects, 9999);
      return allClipRects[0];
    }

    /**
     * Returns the offset of the provided element, with calculations based upon etBoundingClientRect().
     */
    positioning.getOffset = function (selector) {
      var rect = positioning.getBoundingBox(selector);
      return { left : rect.left, top : rect.top };
    };
  /**
   * Combine intersecting rects. If they are withing |extraSpace| pixels of each other, merge them.
   */
    positioning.combineIntersectingRects = function(rects, extraSpace) {
      function intersects(r1, r2) {
        return !( r2.left - extraSpace > r1.left + r1.width + extraSpace
          || r2.left + r2.width + extraSpace < r1.left - extraSpace
          || r2.top - extraSpace > r1.top + r1.height + extraSpace
          || r2.top + r2.height + extraSpace < r1.top - extraSpace
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
     * Returns the center of the provided element.
     * Note: uses visible dimensions of the element instead of actual ones set by styles.
     * 
     * Example of the element that has different actual and visible width:
     * actual width = visible + not visible width.
     * _______________________________________________
     * |                             |////////////////|
     * | From the makers of ZoomText.|///not visible//|
     * |        (visible width)      |//////width/////|
     * |_____________________________|________________|
     * 
     */
    positioning.getCenter = function (selector, zoom) {
      var result = [];
      $(selector).each(function () {
        var fixedRects = positioning.getAllBoundingBoxes(this, 9999);
        var rect = positioning.convertFixedRectsToAbsolute(fixedRects, zoom)[0];

        // AK: this is quick'n'dirty fix for the case rect is undefined(check convertFixedRectsToAbsolute instead).
        if (!rect) {
          rect = {'left': 0, 'top': 0, 'width': 0, 'height': 0};


        }
        result.push({
          left: (rect.left + (rect.width / 2)) / zoom,
          top:  (rect.top + (rect.height / 2)) / zoom
        });
      });
      return processResult(result);
    };

    positioning.getCenterForActualElement = function (selector, zoom) {
      var result = [];
      $(selector).each(function () {
        var boundingBox = this.getBoundingClientRect();
        var scrollPos = positioning.getScrollPosition();
        var rect = {
          left: boundingBox.left + scrollPos.left,
          top:  boundingBox.top  + scrollPos.top,
          width: boundingBox.width,
          height: boundingBox.height,
        };

        result.push({
          left: (rect.left + (rect.width / 2)) / zoom,
          top:  (rect.top + (rect.height / 2)) / zoom
        });
      });
      return processResult(result);
    };

    /**
     * Obtain the scroll position.
     */
    positioning.getScrollPosition = function () {
      return {
        left: window.pageXOffset,
        top:  window.pageYOffset
      };
    };

    /**
     * Obtains the viewport dimensions, with an optional inset.
     */
    positioning.getViewportDimensions = function (inset, zoom) {
      inset = inset || 0;
      var insetX2 = inset * 2;
      var scrollPos = this.getScrollPosition();
      /*
       * Note that we're using window.innerHeight instead of
       * document.documentElement.clientHeight because these two numbers
       * are very different in Firefox, which will report the height of
       * the body when it is shorter than the window. With Chrome, the
       * numbers are similar as it seems to use the visual height of the
       * body. We don't need to do this for width, but we will for
       * consistency.
       */
      var result = {
        left: scrollPos.left / zoom + inset,
        top:  scrollPos.top  / zoom + inset,
        width: document.documentElement.clientWidth   / zoom - insetX2,
        height: document.documentElement.clientHeight / zoom - insetX2
      };
      result.right = result.left + result.width;
      result.bottom = result.top + result.height;
      result.centerX = result.left + (result.width / 2);
      result.centerY = result.top + (result.height / 2);

      return result;
    };

    /**
     * Center another element over a provided center, zooming the centered element if needed.
     * 
     * @param  string   selector  The selector of the element(s).
     * @param  center   center    The center point, see getCenter()
     * @param  int      zoom      The zoom level.
     * @param  string   position  Set the position of the element, defaults to 'absolute'
     * @return void
     */
    positioning.centerOn = function (selector, center, zoom, position) {
      // Ensure a zoom exists.
      zoom = zoom || 1;
      // Use the proper center.
      center = {
        left: (center.centerX || center.left),
        top: (center.centerY || center.top)
      };

      $(selector).each(function () {
        var jElement = $(this);

        // Obtain the equinox state data for the element.
        var equinoxData = this.equinoxData || (this.equinoxData = {});
        var existingZoom = equinoxData.zoom || (equinoxData.zoom = 1);

        // As we are not moving the element within the DOM, we need to position the
        // element relative to it's offset parent. These calculations need to factor
        // in the total zoom of the parent.
        var offsetParent = jElement.offsetParent();
        var offsetParentPosition = positioning.getOffset(offsetParent);
        var offsetParentZoom = positioning.getTotalZoom(offsetParent);
        var elementTotalZoom = offsetParentZoom;

        // Determine where we would display the centered and (possibly) zoomed element,
        // and what it's dimensions would be.
        var centerLeft = center.left;
        var centerTop = center.top;

        // Determine the final dimensions, and their affect on the CSS dimensions.
        var width = jElement.outerWidth() * elementTotalZoom;
        var height = jElement.outerHeight() * elementTotalZoom;

        var left = centerLeft - (width / 2);
        var top = centerTop - (height / 2);

        // Now, determine if the element will fit in the viewport. If not, place the
        // element in the viewport, but as close the the original center as possible.
        var viewport = positioning.getViewportDimensions(window._vpi);

        // If we need to change the element's dimensions, so be it. However, explicitly
        // set the dimensions only if needed.
        var newWidth, newHeight;

        // Check the width and horizontal positioning.
        if (width > viewport.width) {
          // Easiest case: fit to width and horizontal center of viewport.
          centerLeft = viewport.centerX;
          newWidth = viewport.width;
        } else {
          // The element isn't too wide. However, if the element is out of the view area, move it back in.
          if (viewport.left > left) {
            centerLeft += viewport.left - left;
          } else if ((left + width) > viewport.right) {
            centerLeft -= (left + width) - viewport.right;
          }


        }

        // Check the width and horizontal positioning.
        if (height > viewport.height) {
          // Easiest case: fit to height and vertical center of viewport.
          centerTop = viewport.centerY;
          newHeight = viewport.height;
        } else {
          // The element isn't too tall. However, if the element is out of the view area, move it back in.
          if (viewport.top > top) {
            centerTop += viewport.top - top;
          } else if ((top + height) > viewport.bottom) {
            centerTop -= (top + height) - viewport.bottom;
          }
        }

        // Reduce the dimensions to a non-zoomed value.
        width = (newWidth || width) / elementTotalZoom;
        height = (newHeight || height) / elementTotalZoom;

        // Determine what the left and top CSS values must be to center the
        // (possibly zoomed) element over the determined center.
        var cssMarginLeft = jElement.css('marginLeft') || 0;
        var cssMarginTop = jElement.css('marginTop') || 0;

        var cssLeft = (centerLeft
                       - offsetParentPosition.left
                       - (width * offsetParentZoom / 2)
                       - (parseFloat(cssMarginLeft) * offsetParentZoom)
                      ) / offsetParentZoom;
        var cssTop = (centerTop
                       - offsetParentPosition.top
                       - (height * offsetParentZoom / 2)
                       - (parseFloat(cssMarginTop) * offsetParentZoom)
                      ) / offsetParentZoom;

        // Create the CSS needed to place the element where it needs to be, and to zoom it.
        var cssUpdates = {
          position: position ? position: 'absolute',
          left: cssLeft,
          top: cssTop,

          // Styles applied to aid in testing.
          opacity: 0.5,
          zIndex: 2147483640
        };

        // Only update the dimensions if needed.
        if (newWidth) {
          cssUpdates.width = width;
        }

        if (newHeight) {
          cssUpdates.height = height;
        }

        // Apply the zoom CSS to the CSS object.
        positioning.setZoom(zoom, cssUpdates);

        // Update the element's CSS.
        jElement.css(cssUpdates);

        // Set the zoom state.
        equinoxData.zoom = zoom;
      });
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //    HELPER METHODS.
    //
    ////////////////////////////////////////////////////////////////////////////////

    // Helper method for processing the possibility of N results in an array.
    // If the array is empty, return undefined. If the array has one element,
    // return the single result. Otherwise, return the array of results.
    function processResult(array) {
      if (array.length == 0) {
        return undefined;
      }
      if (array.length == 1) {
        return array[0];
      }
      return array;
    }

    // Get the zoom from the selected element's transform style.
    var _MATRIX_REGEXP = /matrix\s*\(\s*([-0-9.]+)\s*,\s*[-0-9.]+\s*,\s*[-0-9.]+\s*,\s*([-0-9.]+)\s*,\s*[-0-9.]+\s*,\s*[-0-9.]+\s*\)/i;
    function getMagnification(selector, andZoom) {
      var jElement = $(selector), result;
      if (jElement.size() && jElement.get(0).nodeType === 1 /* Element */) {
        var transformStr = jElement.css('transform') || 1;
        var zoom = andZoom ? jElement.css('zoom') || 1 : 1;
       /*
         Interestingly enough, any functionality that relies on this method will return 1
         if running in IE.  Fixing this with the code below will make IE much much worse. :(
       */
       /* if (ieFix && zoom.indexOf && zoom.indexOf('%') !== -1) {
          zoom = zoom.replace('%','') / 100;
        }*/
        result = 1;
        if (transformStr !== 'none' && $.trim(transformStr) !== '') {
          var result = _MATRIX_REGEXP.exec(transformStr);
          if (result && result.length > 1) {
            var scaleX = parseFloat(result[1]);
            result = scaleX;
            // There is an issue here... what should we do in the case of skewed scaling?
            // return scaleX;
          }
        }
        result *= zoom;
      }
      return result || '1';
    }

    // Done.
    callback();

  });

});
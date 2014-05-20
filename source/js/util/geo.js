/**
* Methods for giving us coordinates and sizes, where jQuery was not giving us what we needed.
*/
sitecues.def('util/geo', function(geo, callback) {
  'use strict';

	sitecues.use('jquery', 'conf', 'platform', function($, conf, platform){

    /**
     * Return a corrected bounding box given the total zoom for the element and current scroll position
     */
    geo.getCorrectedBoundingBox = function(boundingBox, scrollPosition) {
      var rect = {
        left: boundingBox.left + scrollPosition.left,
        top:  boundingBox.top + scrollPosition.top,
        width: boundingBox.width,
        height: boundingBox.height
      };
      rect.right = rect.left + rect.width;
      rect.bottom = rect.top + rect.height;
      return rect;
    };

    /**
     * Obtain the scroll position.
     */
    geo.getScrollPosition = function () {
      return {
        left: window.pageXOffset,
        top:  window.pageYOffset
      };
    };

    /**
     * Get the elements' bounding box.
     * DOM function object.getBoundingClientRect() returns a text rectangle object that encloses a group of text rectangles.
     */
    geo.getBoundingBox = function (element) {
      // Perform the calculations for all selected elements.
      var scrollPosition = geo.getScrollPosition();
      var boundingBox = element.getBoundingClientRect();
      return geo.getCorrectedBoundingBox(boundingBox, scrollPosition);
    };

    /**
     * Returns the offset of the provided element, with calculations based upon getBoundingClientRect().
     */
    geo.getOffset = function (element) {
      var rect = geo.getBoundingBox(element);
      return { left : rect.left, top : rect.top };
    };

		geo.isPointInRect = function(x, y, rect) {
			var right = rect.left + rect.width;
			var bottom = rect.top + rect.height;
			return (x >= rect.left) && (x < right) && (y >= rect.top) && (y <= bottom);
		};

		geo.isPointInAnyRect = function(x, y, rects) {
			for (var count = 0; count < rects.length; count++) {
				if (geo.isPointInRect(x, y, rects[count])) {
					return true;
				}
			}
			return false;
		};

		/**
		 * Expand or contract rectangle
		 * @param rect  Original rectgangle
		 * @param delta  Positive value to expand rectangle, or negative to contract
		 * @returns Object new rectangle
		 */
		geo.expandOrContractRect = function(rect, delta) {
			var newRect = {
				left: rect.left - delta,
				top: rect.top - delta,
				width: rect.width + 2*delta,
				height: rect.height + 2*delta
			};
			newRect.right = newRect.left + newRect.width;
			newRect.bottom = newRect.top + newRect.height;
			return newRect;
		};

    /**
     * Obtains the viewport dimensions, with an optional inset.
     */
    geo.getViewportDimensions = function (inset) {
      var zoomFactor = platform.browser.isIE ? 1 : conf.get('zoom');
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
        left: scrollPos.left / zoomFactor + inset,
        top:  scrollPos.top  / zoomFactor + inset,
        width: document.documentElement.clientWidth   / zoomFactor - insetX2,
        height: document.documentElement.clientHeight / zoomFactor - insetX2
      };
      result.right = result.left + result.width;
      result.bottom = result.top + result.height;
      result.centerX = result.left + (result.width / 2);
      result.centerY = result.top + (result.height / 2);

      return result;
    };

    // done
		callback();

	});

});
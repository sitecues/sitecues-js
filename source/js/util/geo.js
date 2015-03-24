/**
* Methods for giving us coordinates and sizes, where jQuery was not giving us what we needed.
*/
sitecues.def('util/geo', function(geo, callback) {
  'use strict';

	sitecues.use('jquery', 'conf', 'platform', function($, conf, platform){

    // Is the point inside the rectangle or within proximity pixels
    // @param proximity (optional) Number of pixels of extra proximity allowed
		geo.isPointInRect = function(x, y, rect, proximity) {
      proximity = proximity || 0;
			var right = rect.left + rect.width,
			  bottom = rect.top + rect.height;
			return x >= rect.left - proximity && x < right + proximity && y >= rect.top - proximity && y <= bottom + proximity;
		};

    // Is the point inside any of the supplied rectangles or within proximity pixels
    // @param proximity (optional) Number of pixels of extra proximity allowed
		geo.isPointInAnyRect = function(x, y, rects, proximity) {
			for (var count = 0; count < rects.length; count++) {
				if (rects[count] && geo.isPointInRect(x, y, rects[count], proximity)) {
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

    geo.expandOrContractRects = function(rects, delta) {
      var numRects = rects.length,
        index = 0;
      for (; index < numRects; index ++ ) {
        rects[index] = geo.expandOrContractRect(rects[index], delta);
      }
    };

    // done
		callback();

	});

});
/**
* Methods for giving us coordinates and sizes, where jQuery was not giving us what we needed.
*/
sitecues.def('util/geo', function(geo, callback) {
  'use strict';

	sitecues.use('jquery', 'conf', 'platform', function($, conf, platform){

		function isPointInRect(x, y, rect) {
			var right = rect.left + rect.width;
			var bottom = rect.top + rect.height;
			return (x >= rect.left) && (x < right) && (y >= rect.top) && (y <= bottom);
		}

		geo.isPointInAnyRect = function(x, y, rects) {
			for (var count = 0; count < rects.length; count++) {
				if (rects[count] && isPointInRect(x, y, rects[count])) {
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

    // done
		callback();

	});

});
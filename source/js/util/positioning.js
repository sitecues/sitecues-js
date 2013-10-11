/**
 * This is module for common positioning utilities that might need to be used across all of the different modules.
 */
sitecues.def('util/positioning', function (positioning, callback) {

	    positioning.kMinRectWidth = 3;
	    positioning.kMinRectHeight = 3;

    sitecues.use('jquery', 'util/common', function ($, common) {

        /**
         * Get the cumulative zoom for an element.
         */
        positioning.getTotalZoom = function (selector, andZoom) {
            var _recurse = function (element) {
                if (!element) {
                    return 1;
                }
                var value = getMagnification(element, andZoom);
                return (value ? value : 1) * _recurse(element.parentElement);
            };

            var result = [];
            $(selector).each(function () {
                result.push(_recurse(this));
            });
            return processResult(result);
        }

        /**
         * Sets the zoom of an element, with the body being the default element.
         */
        positioning.setZoom = function (selector, zoom, origin) {
            // Ensure a zoom exists.
            zoom = zoom || 1;
            selector = (selector ? selector : document.body);
            var transformCenter = origin ? origin.x + ' ' + origin.y : '50% 50%'; // default
            var zoomStyle = {'transform-origin': transformCenter};
            $(selector).each(function () {
                zoomStyle.transform = 'scale(' + zoom + ',' + zoom + ')';
                $(this).style(zoomStyle, '', 'important');
            });
        }

        /**
         * Get the mouse event coordinates relative to the document origin.
         */
        positioning.getMouseCoords = function (e, zoom) {
            // Ensure a zoom exists.
            zoom = zoom || 1;
            return {
                left: e.clientX / zoom,
                top:  e.clientY / zoom
            };
        }

	    /**
	     * Return a corrected bounding box given the total zoom for the element and current scroll position
	     */
	    positioning.getCorrectedBoundingBox = function(boundingBox, totalZoom, scrollPosition) {
		    return {
			    left: boundingBox.left + scrollPosition.left/ totalZoom,
			    top:  boundingBox.top + scrollPosition.top  / totalZoom,
			    width: boundingBox.width,
			    height: boundingBox.height
		    };
	    }

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
	    }

	    positioning.convertFixedRectsToAbsolute = function(fixedRects, zoom) {
		    var absoluteRects = [];
			  var scrollPos = positioning.getScrollPosition();
		    for (var count = 0; count < fixedRects.length; count ++) {
			    absoluteRects[count] = positioning.getCorrectedBoundingBox(fixedRects[count], zoom, scrollPos);
		    }
		    return absoluteRects;
	    }

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
	    positioning.getAllBoundingBoxes = function (selector, proximityBeforeBoxesMerged) {
		    var allRects = [];

		    var $selector = $(selector);
		    var clipRect = getAncestorClipRect($selector);
		    getAllBoundingBoxesExact($selector, allRects, clipRect);
		    positioning.combineIntersectingRects(allRects, proximityBeforeBoxesMerged); // Merge overlapping boxes

		    return allRects;
	    }

	    /**
	     * Use shrink-wrapped box for potentially wrapped content
	     * Otherwise use element bounds -- this way there is enough room for single-line content and it doesn't need to wrap
	     * when it didn't need to wrap before.
	     */
	    positioning.getSmartBoundingBox = function(item)
	    {
		    var contentRect = positioning.getAllBoundingBoxes(item, 9999)[0];
		    var lineHeight = common.getLineHeight(item);
		    var isSingleLine = contentRect && (contentRect.height < lineHeight * 1.5); // Quickly determined whether not line-wrapped
		    if (isSingleLine)
			    return item.getBoundingClientRect();

		    return contentRect;
	    }

	    function getBoundingRectMinusPadding(node) {
		    var range = document.createRange();
		    range.selectNode(node);
		    var rect = range.getBoundingClientRect();
		    if (node.nodeType !== 1) {
			    return rect;
		    }
		    // Reduce by padding amount -- useful for images such as Google Logo
		    // which have a ginormous amount of padding on one side
		    // TODO: should we use common.getElementComputedStyles() ?
		    var paddingTop = parseFloat($(node).css('padding-top'));
		    var paddingLeft = parseFloat($(node).css('padding-left'));
		    var paddingBottom = parseFloat($(node).css('padding-bottom'));
		    var paddingRight = parseFloat($(node).css('padding-right'));
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

	    // Only use leaf nodes (where content resides), in order to avoid rects taht
	    // were purposely positioned offscreen
	    function getAllBoundingBoxesExact($selector, allRects, clipRect) {
		    $selector.each(function () {
			    var isElement = this.nodeType === 1;
			    // TODO: should we use common.getElementComputedStyles() ?
			    if (isElement && $(this).css('visibility') !== 'visible') {
					return true; // Don't look at this hidden element
			    }
			    if (this.hasChildNodes()) {  // TODO do we want to union ourselves if there is a visible border?
				    // Use bounds of visible descendants, but clipped by the bounds of this ancestor
				    var isClip = isClipElement(this);
				    var newClipRect = clipRect;
				    if (isClip) {
					    newClipRect = this.getBoundingClientRect();
					    if (clipRect) {  // Combine parent clip rect with new clip
						    newClipRect = getClippedRect(clipRect, newClipRect);
					    }
				    }
			        getAllBoundingBoxesExact($(this.childNodes), allRects, newClipRect);  // Recursion
			    }
			    else { // Leaf node -- has visible contents
				    var rect = getBoundingRectMinusPadding(this);
				    rect = getClippedRect(rect, clipRect);

				    if (rect.width > positioning.kMinRectWidth  && rect.height > positioning.kMinRectHeight  &&
					    rect.right > 0 && rect.bottom > 0) {
				        // Don't be fooled by items hidden offscreen or by empty nodes -- those rects don't count
					    allRects.push(rect);
				    }
			    }
		    });
	    }

	    function isClipElement(element) {
		    // TODO: should we use common.getElementComputedStyles() ?
		    return $(element).css('clip') !== 'auto' || $(element).css('overflow') !== 'visible';
	    }

	    function getClippedRect(r1, r2) {
		    if (!r2) {
			    return r1;
		    }
		    var left   = Math.max( r1.left, r2.left);
		    var right  = Math.min( r1.left + r1.width, r2.left + r2.width);
		    var top    = Math.max( r1.top, r2.top );
		    var bottom = Math.min( r1.top + r1.height, r2.top + r2.height);
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
				    if (index >= kMaxAncestorsToCheck)
				        return false;
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
        }

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
				    height: bottom - top
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

	    /**
         * Returns the center of the provided element.
         */
        positioning.getCenter = function (selector) {
            var result = [];
            $(selector).each(function () {
	            var fixedRects = positioning.getAllBoundingBoxes(this, 9999);
	            var zoom = positioning.getTotalZoom(this, true);
	            var rect = positioning.convertFixedRectsToAbsolute(fixedRects, zoom)[0];

                result.push({
                    left: rect.left + (rect.width / 2),
                    top:  rect.top + (rect.height / 2)
                });
            });
            return processResult(result);
        }

        /**
         * Obtain the scroll position.
         */
        positioning.getScrollPosition = function () {
            return {
                left: window.pageXOffset,
                top:  window.pageYOffset
            };
        }

	    /**
         * Obtains the viewport dimensions, with an optional inset.
         */
        positioning.getViewportDimensions = function (inset, zoom) {
            inset = inset || 0;
			zoom  = zoom  || 1;
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
                left: scrollPos.left + inset,
                top: scrollPos.top + inset,
                width: window.innerWidth - insetX2,
                height: window.innerHeight - insetX2
            };
            result.right = result.left + result.width;
            result.bottom = result.top + result.height;
            result.centerX = result.left + (result.width / 2);
            result.centerY = result.top + (result.height / 2);

            // In any other case, re-scale dimensions to get pure(not zoomed) values.
            for (var prop in result) {
                result[prop] /= zoom;
            }
            

            return result;
        }

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
                var elementTotalZoom = offsetParentZoom * zoom;

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
        }

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
            var jElement = $(selector);
            if (jElement.size() && jElement.get(0).nodeType === 1 /* Element */) {
                var transformStr = jElement.css('transform') || 1;
                var zoom = andZoom ? jElement.css('zoom') || 1 : 1;
                var result = 1;
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
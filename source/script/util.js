/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
eqnx.def('util', function (util, callback) {

    eqnx.use('jquery', function ($) {

        /**
         * Get the cumulative zoom for an element.
         */
        util.getTotalZoom = function (selector) {
            var _recurse = function (element) {
                if (!element) {
                    return 1;
                }
                var value = getZoom(element);
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
        util.setZoom = function (selector, zoom) {
            // Ensure a zoom exists.
            zoom = zoom || 1;
            selector = (selector ? selector : document.body);
            var zoomStyle = { transformOrigin: '0 0' };
            $(selector).each(function () {
                zoomStyle.transform = 'scale(' + zoom + ',' + zoom + ')';
                $(this).css(zoomStyle);
            });
        }

        /**
         * Get the mouse event coordinates relative to the document origin.
         */
        util.getMouseCoords = function (e, zoom) {
            // Ensure a zoom exists.
            zoom = zoom || 1;
            return {
                left: e.clientX / zoom,
                top:  e.clientY / zoom
            };
        }

        /**
         * Returns the offset of the provided element, with calculations based upon etBoundingClientRect().
         */
        util.getOffset = function (selector) {
            // Perform the calculations for all selected elements.
            var result = [];
            $(selector).each(function () {
                var scrollPosition = util.getScrollPosition();
                var boundingBox = this.getBoundingClientRect();
                var totalZoom = util.getTotalZoom(this);
                var css = $(this).css(['borderLeftWidth', 'borderTopWidth']);

                result.push({
                    left: boundingBox.left + scrollPosition.left,
                    top: boundingBox.top + scrollPosition.top
                });
            });
            return processResult(result);
        }

        /**
         * Returns the center of the provided element.
         */
        util.getCenter = function (selector) {
            var result = [];
            $(selector).each(function () {
                var jElement = $(this);
                var offset = util.getOffset(this);
                var totalZoom = util.getTotalZoom(this);

                result.push({
                    left: offset.left + (jElement.outerWidth() * totalZoom / 2),
                    top: offset.top + (jElement.outerHeight() * totalZoom / 2)
                });
            });
            return processResult(result);
        }

        /**
         * Obtain the scroll position.
         */
        util.getScrollPosition = function () {
            return {
                left: window.pageXOffset,
                top:  window.pageYOffset
            };
        }

        /**
         * Get the elements' bounding boxes.
         * DOM function object.getBoundingClientRect() returns a text rectangle object that encloses a group of text rectangles.
         */
        util.getBoundingBox = function (selector) {
            var result = [];
            $(selector).each(function () {
                result.push(this.getBoundingClientRect());
            });
            return processResult(result);
        }

        /**
         * Obtains the viewport dimensions, with an optional inset.
         */
        util.getViewportDimensions = function (inset) {
            inset = inset || 0;
            var insetX2 = inset * 2;
            var scrollPos = this.getScrollPosition();
            var result = {
                left: scrollPos.left + inset,
                top: scrollPos.top + inset,
                width: document.documentElement.clientWidth - insetX2,
                height: document.documentElement.clientHeight - insetX2
            };
            result.right = result.left + result.width;
            result.bottom = result.top + result.height;
            result.centerX = result.left + (result.width / 2);
            result.centerY = result.top + (result.height / 2);

            return result;
        }

        /**
         * Center another element over a provided center, zooming the centered element if needed.
         */
        util.centerOn = function (selector, center, zoom) {
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
                var offsetParentPosition = util.getOffset(offsetParent);
                var offsetParentZoom = util.getTotalZoom(offsetParent);
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
                var viewport = util.getViewportDimensions(window._vpi);

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
                var css = jElement.css(['marginLeft', 'marginTop']);

                var cssLeft = (centerLeft
                               - offsetParentPosition.left
                               - (width * offsetParentZoom / 2)
                               - (parseFloat(css.marginLeft) * offsetParentZoom)
                              ) / offsetParentZoom;
                var cssTop = (centerTop
                               - offsetParentPosition.top
                               - (height * offsetParentZoom / 2)
                               - (parseFloat(css.marginTop) * offsetParentZoom)
                              ) / offsetParentZoom;

                // Create the CSS needed to place the element where it needs to be, and to zoom it.
                var cssUpdates = {
                    position: 'absolute',
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
                util.setZoom(zoom, cssUpdates);

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

        // Helper method for processing the possibilty of N results in an array.
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
        function getZoom(selector, defaultToOne) {
            var defaultZoom = (defaultToOne ? '1' : undefined);
            var zoom = undefined;
            var jElement = $(selector);
            if (jElement.size()) {
                var transformStr = jElement.css('transform');
                if (transformStr) {
                    var result = _MATRIX_REGEXP.exec(transformStr);
                    if (result && result.length > 1) {
                        var scaleX = parseFloat(result[1]);
                        // There is an issue here... what should we do in the case of skewed scaling?
                        return scaleX;
                    }
                }
            }
            return defaultZoom;
        }

        // Done.
        callback();

    });

});
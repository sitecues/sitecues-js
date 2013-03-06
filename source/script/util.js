/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
eqnx.def('util', function (util, callback) {

    eqnx.use('jquery', function ($) {

        /**
         * Sets the zoom of an element, with the body being the default element.
         */
        util.setZoom = function(selector, zoom) {
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
            zoom = zoom || 1;
            var scrollPosition = this.getScrollPosition();
            return {
                left: scrollPosition.left + e.clientX / zoom,
                top:  scrollPosition.top  + e.clientY / zoom
            };
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
    });

    // Done.
    callback();
});
/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - creates, inserts in DOM and shows in the window the custom cursor;
 * - hides the existing cursor when custom cursor is visible so that there are not two cursors;
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
eqnx.def('cursor', function (cursor, callback) {

    /* Static properties */
    cursor.isEnabled = false; // if cursor module is enabled
    cursor.isVisible = false; // if custom cursor is visible
    cursor.zoomLevel = 1;
    cursor.cursorType = 'default'; // also, may be either 'none' or 'auto'.

    /* Constants */
    cursor.imageDefaultUrl = '//ai2.s3.amazonaws.com/assets/cursors/pointer-001.png';
    cursor.imagePointerUrl = '//ai2.s3.amazonaws.com/assets/cursors/pointer-hand.png';
    // TK: Using this value to improve the visibility of the cursor when zooming.
    // This might need to be a user specified value in the future.
    cursor.kCursorHideRuleId = 'eq360-cursor-hide-rule';
    cursor.kCursorId = 'eq360-cursor';
    cursor.kZindex = 2147483647;
    cursor.kMinCursorZoom = 1.5;

    // Get dependencies
    eqnx.use('jquery', 'conf', 'util', 'ui', function ($, conf, util) {
        // private variables
        cursor.zoomLevel = conf.get('zoom');
        cursor.styleRuleParent = $('head');
        cursor.isEnabled = cursor.zoomLevel > cursor.kMinCursorZoom;

        $(document).mousemove(function (e) {
            cursor.clientX = e.pageX;
            cursor.clientY = e.pageY;
        });

        /**
         * Cursor element takes over the appearance of the mouse cursor.
         */
        // todo: add better support for cursor types.
        cursor.create = function () {
            var properImageLocation = cursor.cursorType === 'pointer' ? cursor.imagePointerUrl : cursor.imageDefaultUrl;
            var cursorElement = $('<img>')
                                .attr('id', this.kCursorId)
                                .attr('src', properImageLocation)
                                .css({zIndex: this.kZindex.toString()})
                                .appendTo('body');

            return cursorElement;
        };

        /**
         * Show cursor in the viewport.
         */
        cursor.show = function () {
            if (!this.element) {
                this.element = this.create();
            }

            cursor.element[0].style.left = (cursor.clientX / cursor.zoomLevel) + 'px';
            cursor.element[0].style.top = (cursor.clientY / cursor.zoomLevel) + 'px';
            // Init custom cursor position.
            util.setZoom(this.element, this.zoomLevel);
            this.isVisible = true;
            eqnx.emit('cursor/show', this.element);

        };

        /**
         * Hide cursor in the viewport.
         */
        cursor.hide = function () {
            // Do nothing if custom cursor is not shown.
            if (!this.isVisible) {
                return;
            }
            toogleRealCursor(true);
            this.element.hide();
            this.isVisible = false;
            eqnx.emit('cursor/hide', this.element);

        };

        /**
         * Enables/disables the cursor module when needed.
         */
        cursor.turnOnOrOff = function () {
            this.isEnabled = this.zoomLevel > this.kMinCursorZoom;
            this.isEnabled ? this.show() : this.hide();
        };

        /* Window event handlers */

        /**
         * Bind or unbind window events we care about.
         */
        // todo: set 'blur' and 'focus' window events listeners/handlers if necessary.
        function handleMouseEvents() {
            if (cursor.isEnabled) {
                window.addEventListener("mousemove", mouseMoveHandler, false);
                window.addEventListener("mouseout", mouseOutHandler, false);
            } else {
                window.removeEventListener("mousemove", mouseMoveHandler, false);
                window.removeEventListener("mouseout", mouseOutHandler, false);
            }
        }

        /**
         * Takes care of 'mousemove' window event.
         * @param e
         */
        function mouseMoveHandler(e) {
            // Do nothing if custom cursor is not shown.
            if (!cursor.isVisible) {
                return;
            }

            // Hide native cursor if custom cursor.
            toogleRealCursor(false);
            // Update image of the cursor element if the target requires.
            changeCursorDisplay($(e.target));
            // Update custom cursor position.
            var position = util.getMouseCoords(e, cursor.zoomLevel);
            cursor.element.css({ left: position.left + 'px',
                                 top:  position.top + 'px' })
                          .show();
        }

        /**
         * Takes care of 'mouseout' window event.
         * Tracks that cursor is not in browser window any longer, if so - hides custom cursor.
         * @param e
         */
        function mouseOutHandler(e) {
            // Do nothing if custom cursor is not shown.
            if (!cursor.isVisible) {
                return;
            }
            if (e.target == document.documentElement) {
                cursor.element.hide();
            }
        }

        /* Auxiliary functions */

        /**
         * Updates image of the cursor element if the target needs.
         * @param target
         */
        // todo: add better support for cursor types.
        function changeCursorDisplay(target) {
            var newCursorType = target[0].style.cursor.trim === '' ? target.css('cursor') : target[0].style.cursor;
            if (cursor.cursorType !== newCursorType) { // if cursor type has changed
                cursor.cursorType = newCursorType;
                var properImageLocation = cursor.cursorType === 'pointer' ? cursor.imagePointerUrl : cursor.imageDefaultUrl;
                cursor.element.removeAttr('src').attr('src', properImageLocation);
            }
        }

        /**
         * Hides or show the real mouse cursor dependently on the parameter given.
         * If we are showing our own mouse cursor we don't want the real cursor because that would be a double cursor.
         * @param setRealCursorVisible
         */
        function toogleRealCursor(setRealCursorVisible) {
            if (setRealCursorVisible) {
                $('#' + cursor.kCursorHideRuleId).remove();
            } else {
                // if the rule is not already in DOM
                if ($('#' + cursor.kCursorHideRuleId).length === 0) {
                    cursor.styleRuleParent.append('<style id="' + cursor.kCursorHideRuleId + '">* { cursor: none !important;}</style>');
                }
            }
        }

        /**
         * Consider this as the start point of the module body.
         */

        cursor.turnOnOrOff();
        handleMouseEvents();

        /**
         * Handle zoom event.
         */
        eqnx.on('zoom', function (zoomvalue) {
            cursor.zoomLevel = zoomvalue;
            cursor.turnOnOrOff();
            handleMouseEvents();
        });


        // Done.
        callback();

    });
});
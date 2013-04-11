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
    cursor.zoomLevel = 1;
    cursor.cursorType = 'default'; // also, may be either 'none' or 'auto'.

    /* Constants */
    cursor.image_urls = {
        _default: '//ai2.s3.amazonaws.com/assets/cursors/pointer-001.png',
        pointer:  '//ai2.s3.amazonaws.com/assets/cursors/pointer-hand.png'
    };
    cursor.kCursorHideRuleId = 'eqnx-eq360-cursor-hide-rule';
    cursor.kCursorId = 'eqnx-eq360-cursor';
    cursor.kZindex = 2147483647;
    cursor.kMinCursorZoom = 1.5;

    // Get dependencies
    eqnx.use('jquery', 'conf', 'util/positioning', 'ui', function ($, conf, positioning) {
        // private variables
        cursor.styleRuleParent = $('head');
        cursor.isEnabled = (cursor.zoomLevel >= cursor.kMinCursorZoom);

        /**
         * Cursor element takes over the appearance of the mouse cursor.
         */
        // todo: add better support for cursor types.
        cursor.init = function (value) {
            this.zoomLevel = value * value;
            this.toggleState();
        };

        cursor.create = function () {
            var properImageLocation = (cursor.cursorType === 'pointer') ? cursor.image_urls.pointer : cursor.image_urls._default;
            var cursorElement = $('<img>')
                                .attr('id', this.kCursorId)
                                .attr('src', properImageLocation)
                                .css({zIndex: this.kZindex.toString()})
                                .appendTo('html');

            return cursorElement;
        };

        /**
         * Show cursor in the viewport.
         */
        cursor.show = function () {
            if (!this.element) {
                this.element = this.create();
            }

            // Hide native cursor if custom cursor.
            toggleRealCursor(false);

            // Init custom cursor position.
            if (this.clientX && this.clientY) {
                this.element.css({
                    left: this.clientX + 'px',
                    top:  this.clientY + 'px'
                })
                .show();
            }

            this.update();

            eqnx.emit('cursor/show', this.element);
        };

        cursor.update = function () {
            positioning.setZoom( this.element, this.zoomLevel, {
                x: 0,
                y: 0
            } );

            eqnx.emit('cursor/update', this.element);
        };

        /**
         * Hide cursor in the viewport.
         */
        cursor.hide = function () {
            if (!this.element) {
                return;
            }
            toggleRealCursor(true);

            this.element.hide();

            eqnx.emit('cursor/hide', this.element);
        };

        /**
         * Enables/disables the cursor module when needed.
         */
        cursor.toggleState = function () {
            var cursorWasEnabled = this.isEnabled;

            this.isEnabled = this.zoomLevel >= this.kMinCursorZoom;

            if (cursorWasEnabled && this.isEnabled) {
                this.update();
            } else if (this.isEnabled) {
                this.show();

                handleCursorEnabled();
            } else {
                this.hide();

                handleCursorDisabled();
            }
        };

        function handleCursorEnabled() {
            window.addEventListener("mousemove", mouseMoveHandler, false);
            // Track if user only clicks zoomin/zoomout buttons but do not move the mouse.
            window.addEventListener("click", mouseMoveHandler, false);
            window.addEventListener("mouseout", mouseOutHandler, false);
        }

        function handleCursorDisabled() {
            window.removeEventListener("mousemove", mouseMoveHandler, false);
            window.removeEventListener("click", mouseMoveHandler, false);
            window.removeEventListener("mouseout", mouseOutHandler, false);
        }

        /**
         * Takes care of 'mousemove' window event.
         * @param e
         */
        function mouseMoveHandler(e) {
            // Update image of the cursor element if the target requires.
            changeCursorDisplay($(e.target));
            // Update custom cursor position.
            var position = positioning.getMouseCoords(e);
            if (position.left && position.top) {
                cursor.element.css({
                    left: position.left + 'px',
                    top: position.top + 'px'
                })
              .show();
            }
        }

        /**
         * Takes care of 'mouseout' window event.
         * Tracks that cursor is not in browser window any longer, if so - hides custom cursor.
         * @param e
         */
        function mouseOutHandler(e) {
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
            var newCursorType = whatCursorStyle($(target));
            if (cursor.cursorType !== newCursorType) { // if cursor type has changed
                cursor.cursorType = newCursorType;
                var properImageLocation = (cursor.cursorType === 'pointer') ? cursor.image_urls.pointer : cursor.image_urls._default;
                cursor.element.removeAttr('src').attr('src', properImageLocation);
            }
        }

        /**
         * Hides or show the real mouse cursor dependently on the parameter given.
         * If we are showing our own mouse cursor we don't want the real cursor because that would be a double cursor.
         * @param setRealCursorVisible
         */
        function toggleRealCursor(setRealCursorVisible) {
            if (setRealCursorVisible) {
                $('#' + cursor.kCursorHideRuleId).remove();
            } else {
                // if the rule is not already in DOM
                if ($('#' + cursor.kCursorHideRuleId).length === 0) {
                    cursor.styleRuleParent.append('<style id="' + cursor.kCursorHideRuleId + '">* { cursor: none !important; }</style>');
                }
            }
        }

        /**
         * Returns the cursor type for a specific element.
         *
         * @param  {HTMLElement} element The element we need a cursor style for.
         * @param  {Object}      options Options for the plugin.
         * @return {String|null}         Returns a string with the element's cursor style or null if it is unknown.
         */
        function whatCursorStyle(element, options) {
            element = $(element);
            options = $.extend({
                cursor_elements: null
            }, options);

            var css_cursor = element.css('cursor');

            if (
                css_cursor === 'auto' ||
                css_cursor === 'default'
            ) {
                var cursor_elements  = (options.cursor_elements !== null) ? options.cursor_elements : {
                    a:        {
                        cursor: 'pointer'
                    },
                    button:   {
                        cursor: 'pointer'
                    },
                    input:    {
                        selectors: {
                            '[type="button"]':   'pointer',
                            '[type="checkbox"]': 'pointer',
                            '[type="email"]':    'text',
                            '[type="image"]':    'pointer',
                            '[type="radio"]':    'pointer',
                            '[type="search"]':   'text',
                            '[type="submit"]':   'pointer',
                            '[type="text"]':     'text'
                        }
                    },
                    label:    {
                        cursor: 'pointer'
                    },
                    p:        {
                        cursor: 'text'
                    },
                    select:   {
                        cursor: 'pointer'
                    },
                    textarea: {
                        cursor: 'text'
                    }
                };
                var element_tag_name = element.prop('tagName').toLowerCase();

                if (cursor_elements.hasOwnProperty(element_tag_name)) {
                    var element_tag = cursor_elements[element_tag_name];
                    var selectors   = element_tag.selectors;

                    if (typeof selectors !== 'undefined') {
                        for (var key in selectors) {
                            if (element.is(key)) {
                                return selectors[key];
                            }
                        }
                    }
                    else {
                        return element_tag.cursor;
                    }
                }
            }
            else if (
                css_cursor !== 'auto' &&
                css_cursor !== 'default' &&
                css_cursor !== null &&
                typeof css_cursor !== 'undefined'
            ) {
                return css_cursor;
            }
            else {
                return null;
            }
        }

        /**
         * Consider this as the start point of the module body.
         */
        $(document).bind('mousemove click', function (e) {
            var position = positioning.getMouseCoords(e);

            cursor.clientX = position.left;
            cursor.clientY = position.top;
        });

        cursor.init(conf.get('zoom'));

        /**
         * Handle zoom event.
         */
        eqnx.on('zoom', function (value) {
            cursor.init(value);
        });

        // Done.
        callback();
    });
});
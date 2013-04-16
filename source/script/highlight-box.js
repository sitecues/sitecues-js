/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 */
eqnx.def('highlight-box', function (highlightBox, callback) {

    // Get dependencies
    eqnx.use('jquery', 'conf', 'cursor', 'util/positioning', 'util/common', 'background-dimmer', 'ui', 'jquery/transform2d', 'jquery/color',
    function ($, conf, cursor, positioning, common, backgroundDimmer) {

        // Constants

        // This is the default setting, the value used at runtime will be in conf.
        var kMinHighlightZoom = 1.01;

        var extraZoom = 1.5;
        var kPanelId = 'eqnx-panel';
        var kBadgeId = 'eqnx-badge';

        // The states that the HLB can be in.
        // TODO: Convert to state instances.
        var STATES = highlightBox.STATES = {
            // The HLB is off. The zoom level of the page is too low to allow for HLB creation.
            OFF: {
                id : 0,
                name : 'off'
            },

            // The HLB is on, and ready to create HLBs.
            ON: {
                id : 1,
                name : 'on'
            },

            // The HLB (instance) has been created and is initializing.
            CREATE: {
                id : 2,
                name : 'create'
            },

            // The HLB (instance) is in the animation phase of inflating.
            INFLATING: {
                id : 3,
                name : 'inflating'
            },

            // The HLB (instance) is inflated and ready for interaction.
            READY: {
                id : 4,
                name : 'ready'
            },

            // The HLB (instance) is in the animation of deflating.
            DEFLATING: {
                id : 5,
                name : 'deflating'
            },

            // The HLB (instance) is closed.
            CLOSED: {
                id : 6,
                name : 'closed'
            }
        };

        // The global HLB state. Toggles between on and off. This state is subordinate to the the instance state.
        // Initially set to null so that the zoom check will trigger an event.
        var state = null;

        conf.set('highlightBoxMinZoom', kMinHighlightZoom);

        // Update the zoom level of the page, which effects whether or not the HLB is off or on.
        var updateZoomLevel = function (zl) {
            var newState = (zl >= conf.get('highlightBoxMinZoom') ? STATES.ON : STATES.OFF);
            if (newState !== state) {
                state = newState;
                eqnx.emit('hlb/' + state.name, highlightBox);
            }
        };

        // Current highlight box instance, only work with it. There can only be one instance in the system
        // that is not in the CLOSED state, and that instance will be referenced by 'instance'
        var instance = null;

        // Returns the state of the highlight box module. If there is no instance, use the global state.
        var getState = highlightBox.getState = function() {
            return (instance ? instance.getState() : state);
        };

        // Add easing function for box open animation, to create bounce-back effect
        $.extend($['easing'], {   // From http://stackoverflow.com/questions/5207301
            easeOutBack: function (x, t, b, c, d, s) {
                if (s == undefined) s = 1.70158;
                return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
            }
        });

        // Performs global clean-up when an instance is closed.
        var onHighlightBoxClosed = function() {
            // All we need to do at the current time within the module is remove the instance.
            instance = null;
        };

        var HighlightBox = (function () {
            // Initialize.
            function HighlightBox(target) {
                this.state = STATES.CREATE;
                this.savedCss = [];
                this.savedStyleAttr = [];
                this.origRectDimensions = [];
                this.item = target; // Need to know when we have box for checking mouse events before closing prematurely
                this.itemNode = $(this.item);

                // notify about new hlb
                eqnx.emit('hlb/create', this.item);

                var computedStyles = common.getElementComputedStyles(this.item);
                var offset = positioning.getOffset(this.item);
                var width = (computedStyles.width === 'auto' || computedStyles.width === '') ? this.itemNode.width() : computedStyles.width;
                var height = (computedStyles.height === 'auto' || computedStyles.height === '') ? this.itemNode.height() : computedStyles.height;
                var size = { width: parseFloat(width), height: parseFloat(height) };

                this.origRectDimensions.push($.extend(offset, size)); // Only numeric values, useful for calculations
                this.savedCss.push(computedStyles);
                this.savedStyleAttr.push(this.itemNode.attr('style'));
            }

            // Constants
            HighlightBox.kShowBoxSpeed = 300;
            HighlightBox.kHideBoxSpeed = 150;
            HighlightBox.kBoxZindex = cursor.kZindex - 1; // Ensure that cursor is on top, we're above everything else.
            HighlightBox.kMinDistanceFromEdge = 32;       // The viewport inset from the window edges.
            HighlightBox.kBoxBorderWidth = '3px';
            HighlightBox.kBoxPadding = '4px'; // Give the text a little extra room
            HighlightBox.kBoxBorderRadius = '4px';
            HighlightBox.kBoxBorderStyle = 'solid';
            HighlightBox.kBoxBorderColor = '#222222';
            HighlightBox.kDefaultBgColor = '#ffffff';
            // Space placeholders prevent content after box from going underneath it.
            HighlightBox.kPlaceHolderClass = 'eqnx-eq360-box-placeholder';
            HighlightBox.kPlaceHolderWrapperClass = 'eqnx-eq360-box-placeholder-wrapper';
            // TODO: Expand this array to include all appropriate elements.
            // HighlightBox.kDimensionAdjustableElements = { p: true, span: true, td: true };

            /**
             * Get the state of the highlight box.
             */
            HighlightBox.prototype.getState = function () {
                return this.state;
            };

            /**
             * Show a highlight reading box when triggered.
             */
            HighlightBox.prototype.inflate = function () {
                // Immediately enter the
                this.state = STATES.INFLATING;
                eqnx.emit('hlb/inflating', this.item);

                var _this = this;

                // Prepare clone element as a clone of the scaled highlight box element.
                var clone = this.item.cloneNode(true),
                    cloneNode = $(clone),
                    // Get the current element styles.
                    currentStyle = this.savedCss[this.savedCss.length - 1],
                    origRectSize = this.origRectDimensions[this.origRectDimensions.length - 1];

                var center    = positioning.getCenter(this.item);
                var totalZoom = positioning.getTotalZoom(this.item, true);
                var cssUpdate = getNewRectStyle(this.itemNode, center, extraZoom, totalZoom);

                // Handle table special behaviour on inner contents.
                handleTableElement(this.itemNode, currentStyle);

                // If background color computed is not contrast to text color, invert background one.
                var oldBgColor = currentStyle.backgroundColor;
                var newBgColor = getNewBackgroundColor(this.itemNode, oldBgColor);
                var compStyle = this.item.currentStyle || window.getComputedStyle(this.item, null);
                var color = compStyle.getPropertyCSSValue("color");
                var isContrastColors = common.getIsContrastColors(color, newBgColor);

                var clientRect = this.item.getBoundingClientRect();

                var cssBeforeAnimateStyles = $.extend({}, {top: cssUpdate.top, left: cssUpdate.left}, {
                    transformOrigin: '50% 50%',
                    position: 'absolute',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    width: clientRect.width, // sometimes width is rounded, so float part gets lost. preserve it so that inner content is not rearranged when width is a bit narrowed.
                    height: 'auto',
                    maxHeight: cssUpdate.maxHeight,
                    zIndex: HighlightBox.kBoxZindex.toString(),
                    border: '0px solid white',
                    listStylePosition: 'inside',
                    margin: '0',
                    borderRadius: HighlightBox.kBoxBorderRadius,
                    borderColor:  HighlightBox.kBoxBorderColor,
                    borderStyle:  HighlightBox.kBoxBorderStyle,
                    borderWidth:  HighlightBox.kBoxBorderWidth,
                    padding:      HighlightBox.kBoxPadding,
                    backgroundColor: isContrastColors ? newBgColor : common.getRevertColor(newBgColor)
                }),
                // Only animate the most important values so that animation is smoother
                cssAnimateStyles = $.extend({}, cssUpdate, {
                    transform: 'scale(' + extraZoom + ')'
                });

               // Remove all the attributes from the placeholder(clone) tag.
               common.removeAttributes(cloneNode);
               // Clean clone from inner <script> before insertion to DOM
                cloneNode.find('script').remove();
               // Temporary shim for <td> which spans the number of columns in a cell.
               // todo: apply better maths for calculating clone width for such cells.
               var colspan = parseInt(this.itemNode.attr('colspan')) || 1;

                // Then, insert placeholder so that content which comes after doesn't move back.
                cloneNode.addClass(HighlightBox.kPlaceHolderClass)
                    .css($.extend({}, currentStyle, {
                        // Make sure clone display turned to 'block' if it is a tbale cell
                        display: (currentStyle.display.indexOf('table') === 0) ? 'block' : currentStyle.display,
                        visibility: 'hidden',
                        width: (parseFloat(origRectSize.width) / colspan) + 'px',
                        height: origRectSize.height + 'px'
                    }));

                // Insert placeholder before HLB target is absoultely positioned.
                // Otherwise, we might loose white space intent to the left/right because
                // in most cases sequences of whitespace will collapse into a single whitespace.
                this.itemNode.after(cloneNode);

                // Quick state issue fix! If the HLB isn't ready slightly after the animation is supposed to end, then
                // reset state.
                var isInflated = false;
                setTimeout(function() {
                    if (!isInflated) {
                        // Bad state. This instance is now officially closed.
                        _this.state = STATES.CLOSED;
                        // Call the module method to clean up after close BEFORE calling listeners.
                        onHighlightBoxClosed();
                        // Ensure the bg dimmer is gone.
                        backgroundDimmer.removeDimmer();
                        // Trigger the background blur effect if there is a highlight box only.
                        console.log("hlb closed");
                        eqnx.emit('hlb/closed', _this.item);
                    }
                }, HighlightBox.kShowBoxSpeed + 100);

                // Animate HLB (keep in mind $.animate() is non-blocking).
                this.itemNode
                    .css(cssBeforeAnimateStyles)
                    .animate(cssAnimateStyles, HighlightBox.kShowBoxSpeed, 'easeOutBack', function() {
                        // Once the animation completes, set the new state and emit the ready event.
                        _this.state = STATES.READY;
                        isInflated = true;
                        console.log("hlb ready");
                        eqnx.emit('hlb/ready', _this.item);
                });

                // Trigger the background blur effect if there is a highlight box only.
                backgroundDimmer.dimBackgroundContent(HighlightBox.kBoxZindex - 1);
                return false;
            };

            /**
             * Hide the reading box.
             */
            HighlightBox.prototype.deflate = function () {
                var _this = this;

                // Update state.
                this.state = STATES.DEFLATING;
                eqnx.emit('hlb/deflating', _this.item);

                // Get the current element styles.
                var currentStyle = this.savedCss[this.savedCss.length - 1],
                    origRectSize = this.origRectDimensions[this.origRectDimensions.length - 1],
                    offsetParent = this.itemNode.offsetParent();

                var clientRect = this.item.getBoundingClientRect();

                var cssAnimateStyles = $.extend({},currentStyle,{
                        position: 'absolute',
                        transform: 'scale(1)',
                        width: clientRect.width
                    });

                // Elements relative to the root don't need extra margins, use original values instead.
                if (offsetParent[0].tagName.toLowerCase() === 'html') {
                    cssAnimateStyles.top = origRectSize.top;
                    cssAnimateStyles.left = 0;
                }

                // Deflate the highlight box.
                this.itemNode.animate(cssAnimateStyles, HighlightBox.kHideBoxSpeed , 'easeOutBack', function () {
                    // Cleanup all elements inserted by Eqnx on the page.
                    if ($('.' + HighlightBox.kPlaceHolderWrapperClass).length > 0) {
                        // Remove placeholder wrapper element if the table child highlighted.
                       $('.' + HighlightBox.kPlaceHolderWrapperClass)
                           .children()
                           .unwrap("<div class='" + HighlightBox.kPlaceHolderWrapperClass + "</div>");
                    }
                    $('.' + HighlightBox.kPlaceHolderClass).remove();
                    backgroundDimmer.removeDimmer();

                    setTimeout(function () {
                        // Animation callback: notify all inputs about zoom out.
                        // We should do this with next tick to allow handlers catch right scale level.
                        notifyZoomInOrOut(_this.itemNode, false);
                    }, 0);

                    var style = _this.savedStyleAttr && _this.savedStyleAttr[_this.savedStyleAttr.length - 1];

                    // Wait till animation is finished, then reset animate styles.
                    _this.itemNode.removeAttr('style');
                    if (typeof style !== 'undefined') {
                        _this.itemNode.attr('style', style);
                    }
                    // This instance is now officially closed.
                    _this.state = STATES.CLOSED;
                    // Call the module method to clean up after close BEFORE calling listeners.
                    onHighlightBoxClosed();
                    console.log("hlb closed");
                    eqnx.emit('hlb/closed', _this.item);
                });

            };

           /*
            * Table elements require extra work for some cases - especially when table has flexible layout.
            */
           function handleTableElement(itemNode, currentStyle) {
               // To reposition 'table'-like(for example,'td') elements, we need to set the td, tr, tbody, and table to display: block;
                var savedDisplay = currentStyle.display;
                if (savedDisplay.indexOf('table') === 0) {
                    itemNode.css({display: 'block'});
                    return false;
                }

                // Handle flexible table width effect dependent of the inner elements.
                itemNode.parents().andSelf().each(function () {
                    if (this.tagName.toLowerCase() === 'table') {
                        // todo: try to set table-layout:fixed to table
                        var closest = itemNode.closest('td');
                        var closestStyle = common.getElementComputedStyles(closest[0]);

                        var updateInnerElStyle = {};
                        updateInnerElStyle.width = parseFloat(closestStyle.width) + 'px';

                        var innerText = $(closest).html();
                        if (innerText.indexOf('&nbsp;') > 0) { // Contains non-breakable space
                            updateInnerElStyle.whiteSpace = 'nowrap';
                        }

                        $(closest).children().wrapAll("<div class='" + HighlightBox.kPlaceHolderWrapperClass + "'></div>");
                        $('.'+HighlightBox.kPlaceHolderWrapperClass).css(updateInnerElStyle);

                        return false; // Break the each loop
                    }
                })
                return false;
            }


            /**
             * Get the size and position of the current HLB to inflate.
             * @param selector What element is being positioned
             * @param center   The center over which selector is positioned
             * @param zoom     Zooming the selector element if needed
             * @return cssUpdates An object containing left, top, width and height of the positioned element.
             */
            // TODO: Fix incorrect checks for viewport boundaries exceeding appearing due to the fact
            // getViewportDimensions() doesn't take into account 'zoom' value(util/positioning supports 'transform' value for its calculation).
            function getNewRectStyle(selector, center, extraZoom, totalZoom) {
                // Ensure a zoom exists.
                var extraZoom = extraZoom || 1;
                // Use the proper center.
                var centerLeft = center.left;
                var centerTop = center.top;

                // Correctly compute the viewport.
                var viewport = positioning.getViewportDimensions(HighlightBox.kMinDistanceFromEdge);
                for (var prop in viewport) {
                    viewport[prop] /= totalZoom;
                }

                var cssUpdates = {};
                $(selector).each(function () {
                    var jElement = $(this);

                    // As we are not moving the element within the DOM, we need to position the
                    // element relative to it's offset parent. These calculations need to factor
                    // in the total zoom of the parent.
                    var offsetParent = jElement.offsetParent();
                    var offsetParentPosition = positioning.getOffset(offsetParent);
                    var offsetParentZoom = positioning.getTotalZoom(offsetParent);

                    // Determine the final dimensions, and their affect on the CSS dimensions.
                    var additionalBoxOffset = (parseFloat(HighlightBox.kBoxBorderWidth) + parseFloat(HighlightBox.kBoxPadding));
                    var width = (jElement.outerWidth(true) + 2 * additionalBoxOffset) * extraZoom;
                    var height = (jElement.outerHeight(true)+ 2 * additionalBoxOffset) * extraZoom;

                    var left = centerLeft - (width / 2);
                    var top = centerTop - (height / 2);

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

                    // Check the height and vertical positioning.
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

                    width = (newWidth || width) / extraZoom;
                    height = (newHeight || height) / extraZoom;
                    // Determine what the left and top CSS values must be to center the
                    // (possibly zoomed) element over the determined center.
                    var css = jElement.css(['marginLeft', 'marginTop']);

                    var cssLeft = (centerLeft
                                   - offsetParentPosition.left
                                   - (width * offsetParentZoom / 2)
                                  ) / offsetParentZoom;
                    var cssTop = (centerTop
                                   - offsetParentPosition.top
                                   - (height * offsetParentZoom / 2)
                                  ) / offsetParentZoom;

                    // If offset parent is html then no need to do this.
                    // todo: do we really use it?
                    if (offsetParent[0].tagName.toLowerCase() !== 'html') {
                        cssLeft -=  (parseFloat(css.marginLeft) * offsetParentZoom);
                        cssTop  -=  (parseFloat(css.marginTop) * offsetParentZoom);
                    }
                    // Create the CSS needed to place the element where it needs to be, and to zoom it.
                    cssUpdates = {
                        left: cssLeft,
                        top: cssTop
                    };

                    // Only update the dimensions if needed.
                    if (newWidth) {
                        cssUpdates.width = width - 2 * additionalBoxOffset * extraZoom;
                    }

                    if (newHeight) {
                        cssUpdates.height = height - 2* additionalBoxOffset * extraZoom;
                    }
                    // If the width is narrowed then inner content is likely to be rearranged in Live time(while animation performs).
                    // In this case we need to make sure result HLB height will not exceed the viewport bottom limit.
                    cssUpdates.maxHeight = viewport.bottom - positioning.getOffset(jElement).top - 2 * additionalBoxOffset;
                });
                return cssUpdates;
            }

            /**
             * Notify all inputs if zoom in or out.
             * todo: define if we need to leave this code after code transferring to a new event model.
             */
            function notifyZoomInOrOut (element, isZoomIn) {
                var zoomHandler = isZoomIn ? 'zoomin' : 'zoomout';
                element.triggerHandler(zoomHandler);
            }

            /**
             * Get the background color of highlight box when it appears.
             */
            function getNewBackgroundColor(itemNode, oldBgColor) {
                // Chrome returns an rgba color of rgba(0, 0, 0, 0) instead of transparent.
                // http://stackoverflow.com/questions/5663963/chrome-background-color-issue-transparent-not-a-valid-value
                // Array of what we'd expect if we didn't have a background color
                var transparentColorNamesSet = [
                    'transparent',
                    'rgba(0, 0, 0, 0)'
                ];
                // Check to see if we have an existing background color
                if (!oldBgColor || $.inArray(oldBgColor, transparentColorNamesSet) >= 0) {
                    // Didn't find an existing background color, so see if a parent has one
                    // TODO: This doesn't take into account background images!
                    // Get the parents of the current node, this lets us know if there
                    // is a parent with a background we should set for the highlight box
                    var parents = itemNode.parents().toArray();
                    // Set a variable for the default background in case we don't find one
                    var bgColor = HighlightBox.kDefaultBgColor;
                    $(parents).each(function () {
                        // Iterate through the parents looking for a background color
                        var thisNodeColor = $(this).css('backgroundColor');
                        // See if the background color is a default or transparent color
                        if ($.inArray(thisNodeColor, transparentColorNamesSet) < 0) {
                            // Found a background color specified in this node, no need to check further up the tree
                            bgColor = thisNodeColor;
                            return false;
                        }
                    });
                    // Return the default background color if we haven't returned a parent's background
                    return bgColor;
                } else {
                    // Return the existing background color that was specified in the item node
                    return oldBgColor;
                }
            }

            /**
             * Check if the target is suitable to be used for highlight reading box.
             * @param target is the current element under mouse cursor.
             * @return isValid true if element is okay
             */
            function isValidTarget(target) {
                var forbiddenTagsToZoom = ['body', 'html'];
                if (!target // HighlightBox creation failed because target is not defined.
                   || forbiddenTagsToZoom.indexOf(target.tagName.toLowerCase()) >= 0) {
                    return false;
                }

                // Do not highlight panel & badge and their incidents
                var isValid = true;
                var forbiddenIDsToZoom = [kPanelId.toLowerCase(), kBadgeId.toLowerCase()];

                $.each($(target).parents().andSelf(), function (index, element) {
                    if ($(element).attr('id') && forbiddenIDsToZoom.indexOf($(element).attr('id').toLowerCase()) >= 0) {
                        isValid = false;
                        return false; // Break the loop.
                    }
                });
                return isValid;
            }

            return {
                // Return Highlight if need to support a few instances instead.
                createInstance: function (target) {
                    // Don't return an instance if the target is ineligible.
                    if (isValidTarget(target)) {
                        return new HighlightBox(target);
                    }
                    return null;
                }
            }
        })();

        var clientX, clientY;
        /**
         * Handle mousemove event.
         */
        $(document).bind('mousemove click', function (e) {
            clientX = e.clientX;
            clientY = e.clientY;

            onTargetChange(e.target);

        });

        /**
         * Handle keypress event.
         */
        var target;
        eqnx.on('highlight/animate', function (e) {
            var currentState = getState();
            // Do nothing if module is off
            if (currentState !== STATES.OFF) {
                if (currentState === STATES.READY) {
                    // An HLB instance exists and is inflated, so deflate it.
                    instance.deflate(function() {
                        // Once the instance is closed, remove the reference.
                        instance = null;
                    });
                } else if (currentState === STATES.ON) {
                    // There is no current HLB and we can create one, so do just that.
                    // If the target element is ineligible, the create request may return null.
                    var target = document.elementFromPoint(clientX, clientY);
                    instance = HighlightBox.createInstance(target);
                    if (instance) {
                        instance.inflate();
                    }
                }
            }

            return false;
        });

        /**
         * Handle zoom event.
         */
        eqnx.on('zoom', function (zoomvalue) {
            updateZoomLevel(zoomvalue);
        });

        eqnx.on( 'key/esc', function ( event ) {
            instance.deflate();
        } );

        // Lower the threshold when speech is enabled.
        eqnx.on('speech/enable', function(){
            conf.set('highlightBoxMinZoom', 1.00);
            updateZoomLevel(conf.get('zoom'));
        });

        // Revert the threshold when speech is enabled.
        eqnx.on('speech/disable', function(){
            conf.set('highlightBoxMinZoom', kMinHighlightZoom);
            updateZoomLevel(conf.get('zoom'));
        });


        // Take care on target change event.
        function onTargetChange(newTarget) {
            if (getState() === STATES.READY) { // if something is ready
                var lastTarget = instance.item;

                if (lastTarget === newTarget) {
                    return; // Target is not changed.
                }
                // Check if new target is a child node of the last target.
                var isChildNode = false;
                $.each($(newTarget).parents(), function (index, element) {
                    // Do nothing if the new target is a child node.
                    if (element === lastTarget) {
                        isChildNode = true;
                    }
                });

                // If mouse hovers over the other element, shut down last target(current HLB).
                if (!isChildNode) {
                    instance.deflate();
                }
            }
        }

        // Now that we have initialized the HLB, update the zoom level, emitting the ON or OFF event.
        updateZoomLevel(conf.get('zoom'));

        // Done.
        callback();
    });
});
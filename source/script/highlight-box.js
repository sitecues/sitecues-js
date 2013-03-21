/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 */
eqnx.def('highlight-box', function (highlightBox, callback) {

    // Get dependencies
    // todo remove unused dependencies
    eqnx.use('jquery', 'conf', 'cursor', 'util', 'keys', 'background-dimmer', function ($, conf, cursor, util, keys, backgroundDimmer) {

        var box = null; // current highlight box, only work with it.
        var kMinCursorZoom = 1.5;
        var kPanelId = 'eqnx-panel';
        var kBadgeId = 'eqnx-badge';
        var zoomLevel = conf.get('zoom');
        var extraZoom = 1.5;
        var isEnabled = zoomLevel >= kMinCursorZoom; // if HLB module is enabled

        // Add easing function for box open animation, to create bounce-back effect
        $.extend($['easing'], {   // From http://stackoverflow.com/questions/5207301
            easeOutBack: function (x, t, b, c, d, s) {
                if (s == undefined) s = 1.70158;
                return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
            }
        });

        var HighlightBox = (function () {

            // Initialize.
            function HighlightBox(target) {
                this.inflated = false;
                this.savedCss = [];
                this.savedStyleAttr = [];
                this.origRect = [];
                this.item = target; // Need to know when we have box for checking mouse events before closing prematurely
                box = this.item;
                this.itemNode = $(this.item);
                var computedStyles = getElementComputedStyles(this.item);
                var offset = util.getOffset(this.item);
                var size = { width: parseInt(computedStyles.width), height: parseInt(computedStyles.height) };
                this.origRect.push($.extend({}, { left: parseInt(offset.left), top: parseInt(offset.top) }, size));
                this.savedCss.push(computedStyles);
                this.savedStyleAttr.push(this.itemNode.attr('style'));
            }

            // Constants
            HighlightBox.kShowBoxSpeed = 200;
            HighlightBox.kHideBoxSpeed = 100;
            HighlightBox.kBoxZindex = cursor.kZindex - 1; // Ensure that cursor is on top, we're above everything else.
            HighlightBox.kMinDistanceFromEdge = 32;
            HighlightBox.kBoxBorderWidth = '1px';
            HighlightBox.kBoxPadding = '2px'; // Give the text a little extra room
            HighlightBox.kBoxBorderRadius = '4px';
            HighlightBox.kBoxBorderStyle = 'solid';
            HighlightBox.kBoxBorderColor = '#222222';
            HighlightBox.kDefaultBgColor = '#ffffff';
            // Space placeholders prevent content after box from going underneath it.
            HighlightBox.kPlaceHolderClass = 'eq360-box-placeholder';
            // TODO: Expand this array to include all appropriate elements.
            HighlightBox.kDimensionAdjustableElements = { p: true, span: true, td: true };

            /**
             * Get highlight box isInflated state.
             */
            HighlightBox.prototype.getIsInflated = function () {
                return this.inflated;
            }

            /**
             * Show a highlight reading box when triggered.
             */
            HighlightBox.prototype.inflate = function (extraZoom) {
                var clone = this.item.cloneNode(false),
                    cloneNode = $(clone),
                    // todo make up something better than keeping two similar vars
                    currentStyle = this.savedCss[this.savedCss.length - 1],
                    origRect = this.origRect[this.origRect.length - 1];

                var cssUpdate = getNewRectStyle(this.itemNode, util.getCenter(this.item), 2);

                var cssBeforeAnimateStyles = $.extend({}, {
                    position: 'absolute',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    width: origRect.width,
                    zIndex: HighlightBox.kBoxZindex.toString(),
                    border: '0px solid white'
                }),
                // todo: check why this is not properly applied, maybe the other library version?
                cssAnimateStyles = $.extend({}, cssUpdate, {
                    transform: 'scale(' + extraZoom + ')',
                    margin: '0',
                    borderRadius: HighlightBox.kBoxBorderRadius,
                    borderColor: HighlightBox.kBoxBorderColor,
                    borderStyle: HighlightBox.kBoxBorderStyle,
                    borderWidth: HighlightBox.kBoxBorderWidth,
                    padding: HighlightBox.kBoxPadding,
                    backgroundColor: getNewBackgroundColor(this.itemNode, currentStyle.backgroundColor)
                });

                var savedDisplay = currentStyle.display;
                var correctedDisplay = getCorrectedDisplay(this.itemNode, savedDisplay);
                var resultDisplay = correctedDisplay === undefined ? savedDisplay : correctedDisplay;

                this.itemNode.css(cssBeforeAnimateStyles)
                    .animate(cssAnimateStyles, HighlightBox.kShowBoxSpeed, 'easeOutBack');

                // First, remove all the attributes from the tag.
                removeAttributes(cloneNode);
                // Then, insert placeholder so that content which comes after doesn't move back.
                var dimensionCoefficient = 0.025 * extraZoom;

                cloneNode.addClass(HighlightBox.kPlaceHolderClass)
                         .css($.extend({},  currentStyle, {
                             display: resultDisplay,
                             visibility: 'hidden',
                             width: origRect.width - dimensionCoefficient + 'px',
                             height: origRect.height + 'px'
                         }));
                this.itemNode.after(clone);

                // Trigger the background blur effect if there is a highlight box only.
                backgroundDimmer.dimBackgroundContent(HighlightBox.kBoxZindex - 1);
                this.inflated = true;
                return false;
            }

            /**
             * Hide the reading box.
             */
            HighlightBox.prototype.deflate = function () {
                var _this = this;
                var currentStyle = this.savedCss[this.savedCss.length - 1],
                    origRect = this.origRect[this.origRect.length - 1];
                var cssAnimateStyles = $.extend({}, currentStyle);
                cssAnimateStyles.transform = 'scale(1)';
                this.itemNode.animate(cssAnimateStyles, HighlightBox.kHideBoxSpeed, 'easeOutBack', function () {
                    setTimeout(function () {
                        // Animation callback: notify all inputs about zoom out.
                        // We should do this with next tick to allow handlers catch right scale level.
                        notifyZoomInOrOut(_this.itemNode, false);
                    }, 0);
                });

                // Do cleanup job when reading box is being closed: remove placeholder to prevent animated block from jumping.
                var style = this.savedStyleAttr && this.savedStyleAttr[this.savedStyleAttr.length - 1];
                setTimeout(function () {
                    $('.' + HighlightBox.kPlaceHolderClass).remove();
                    backgroundDimmer.removeDimmer();
                    // Wait till animation is finished, then reset animate styles.
                    _this.itemNode.removeAttr('style');
                    if (typeof style !== 'undefined') {
                        _this.itemNode.attr('style', style);
                    }
                }, HighlightBox.kHideBoxSpeed);
                this.inflated = false;
                box = null;
            };

            
            /**
             * Get the style and position of the HLB.
             */
            function getNewRectStyle(selector, center, zoom) {
                // The viewport inset from the window edges.
                window._vpi = 50;
                // Ensure a zoom exists.
                zoom = zoom || 1;
                // Use the proper center.
                center = {
                    left: (center.centerX || center.left),
                    top: (center.centerY || center.top)
                };
                var cssUpdates = {};
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
                    cssUpdates = {
                        left: cssLeft,
                        top: cssTop
                    };

                    // Only update the dimensions if needed.
                    cssUpdates.width = newWidth ? width : cssUpdates.width;
                    cssUpdates.height = newHeight ? height : cssUpdates.height;

                });
                return cssUpdates;
            }

            /**
             * Get the element's styles to be used further.
             */
            function getElementComputedStyles(element) {
                var currentProperty, propertyName, propertyParts = [], elementComputedStyles = [];
                var computedStyles = element.currentStyle || window.getComputedStyle(element, '');
                $.each(computedStyles, function (index) {
                    currentProperty = computedStyles[index]; // in format 'margin-top'
                    propertyParts = currentProperty.split('-');
                    propertyName = propertyParts[0];
                    for (var i = 1; i < propertyParts.length; i++) {
                        propertyName += capitaliseFirstLetter(propertyParts[i]); // in format 'marginTop'
                    }
                    elementComputedStyles[propertyName] = computedStyles[propertyName];
                });
                return elementComputedStyles;
            };

            /**
             * Notify all inputs if zoom in or out.
             */
            function notifyZoomInOrOut (element, isZoomIn) {
                var zoomHandler = isZoomIn ? 'zoomin' : 'zoomout';
                element.find('input[type=text]').triggerHandler(zoomHandler);
            };

            /**
             * We need to correct the display property for certain values.
             */
            function getCorrectedDisplay(itemNode, savedDisplay) {
                if (typeof savedDisplay === 'undefined') {
                    return undefined;
                }
                var correctedDisplay;
                // To reposition 'table'-like(for example,'td') elements, we need to set the td, tr, tbody, and table to display: block;
                if (savedDisplay.indexOf('table') === 0) {
                    itemNode.css({
                        display: 'block'
                    });
                    correctedDisplay = 'block';
                }
                // We can set the width of inline elements like <span>, <em> and <strong>,
                // but we won't notice any effect until position them. Rather than that, we explicitly change display to 'inline-block'.
                if (savedDisplay === 'inline') {
                    correctedDisplay = 'inline-block';
                }
                return correctedDisplay;
            };

            /**
             * Capitalizes the first letter of the string given as an argument.
             */
            function capitaliseFirstLetter(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            };

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
            };

            /**
             * Get the element's styles to be used further.
             */
            function removeAttributes(element) {
                element.each(function () {
                    // Copy the attributes to remove:
                    // if we don't do this it causes problems iterating over the array we're removing elements from.
                    var attributes = $.map(this.attributes, function (item) {
                        return item.name;
                    });
                    // Now use jQuery to remove the attributes.
                    $.each(attributes, function (i, item) {
                        element.removeAttr(item);
                    });
                });
            };

            function isValidTarget(target) {
                if (!target // HighlightBox creation failed because target is not defined.
                   || target.tagName.toLowerCase() === 'body') {// Do not highlight body
                    return false;
                }

                // Do not highlight panel & badge
                if (target.id.toLowerCase() === kPanelId
                    || target.id.toLowerCase() === kBadgeId) {
                    return false;
                }
                // Do not highlight panel's incidents
                var isValid = true;
                $.each($(target).parents(), function (index, element) {
                    if (element.id.toLowerCase() === kPanelId) {
                        isValid = false;
                        return false;
                    }
                })
                return isValid;
            }

            return {
                // Keep only one instance of highlight box at a time.
                // Return Highlight if need to support a few instances instead.
                getInstance: function (target) {
                    // don't return an object if HLB is disabled

                    if (!box) {
                        if (!isValidTarget(target)) return;
                        box = new HighlightBox(target);
                    }
                    return box;
                }
            }

        })();

        var clientX, clientY;
        $(document).bind('mousemove click', function (e) {
            clientX = e.clientX;
            clientY = e.clientY;
        });

        /**
         * Handle keypress event.
         */
        eqnx.on('highlight/animate', function (e) {
            var target = document.elementFromPoint(clientX, clientY);
            var box = HighlightBox.getInstance(target);
            if (!box) return;

            if (!isEnabled) {
                //return; // Do nothing if module is disabled
            }
            if (box.getIsInflated()) {
                box.deflate();
            } else {
                box.inflate(extraZoom);
            }

            return false;
        });

        /**
         * Handle zoom event.
         */
        eqnx.on('zoom', function (zoomvalue) {
            zoomLevel = zoomvalue;
            isEnabled = zoomLevel >= kMinCursorZoom
        });

        // Done.
        callback();

    });
});
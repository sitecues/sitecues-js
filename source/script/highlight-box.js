/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 */
eqnx.def('highlight-box', function (highlightBox, callback) {

    // Get dependencies
    eqnx.use('jquery', 'conf', 'cursor', 'util', 'background-dimmer', 'ui', 'jquery/transform2d', 'jquery/color', function ($, conf, cursor, util, backgroundDimmer) {

        var box = null; // Current highlight box instance, only work with it.
        var kMinHighlightZoom = 1.5;
        var extraZoom = 1.5;

        var kPanelId = 'eqnx-panel';
        var kBadgeId = 'eqnx-badge';
        var zoomLevel = conf.get('zoom');

        var isEnabled = zoomLevel >= kMinHighlightZoom; // if HLB module is enabled

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
                this.origRectDimensions = [];
                this.item = target; // Need to know when we have box for checking mouse events before closing prematurely
                box = this.item;
                this.itemNode = $(this.item);

                // notify about new hlb
                eqnx.emit('hlb/create', this.item);

                var computedStyles = getElementComputedStyles(this.item);
                var offset = util.getOffset(this.item);
                var width = (computedStyles.width === 'auto' || computedStyles.width === '') ? this.itemNode.width() : computedStyles.width;
                var height = (computedStyles.height === 'auto' || computedStyles.height === '') ? this.itemNode.height() : computedStyles.height;
                var size = { width: parseFloat(width), height: parseFloat(height) };

                this.origRectDimensions.push($.extend(offset, size)); // Only numeric values, useful for calculations
                this.savedCss.push(computedStyles);
                this.savedStyleAttr.push(this.itemNode.attr('style'));
            }

            // Constants
            HighlightBox.kShowBoxSpeed = 200;
            HighlightBox.kHideBoxSpeed = 100;
            HighlightBox.kBoxZindex = cursor.kZindex - 1; // Ensure that cursor is on top, we're above everything else.
            HighlightBox.kMinDistanceFromEdge = 32;       // The viewport inset from the window edges.
            HighlightBox.kBoxBorderWidth = '1px';
            HighlightBox.kBoxPadding = '2px'; // Give the text a little extra room
            HighlightBox.kBoxBorderRadius = '4px';
            HighlightBox.kBoxBorderStyle = 'solid';
            HighlightBox.kBoxBorderColor = '#222222';
            HighlightBox.kDefaultBgColor = '#ffffff';
            // Space placeholders prevent content after box from going underneath it.
            HighlightBox.kPlaceHolderClass = 'eq360-box-placeholder';
            // TODO: Expand this array to include all appropriate elements.
            // HighlightBox.kDimensionAdjustableElements = { p: true, span: true, td: true };

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
                // Prepare clone element as a clone of the scaled highlight box element.
                var clone = this.item.cloneNode(false),
                    cloneNode = $(clone),
                    // Get the current element styles.
                    currentStyle = this.savedCss[this.savedCss.length - 1],
                    origRectSize = this.origRectDimensions[this.origRectDimensions.length - 1];

                var center    = util.getCenter(this.item);
                var totalZoom = util.getTotalZoom(this.item, true);
                var cssUpdate = getNewRectStyle(this.itemNode, center, extraZoom, totalZoom);

                var cssBeforeAnimateStyles = $.extend({}, {top: cssUpdate.top, left: cssUpdate.left}, {
                    transformOrigin: '50% 50%',
                    position: 'absolute',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    width: origRectSize.width,
                    height: 'auto',
                    zIndex: HighlightBox.kBoxZindex.toString(),
                    border: '0px solid white'
                }),
                cssAnimateStyles = $.extend({}, cssUpdate, {
                    transform: 'scale(' + extraZoom + ')',
                    margin: '0',
                    borderRadius: HighlightBox.kBoxBorderRadius,
                    borderColor:  HighlightBox.kBoxBorderColor,
                    borderStyle:  HighlightBox.kBoxBorderStyle,
                    borderWidth:  HighlightBox.kBoxBorderWidth,
                    padding:      HighlightBox.kBoxPadding,
                    backgroundColor: getNewBackgroundColor(this.itemNode, currentStyle.backgroundColor)
                });

                var savedDisplay = currentStyle.display;
                var correctedDisplay = getCorrectedDisplay(this.itemNode, savedDisplay);
                var resultDisplay = correctedDisplay === undefined ? savedDisplay : correctedDisplay;

                // Animate HLB.
                this.itemNode.css(cssBeforeAnimateStyles).animate(cssAnimateStyles, HighlightBox.kShowBoxSpeed, 'easeOutBack');

                // Remove all the attributes from the placeholder(clone) tag.
                removeAttributes(cloneNode);
                // Then, insert placeholder so that content which comes after doesn't move back.
                cloneNode.addClass(HighlightBox.kPlaceHolderClass)
                         .css($.extend({},  currentStyle, {
                             display: resultDisplay,
                             visibility: 'hidden',
                             width: origRectSize.width + 'px',
                             // Don't set height for inline-block elements(images are exceptions)
                             // since it is calculated automatically with respect to line-height and other factors.
                             height: resultDisplay === 'inline-block' && clone.tagName.toLowerCase() !== 'img' ? 'auto' : origRectSize.height + 'px'
                         }));
                this.itemNode.after(clone);

                // Trigger the background blur effect if there is a highlight box only.
                backgroundDimmer.dimBackgroundContent(HighlightBox.kBoxZindex - 1);
                
                this.inflated = true;
                console.log("hlb ready");
                eqnx.emit('hlb/ready', this.item);
                return false;
            }

            /**
             * Hide the reading box.
             */
            HighlightBox.prototype.deflate = function () {
                var _this = this;
                // Get the current element styles.
                var currentStyle = this.savedCss[this.savedCss.length - 1],
                    origRectSize = this.origRectDimensions[this.origRectDimensions.length - 1],
                    offsetParent = this.itemNode.offsetParent();

                var cssAnimateStyles = $.extend({}, currentStyle, { position: 'absolute', transform: 'scale(1)' });

                // Elements relative to the root don't need extra margins, use original values instead.
                if (offsetParent[0].tagName.toLowerCase() === 'html') {
                    cssAnimateStyles.top = origRectSize.top;
                    cssAnimateStyles.left = 0;
                }

                // Deflate the highlight box.
                this.itemNode.animate(cssAnimateStyles, HighlightBox.kHideBoxSpeed , 'easeOutBack', function () {
                    setTimeout(function () {
                        // Animation callback: notify all inputs about zoom out.
                        // We should do this with next tick to allow handlers catch right scale level.
                        notifyZoomInOrOut(_this.itemNode, false);
                        
                    }, 0);

                    // Do cleanup job when reading box is being closed: remove placeholder to prevent animated block from jumping.
                    var style = this.savedStyleAttr && this.savedStyleAttr[this.savedStyleAttr.length - 1];                    $('.' + HighlightBox.kPlaceHolderClass).remove();

                    backgroundDimmer.removeDimmer();
                    // Wait till animation is finished, then reset animate styles.
                    _this.itemNode.removeAttr('style');
                    if (typeof style !== 'undefined') {
                        _this.itemNode.attr('style', style);
                    }

                    eqnx.emit('hlb/closed', _this.item);
                });

                this.inflated = false;
                box = null;
            };

            /**
             * Get the size and position of the current HLB to inflate.
             * @param selector What element is being positioned
             * @param center   The center over which selector is positioned
             * @param zoom     Zooming the selector element if needed
             * @return cssUpdates An object containing left, top, width and height of the positioned element.
             */
            // TODO: Fix incorrect checks for viewport boundaries exceeding appearing due to the fact
            // TODO: do not pass viewport. Instead, calculate it in-place.
            // getViewportDimensions() doesn't take into account 'zoom' value(util supports 'transform' value for its calculation).
            function getNewRectStyle(selector, center, extraZoom, totalZoom) {
                // Ensure a zoom exists.
                var extraZoom = extraZoom || 1;
                // Use the proper center.
                var centerLeft = center.left;
                var centerTop = center.top;

                // Correctly compute the viewport.
                var viewport = util.getViewportDimensions(HighlightBox.kMinDistanceFromEdge);
                for (prop in viewport) {
                    viewport[prop] /= totalZoom;
                }

                var cssUpdates = {};
                $(selector).each(function () {
                    var jElement = $(this);

                    // As we are not moving the element within the DOM, we need to position the
                    // element relative to it's offset parent. These calculations need to factor
                    // in the total zoom of the parent.
                    var offsetParent = jElement.offsetParent();
                    var offsetParentPosition = util.getOffset(offsetParent);
                    var offsetParentZoom = util.getTotalZoom(offsetParent);

                    var elementTotalZoom = totalZoom * extraZoom;

                    // Determine the final dimensions, and their affect on the CSS dimensions.
                    var width = jElement.outerWidth() * elementTotalZoom;
                    var height = jElement.outerHeight() * elementTotalZoom;

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
                    var additionalBoxOffset = (parseFloat(HighlightBox.kBoxBorderWidth) + parseFloat(HighlightBox.kBoxPadding));
                    width = ((newWidth || width) - additionalBoxOffset * elementTotalZoom) / extraZoom;
                    height = ((newHeight || height) - additionalBoxOffset * elementTotalZoom) / extraZoom;

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
                        cssUpdates.width = width;
                    }

                    if (newHeight) {
                        cssUpdates.height = height;
                    }

                });
                return cssUpdates;
            }

            /**
             * Get the element's styles to be used further.
             * @param element The DOM element which styles we want to get.
             * @return elementComputedStyles An object of all element computed styles.
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
             * todo: define if we need to leave this code after code transferring to a new event model.
             */
            function notifyZoomInOrOut (element, isZoomIn) {
                var zoomHandler = isZoomIn ? 'zoomin' : 'zoomout';
                element.find('input[type=text]').triggerHandler(zoomHandler);
            };

            /**
             * We need to correct the display property for certain values such as 'inline' or 'table'.
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
             * Remove all the attributes from the DOM element given.
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

            /**
             * Check if the target is suitable to be used for highlight reading box.
             * @param target is the current element under mouse cursor.
             * @return isValid true if element is okay
             */
            function isValidTarget(target) {
                if (!target // HighlightBox creation failed because target is not defined.
                   || target.tagName.toLowerCase() === 'body') {// Do not highlight body
                    return false;
                }

                // Do not highlight panel & badge and their incidents
                var isValid = true;
                $.each($(target).parents().andSelf(), function (index, element) {
                    if (element.id.toLowerCase() === kPanelId || element.id.toLowerCase() === kBadgeId) {
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
                    if (!box) {
                        // Don't return an object if HLB is disabled
                        if (!isValidTarget(target)) return;
                        box = new HighlightBox(target);
                    }
                    return box;
                }
            }

        })();

        var clientX, clientY;
        /**
         * Handle nousemove event.
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
            target = document.elementFromPoint(clientX, clientY);
            var box = HighlightBox.getInstance(target);
            if (!box) return;

            if (!isEnabled) {
               //return; // Do nothing if module is disabled
            }
            if (box.getIsInflated()) {
                box.deflate(extraZoom);
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
            isEnabled = zoomLevel >= kMinHighlightZoom
        });

        // Take care on target change event.
        function onTargetChange(newTarget) {
            var box = HighlightBox.getInstance();
            if (box) { // if something is inflated
                var lastTarget = box.item;

                if (lastTarget === newTarget) {
                    return; // Target is not changed.
                }
                // Check if new target is a child node of the last target.
                var isChildNode = false;
                $.each($(newTarget).parents(), function (index, element) {
                    if (element === lastTarget) {
                        isChildNode = true;
                        return; // Do nothing if the new target is a child node.
                    }
                })

                // If mouse hovers over the other element, shut down last target(current HLB).
                if (!isChildNode) {
                    box.deflate(extraZoom);
                }
            }
        }

        // Done.
        callback();

    });
});
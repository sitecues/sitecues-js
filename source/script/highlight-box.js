/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 * todo: is there module state 'isEnabled'?
 */
eqnx.def('highlight-box', function (highlightBox, callback) {

    // Get dependencies
    eqnx.use('jquery', 'conf', 'util', 'cursor', 'geo', 'keys', 'ui', function ($, conf, util, cursor, geo, keys) {

       var box = null; // current highlight box, only work with it.

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
                this.origRect.push(geo.getOffsetRect(this.item));
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
                console.log('Inflate');

                var clone = this.item.cloneNode(false),
                    cloneNode = $(clone),
                    // todo make up something better than keeping two similar vars
                    currentStyle = this.savedCss[this.savedCss.length - 1],
                    origRect = this.origRect[this.origRect.length - 1],
                    oldRectStyles = geo.getOffsetRect(this.item),
                    newRectStyles = getNewRectStyle(this.item, origRect, extraZoom);
                var cssBeforeAnimateStyles = $.extend(oldRectStyles, {
                    position: 'absolute',
                    overflow: 'auto',
                    //height: 'auto',
                    //minHeight: newRectStyles.minHeight,
                    //maxHeight: newRectStyles.maxHeight,
                    //width: newRectStyles.width,
                    zIndex: HighlightBox.kBoxZindex.toString(),
                    transformOrigin: '0 0',
                    border: '0px solid white',
                    backgroundColor: getNewBackgroundColor(this.itemNode, currentStyle.backgroundColor)
                }),
                // todo: check why this is not properly applied, maybe the other library version?
                cssAnimateStyles = $.extend(newRectStyles, {
                    transform: 'scale(' + extraZoom + ')',
                    margin: '0',
                    borderRadius: HighlightBox.kBoxBorderRadius,
                    borderColor: HighlightBox.kBoxBorderColor,
                    borderStyle: HighlightBox.kBoxBorderStyle,
                    borderWidth: HighlightBox.kBoxBorderWidth,
                    padding: HighlightBox.kBoxPadding
                });

                var savedDisplay = currentStyle.display;
                var correctedDisplay = getCorrectedDisplay(this.itemNode, savedDisplay);
                var resultDisplay = correctedDisplay === undefined ? savedDisplay : correctedDisplay;

                // todo: use appropriate easing type
                this.itemNode.css(cssBeforeAnimateStyles);
                this.itemNode.animate(cssAnimateStyles, HighlightBox.kShowBoxSpeed);

                //console.log('Adding placeholder with these coords: ' + JSON.stringify(origRect));

                // First, remove all the attributes from the tag.
                removeAttributes(cloneNode);
                // Then, insert placeholder so that content which comes after doesn't move back.
                var dimensionCoefficient = 0.025 * extraZoom;
                var width = currentStyle.width === 'auto' ? origRect.width : Math.min(parseFloat(currentStyle.width), origRect.width);
                var height = currentStyle.height === 'auto' ? 0 : Math.max(parseFloat(currentStyle.height), origRect.height);

                cloneNode.addClass(HighlightBox.kPlaceHolderClass)
                         .css($.extend({},  currentStyle, {
                             display: resultDisplay,
                             visibility: 'hidden',
                             width: width - dimensionCoefficient + 'px',
                             height: height + 'px'
                         }));
                this.itemNode.after(clone);
                
                // todo: Trigger the background blur effect if there is a highlight box only.
                this.inflated = true;
            }

            /**
             * Hide the reading box.
             */
            HighlightBox.prototype.deflate = function () {
                console.log('Deflate');
                var _this = this;
                var currentStyle = this.savedCss[this.savedCss.length - 1],
                    origRect = this.origRect[this.origRect.length - 1];
                var cssAnimateStyles = {
                    transform: 'scale(1)',
                    width: parseFloat(currentStyle.width),
                    height: parseFloat(currentStyle.height),
                    top: origRect.top,
                    left: origRect.left
                };
                this.itemNode.animate(cssAnimateStyles, HighlightBox.kHideBoxSpeed, 'swing', function () {
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
                    // Wait till animation is finished, then reset animate styles.
                    _this.itemNode.removeAttr('style');
                    if (typeof style !== 'undefined') {
                        _this.itemNode.attr('style', style);
                    }
                }, HighlightBox.kHideBoxSpeed);
                this.inflated = false;
                box = null;
            };

            function getNewRectStyle(element, oldRect, additionalZoom) {
                var _window = window;
                var currentZoom = conf.get('zoom');
                var dimensionCoefficient = 1 + (0.025 * additionalZoom);
                var newWidth = oldRect.width * additionalZoom * dimensionCoefficient;
                var newHeight = oldRect.height * additionalZoom * dimensionCoefficient;
                var newLeft = oldRect.left - ((newWidth - oldRect.width) / 2);
                var newTop = oldRect.top - ((newHeight - oldRect.height) / 2);
                var viewLeft = (_window.scrollX + HighlightBox.kMinDistanceFromEdge) / currentZoom;
                var viewTop = (_window.scrollY + HighlightBox.kMinDistanceFromEdge) / currentZoom;
                var viewWidth = (window.innerWidth - (HighlightBox.kMinDistanceFromEdge * 2)) / currentZoom;
                var viewHeight = (window.innerHeight - (HighlightBox.kMinDistanceFromEdge * 2)) / currentZoom;
                var preAdjustedWidth = newWidth;
                newWidth = Math.min(newWidth, viewWidth);
                if (HighlightBox.kDimensionAdjustableElements[element.tagName.toLowerCase()] && (preAdjustedWidth != newWidth)) {
                    newHeight = (newHeight * preAdjustedWidth) / newWidth;
                }
                var heightCoefficient = 1 + (0.025 * additionalZoom);
                newHeight = Math.min(newHeight * heightCoefficient, viewHeight);
                if (newLeft < viewLeft) {
                    newLeft = viewLeft;
                } else if ((newLeft + newWidth) > (viewLeft + viewWidth)) {
                    newLeft = viewLeft + (viewWidth - newWidth);
                }
                if (newTop < viewTop) {
                    newTop = viewTop;
                } else if ((newTop + newHeight) > (viewTop + viewHeight)) {
                    newTop = viewTop + (viewHeight - newHeight);
                }
                return {
                    left: newLeft,
                    top: newTop,
                    width: newWidth / additionalZoom,
                    height: newHeight / additionalZoom
                };
            };

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
                        if ($.inArray(thisNodeColor, transparentColorNamesSet) < 1) {
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

            return {
                // Keep only one instance of highlight box at a time.
                // Return Highlight if need to support a few instances instead.
                getInstance: function (target) {
                    if (!box) {
                        if (!target) return; // HighlightBox creation failed because target is not defined.
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
            console.log('x: ' + cursor.clientX + ' y: ' + cursor.clientY);
            var target = document.elementFromPoint(clientX, clientY);
            var box = HighlightBox.getInstance(target);

            if (box.getIsInflated()) {
                box.deflate();
            } else {
                box.inflate(conf.get('zoom') + 2);
            }

            return false;
        });

        // Done.
        callback();

    });
});
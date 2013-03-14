/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 * todo: rename 'highlight' to 'highlightbox'
 */
eqnx.def('highlight', function (highlight, callback) {

    // Get dependencies
    eqnx.use('jquery', 'conf', 'util', 'cursor', 'geo', 'keys', 'ui', function ($, conf, util, cursor, geo, keys) {

        var box = null; // current highlight box

        var Highlight = (function () {

            // Initialize.
            function Highlight(target) {
                this.inflated = false;
                this.savedCss = [];
                this.savedStyleAttr = [];
                this.origRect = [];
                this.item = target; // Need to know when we have box for checking mouse events before closing prematurely
                this.itemNode = $(this.item);
                var computedStyles = getElementComputedStyles(this.item);
                this.origRect.push(geo.getOffsetRect(this.item));
                this.savedCss.push(computedStyles);
                this.savedStyleAttr.push(this.itemNode.attr('style'));
            }

            // Constants
            Highlight.kShowBoxSpeed = 200;
            Highlight.kHideBoxSpeed = 100;
            Highlight.kBoxZindex = cursor.kZindex - 1; // Ensure that cursor is on top, we're above everything else.
            Highlight.kMinDistanceFromEdge = 32;
            Highlight.kBoxBorderWidth = '1px';
            Highlight.kBoxPadding = '2px'; // Give the text a little extra room
            Highlight.kBoxBorderRadius = '4px';
            Highlight.kBoxBorderStyle = 'solid';
            Highlight.kBoxBorderColor = '#222222';
            Highlight.kDefaultBgColor = '#ffffff';
            // Space placeholders prevent content after box from going underneath it.
            Highlight.kPlaceHolderClass = 'eq360-box-placeholder';
            // TODO: Expand this array to include all appropriate elements.
            Highlight.kDimensionAdjustableElements = { p: true, span: true, td: true };

            /**
             * Get highlight box isInflated state.
             */
            Highlight.prototype.getIsInflated = function () {
                return this.inflated;
            }

            /**
             * Show a highlight reading box when triggered.
             */
            Highlight.prototype.inflate = function (extraZoom) {
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
                    height: 'auto',
                    minHeight: newRectStyles.minHeight,
                    maxHeight: newRectStyles.maxHeight,
                    width: newRectStyles.width,
                    zIndex: Highlight.kBoxZindex.toString(),
                    transformOrigin: '0 0',
                    border: '0px solid white'
                }),
                cssAnimateStyles = $.extend(newRectStyles, {
                    transform: 'scale(' + extraZoom + ')',
                    margin: '0',
                    borderRadius: Highlight.kBoxBorderRadius,
                    borderColor: Highlight.kBoxBorderColor,
                    borderStyle: Highlight.kBoxBorderStyle,
                    borderWidth: Highlight.kBoxBorderWidth,
                    backgroundColor: getNewBackgroundColor(currentStyle.backgroundColor),
                    padding: Highlight.kBoxPadding
                });

                var savedDisplay = currentStyle.display;
                var correctedDisplay = getCorrectedDisplay(savedDisplay);
                var resultDisplay = correctedDisplay === undefined ? savedDisplay : correctedDisplay;

                // todo: use appropriate easing type
                this.itemNode.css(cssBeforeAnimateStyles)
                              .animate(cssAnimateStyles, Highlight.kShowBoxSpeed, 'swing');
                //console.log('Adding placeholder with these coords: ' + JSON.stringify(origRect));

                // Notify all inputs about zoom in.
                notifyZoomInOrOut(this.itemNode, true);

                // First, remove all the attributes from the tag.
                removeAttributes(cloneNode);
                // Then, insert placeholder so that content which comes after doesn't move back.
                var dimensionCoefficient = 0.025 * extraZoom;
                var width = currentStyle.width === 'auto' ? origRect.width : Math.min(parseFloat(currentStyle.width), origRect.width);
                var height = currentStyle.height === 'auto' ? 0 : Math.max(parseFloat(currentStyle.height), origRect.height);

                cloneNode.addClass(Highlight.kPlaceHolderClass)
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
            Highlight.prototype.deflate = function () {
                console.log('Deflate');
                var _this = this;
                var currentStyle = this.savedCss[this.savedCss.length - 1],
                    origRect = this.origRect[this.origRect.length - 1];
                    var cssAnimateStyles = {
                        transform: 'scale(1)',
                        width:  parseFloat(currentStyle.width),
                        height: parseFloat(currentStyle.height),
                        top:  origRect.top,
                        left: origRect.left
                    };
                    this.itemNode.animate(cssAnimateStyles, Highlight.kHideBoxSpeed, 'swing', function () {
                        setTimeout(function () {
                            // Animation callback: notify all inputs about zoom out.
                            // We should do this with next tick to allow handlers catch right scale level.
                            notifyZoomInOrOut(_this.itemNode, false);
                        }, 0);
                    });
                    // onDeflated();

                this.inflated = false;
            };

            /**
             * Do cleanup job when reading box is being closed: remove placeholder to prevent animated block from jumping.
             */
            function onDeflated(index) {
                var _this = this;
                var style = this.savedStyleAttr[index];
                setTimeout(function () {
                    $('.' + HighlightBox.kPlaceHolderClass).remove();
                    BackgroundDimmer.removeDimmer();
                    _this.itemNode.removeAttr('style');
                    if (typeof style !== 'undefined') {
                        _this.itemNode.attr('style', style);
                    }
                }, HighlightBox.kHideBoxSpeed);
            };

            function getElementComputedStyles(element) {
                var currentProperty, propertyName, propertyParts = [], elementComputedStyles = [];
                var computedStyles = element.currentStyle || window.getComputedStyle(element, '');
                $.each(computedStyles, function (index) {
                    currentProperty = computedStyles[index];
                    propertyParts = currentProperty.split('-');
                    propertyName = propertyParts[0];
                    for (var i = 1; i < propertyParts.length; i++) {
                        propertyName += capitaliseFirstLetter(propertyParts[i]);
                    }
                    elementComputedStyles[propertyName] = computedStyles[propertyName];
                });
                return elementComputedStyles;
            };

            function getNewRectStyle(element, oldRect, additionalZoom) {
                var _window = window;
                var currentZoom = conf.get('zoom');
                var dimensionCoefficient = 1 + (0.025 * additionalZoom);
                var newWidth = oldRect.width * additionalZoom * dimensionCoefficient;
                var newHeight = oldRect.height * additionalZoom * dimensionCoefficient;
                var newLeft = oldRect.left - ((newWidth - oldRect.width) / 2);
                var newTop = oldRect.top - ((newHeight - oldRect.height) / 2);
                var viewLeft = (_window.scrollX + Highlight.kMinDistanceFromEdge) / currentZoom;
                var viewTop = (_window.scrollY + Highlight.kMinDistanceFromEdge) / currentZoom;
                var viewWidth = (window.innerWidth - (Highlight.kMinDistanceFromEdge * 2)) / currentZoom;
                var viewHeight = (window.innerHeight - (Highlight.kMinDistanceFromEdge * 2)) / currentZoom;
                var preAdjustedWidth = newWidth;
                    newWidth = Math.min(newWidth, viewWidth);
                if (Highlight.kDimensionAdjustableElements[element.tagName.toLowerCase()] && (preAdjustedWidth != newWidth)) {
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
             * Notify all inputs if zoom in or out.
             */
            function notifyZoomInOrOut (element, isZoomIn) {
                var zoomHandler = isZoomIn ? 'zoomin' : 'zoomout';
                element.find('input[type=text]').triggerHandler(zoomHandler);
            };

            /**
             * We need to correct the display property for certain values.
             */
            function getCorrectedDisplay(savedDisplay) {
                if (typeof savedDisplay === 'undefined') {
                    return undefined;
                }
                var correctedDisplay;
                if (savedDisplay.indexOf('table') === 0) {
                    this.itemNode.css({
                        display: 'block'
                    });
                    correctedDisplay = 'block';
                }
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
            function getNewBackgroundColor(oldBgColor) {
                var transparentColorNamesSet = [
                    'transparent',
                    'rgba(0, 0, 0, 0)'
                ];
                if (!oldBgColor || $.inArray(oldBgColor, transparentColorNamesSet) >= 0) {
                    var parents = $(this.item).parents().toArray();
                    var bgColor = Highlight.kDefaultBgColor;
                    $(parents).each(function () {
                        var thisNodeColor = $(this).css('backgroundColor');
                        if ($.inArray(thisNodeColor, transparentColorNamesSet) < 1) {
                            bgColor = thisNodeColor;
                            return false;
                        }
                    });
                    return bgColor;
                } else {
                    return oldBgColor;
                }
            };

            /**
             * Get the element's styles to be used further.
             */
            function removeAttributes(element) {
                element.each(function () {
                    var attributes = $.map(this.attributes, function (item) {
                        return item.name;
                    });
                    $.each(attributes, function (i, item) {
                        element.removeAttr(item);
                    });
                });
            };

           return Highlight;
        })();

        /**
         * Handle keypress event.
         */
        eqnx.on('highlight/animate', function (e) {
            // Generally, consider two cases: highlight box already exists or not
            if (!box) {
                var target = e.target || e.currentTarget;
                if (!target) {
                    console.log('Highlight animate failed because target can\'t be selected');
                    return false;
                }

                box = new Highlight(target);
                // todo: better find extra zoom
                box.inflate(conf.get('zoom') + 0.1);
                return false;
            }

            if (box.getIsInflated()) {
                box.deflate();
                box = null;
            }

            return false;
        });

        // Done.
        callback();

    });
});
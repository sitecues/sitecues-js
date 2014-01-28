/**
 * This file contains auxilary functions for prepare-and-adjust HLB instance.
 */
sitecues.def('hlb/designer', function (designer, callback, log) {

    // Constants.
    var toClass = {}.toString;

    // Chrome returns an rgba color of rgba(0, 0, 0, 0) instead of transparent.
    // http://stackoverflow.com/questions/5663963/chrome-background-color-issue-transparent-not-a-valid-value
    // Array of what we'd expect if we didn't have a background color
    var transparentColorNamesSet = [
    'transparent',
    'rgba(0, 0, 0, 0)'
    ];

    // todo: find our where those roundings come from "magicNumber"?
    var magicNumber = 0.1;

    designer.lineHeight = 20;
    designer.expandedHeight = 0;

    designer.heightExpandedDiffValue = 0;
    designer.widthNarrowedDiffValue  = 0;

    // Copied from source/highlight-box.js
    designer.kMinDistanceFromEdge = 32;       // The viewport inset from the window edges.
    designer.kBoxBorderWidth = 3;
    designer.kBoxPadding = 4;
    designer.kDefaultBgColor = 'rgb(255, 255, 255)';
    designer.kDefaultTextColor = 'rgb(0, 0, 0)';
    designer.kPlaceHolderWrapperClass = 'sitecues-eq360-box-placeholder-wrapper';

    // Get dependencies
    sitecues.use('jquery', 'conf', 'util/positioning', 'util/common', 'ui',

        function ($, conf, positioning, common) {

            designer.getHeightExpandedDiffValue = function() {
                return this.heightExpandedDiffValue;
            }

            designer.getWidthNarrowedDiffValue = function() {
                return this.widthNarrowedDiffValue;
            }

            designer.getExpandedHeight = function() {
                return this.expandedHeight;
            }

            designer.getCurrentTextColor = function(item) {
              var compStyle = item.currentStyle || window.getComputedStyle(item, null);
              var color = compStyle instanceof CSSStyleDeclaration ? compStyle["color"] : compStyle.getPropertyCSSValue("color");
              if ($.inArray(color, transparentColorNamesSet) > 0) {
                  color = designer.kDefaultTextColor;
                  $(this.item).parents().each(function () {
                      // Iterate through the parents looking for a background color.
                      var thisNodeColor = $(this).css('backgroundColor');
                      // See if the background color is a default or transparent color(if no, then $.inArray() returns '-1' value).
                      if ($.inArray(thisNodeColor, transparentColorNamesSet) < 0) {
                          // Found a background color specified in this node, no need to check further up the tree.
                          color = thisNodeColor;
                          return false;
                      }
                  });
              }
              return color;
            }
          
            /**
             * Gets the background value of highlight box when it appears.
             * @param itemNode HTML node Object
             * @param oldBgColor String
             * @param oldBgImage String
             * @return Object
             */
            designer.getNewBackground = function(itemNode, oldBgColor, oldBgImage) {
                var bgColorObj = {},
                bgImageObj = {};
                var parents = itemNode.parents().toArray();
                // Check to see if we have an existing background color
                if (!oldBgColor || $.inArray(oldBgColor, transparentColorNamesSet) >= 0) {
                    // Didn't find an existing background color, so see if a parent has one
                    bgColorObj = getNewBgColor(itemNode, parents);
                }
                // todo: fix list items bullet bg being considered as background image because they are.
                if (!oldBgImage || $(itemNode)[0].tagName.toLowerCase() === 'li' || common.isEmptyBgImage(oldBgImage)) {
                    bgImageObj = getNewBgImage(parents, itemNode);
                }
                return $.extend({}, bgColorObj, bgImageObj);
            }

            /*
            * Table elements require extra work for some cases - especially when table has flexible layout.
            * @param itemNode HTML node Object
            * @param currentStyle Object
            */
            designer.handleTableElement = function(itemNode, currentStyle) {
                // To reposition 'table'-like(for example,'td') elements, we need to set the td, tr, tbody, and table to display: block;
                var savedDisplay = currentStyle.display;
                // If the target is <td>, <tr>, <table> or any other table cell element then exit.
                if (savedDisplay.indexOf('table') === 0) {
                    itemNode.style('display', 'block', 'important');
                    return false;
                }

                // If the target is some inner element, like <div> or <p> inside of table cell then
                // handle flexible table width effect dependent of the inner elements.
                var tableCellAncestorParents = this.getTableCellAncestorParents(itemNode);
                tableCellAncestorParents.each(function () {
                    if (this.tagName.toLowerCase() === 'table') {
                        // todo: try to set table-layout:fixed to table
                        var closest = itemNode.closest('td');
                        var closestStyle = common.getElementComputedStyles(closest[0]);
                        var updateInnerElStyle = {};
                        if(closestStyle) {
                            updateInnerElStyle.width = parseFloat(closestStyle['width'])
                            - parseFloat(closestStyle['padding-left'])
                            - parseFloat(closestStyle['padding-right'])
                            - parseFloat(closestStyle['margin-left'])
                            - parseFloat(closestStyle['margin-right'])
                            - parseFloat(closestStyle['border-left-width'])
                            - parseFloat(closestStyle['border-right-width'])
                            + 'px';
                        }
                        $(closest).children().wrapAll("<div class='" + designer.kPlaceHolderWrapperClass + "'></div>");
                        itemNode.style('display', 'block', 'important');
                        $('.' + designer.kPlaceHolderWrapperClass).style('width', updateInnerElStyle.width, 'important');

                        return false; // Break the each loop
                    }
                })
                return false;
            }

            /*
             * Gets table ancestor element's parents.
             * @param itemNode
             * @return false if this is not a child of table element; otherwise, return an array of parent objects.
             */
            designer.getTableCellAncestorParents = function(itemNode) {
                var parents = itemNode.parents().andSelf();
                if (parents && parents.length > 0) {
                    return parents;
                }
                return false;
            }

            // Keep ratio for images
            designer.preserveImageRatio = function(cssBeforeAnimateStyles, cssUpdate, clientRect) {
                var initialRatio  = clientRect.width / clientRect.height;

                // If dimensions are recalculated, use the new values.
                if (cssUpdate.width || cssUpdate.height) {
                    delete cssBeforeAnimateStyles.width;
                    delete cssBeforeAnimateStyles.height;

                    if ((cssUpdate.height && cssUpdate.width) || cssUpdate.width) {
                        delete cssUpdate.height;
                        cssBeforeAnimateStyles.width =  cssUpdate.width;
                        cssBeforeAnimateStyles.height = cssUpdate.width / initialRatio;
                    } else if (cssUpdate.height) {
                        delete cssUpdate.width;
                        cssBeforeAnimateStyles.height = cssUpdate.height;
                        cssBeforeAnimateStyles.width = cssUpdate.height * initialRatio;
                    }
                    return;
                }

                // Otherwise, no specific dimensions set, so, use the original ones(if any available).
                var height = parseFloat(cssBeforeAnimateStyles.height);
                var width  = parseFloat(cssBeforeAnimateStyles.width);

                var widthType  = width ? toClass.call(width).slice(8, -1) : '';
                var heightType = height? toClass.call(height).slice(8, -1) : '';

                // If image dimensions are good and don't need recalculations, return.
                if (widthType === 'Number' && heightType === 'Number') {
                    return;
                }

                if (widthType === 'Number' || heightType === 'Number') {
                    delete cssBeforeAnimateStyles.width;
                    delete cssBeforeAnimateStyles.height;

                    // Rely on width since it is set(whereas height is not set(or, '', 'auto' specified))
                    if ((widthType === 'Number' && heightType === 'Number') || widthType === 'Number') {
                        delete cssUpdate.height;
                        cssBeforeAnimateStyles.height = width / initialRatio;
                    } else if (heightType === 'Number') {
                        // Rely on height since it is set(whereas width is not set(or, '', 'auto' specified))
                        delete cssUpdate.width;
                        cssBeforeAnimateStyles.width = height * initialRatio;
                    }
                }

                return;
            }

            /**
             * Get the size and position of the current HLB to inflate.
             * @param selector What element is being positioned
             * @param center   The center over which selector is positioned
             * @param zoom     Zooming the selector element if needed
             * @return cssUpdates An object containing left, top, width and height of the positioned element.
             * Example of the element that has different actual and visible width:
             * actual width = visible + not visible width.
             * _______________________________________________
             * |                             |////////////////|
             * | From the makers of ZoomText.|///not visible//|
             * |        (visible width)      |//////width/////|
             * |_____________________________|________________|
             */
            designer.getNewRectStyle = function(selector, currentStyle, center, extraZoom) {
                // Ensure a zoom exists.
                var extraZoom = extraZoom || 1;
                var assumedToBeText = !(currentStyle['display'] === 'inline-block' || currentStyle['display'] === 'inline');
                var additionalBoxOffset = designer.kBoxBorderWidth;
                if (assumedToBeText) {
                    additionalBoxOffset += designer.kBoxPadding;
                }

                // Use the proper center.
                var centerLeft = center.left;
                var centerTop = center.top;

                // Correctly compute the viewport.
                var viewport = positioning.getViewportDimensions(designer.kMinDistanceFromEdge, conf.get('zoom'));
                var cssUpdates = {};
                // The actual dimensions of the box: corrected for text nodes.
                // We only need it b/c positioning.js logic is based on the visible dimensions.
                // For example. see positioning.getCenter().
                // So, let's follow up the existing logic, OK?
                var absRect = conf.get('absoluteRect');
                // For floated elements the visual width and the actual width are different. Here we need the visual one.
//                var newCurrentStyle = $.extend({}, currentStyle,
//                                      {'width': Math.min(absRect.width, parseFloat(currentStyle.width)) + 'px'});
                
                $(selector).each(function () {
                    var jElement = $(this);

                    // Determine the final dimensions, and their affect on the CSS dimensions.
                    // Change the dimensions when needeed.
                    var constrainedWidth = false; //getConstrainedWidth(jElement, currentStyle, viewport);
                    var expandedHeight;
                    if (constrainedWidth) {
                        var heightValue = designer.getExpandedHeight(); 
                        // If it is a text node we want to get the exact text range's height;
                        // that is why we use conf.get('absoluteRect') instead of currentStyle
                        if (heightValue > absRect.height/ conf.get('zoom')) {
                            expandedHeight = heightValue;
                        }
                    }

                    // Real box dimensions.
//                    var width  = constrainedWidth
//                                 ? constrainedWidth
//                                 : (Math.min(absRect.width / conf.get('zoom'), parseFloat(currentStyle.width)) + 2 * additionalBoxOffset);
                    var leftInset = (parseFloat(currentStyle['border-left-width']) + parseFloat(currentStyle['border-right-width'])
                               + parseFloat(currentStyle['padding-left']) + parseFloat(currentStyle['padding-right']));
                    var topInset = (parseFloat(currentStyle['border-top-width']) + parseFloat(currentStyle['border-bottom-width'])
                               + parseFloat(currentStyle['padding-top']) + parseFloat(currentStyle['padding-bottom']));

                    // // Calculate box's dimensions before it is inflated.
                    var width = constrainedWidth || (parseFloat(currentStyle.width) + leftInset);
                    var height = expandedHeight  || (parseFloat(currentStyle.height) + topInset);
                    var left = centerLeft - width / 2;
                    var top  = centerTop  - height / 2;

                    // Calculate box's dimensions when it is inflated: insets may be changed by kBoxPadding and kBoxBorderWidth.
                    width  += (2 * designer.kBoxBorderWidth - parseFloat(currentStyle['border-left-width']) - parseFloat(currentStyle['border-right-width'])) * extraZoom;
                    height += (2 * designer.kBoxBorderWidth - parseFloat(currentStyle['border-top-width']) - parseFloat(currentStyle['border-bottom-width'])) * extraZoom;
                    var assumedToBeText = !(currentStyle['display'] === 'inline-block' || currentStyle['display'] === 'inline');
                    if (assumedToBeText) {
                        width  += (2 * designer.kBoxPadding - parseFloat(currentStyle['padding-left']) - parseFloat(currentStyle['padding-right'])) * extraZoom;
                        height += (2 * designer.kBoxPadding - parseFloat(currentStyle['padding-top']) - parseFloat(currentStyle['padding-bottom'])) * extraZoom;
                    }
                    var inflatedHeight = height * extraZoom,
                        inflatedWidth = width * extraZoom,
                        inflatedLeft = left - (width * extraZoom  - width) / 2,
                        inflatedTop =  top  - (height * extraZoom - height) / 2;

                    // If we need to change the element's dimensions, so be it. However, explicitly set the dimensions only if needed.
                    var newWidth, newHeight, newLeft, newTop;

                    //var zoomHeightDiff = (inflatedHeight - jElement[0].getBoundingClientRect().height) / 2 ;          // new height - old height
                    //var zoomWidthDiff = (parseFloat(currentStyle.width) - jElement[0].getBoundingClientRect().width) / (2 * extraZoom) ; // new width - old width
                    // todo: use heightDiff instead of newMaxHeight when the element is too wide
                    // and we shrink the width => the height may be expanded.
                    var newMaxHeight = inflatedHeight / extraZoom;

                    // Check the width and horizontal positioning.
                    if (inflatedWidth > viewport.width) {
                        // Fit to width of viewport.
                        newWidth = (viewport.width - 2 * additionalBoxOffset) / extraZoom;
                        // Since we change the width here, the 50% 50% center for trancformation is shifted.
                        // todo: AK: still don't get where '4' comes from????
                        inflatedLeft += (parseFloat(currentStyle.width) - newWidth) / 4;
                        newLeft = - inflatedLeft + window.pageXOffset/conf.get('zoom') + designer.kMinDistanceFromEdge;
                    } else {
                        // The element isn't too wide. However, if the element is out of the view area, move it back in.
                        if (viewport.left > inflatedLeft) {
                            newLeft = viewport.left - inflatedLeft;
                        } else if ((inflatedLeft + inflatedWidth) > viewport.right) {
                            newLeft = viewport.right - (inflatedLeft + inflatedWidth);
                        }
                    }

                    // Check the height and vertical positioning.
                    if (inflatedHeight > viewport.height) {
                        // Shrink the height.
                        newHeight = (viewport.height - 2 * additionalBoxOffset) / extraZoom;
                        // Since we change the width here, the 50% 50% center for trancformation is shifted.
                        // todo: AK: still don't get where '4' comes from????
                        inflatedTop += (parseFloat(currentStyle.height) - newHeight) / 4;
                        // Set top to viewport's top border.
                        newTop = - inflatedTop + window.pageYOffset/conf.get('zoom') + designer.kMinDistanceFromEdge;
                    } else {
                        // The element isn't too tall. However, if the element is out of the view area, move it back in.
                        if (viewport.top > inflatedTop) {
                            newTop = viewport.top - inflatedTop;
                        } else if ((inflatedTop + inflatedHeight) > viewport.bottom) {
                            newTop = viewport.bottom - (inflatedTop + inflatedHeight);
                        }
                    }
                    newMaxHeight = newHeight || newMaxHeight || (viewport.height - 2 * additionalBoxOffset)/ extraZoom;
                    cssUpdates = {
                        left: newLeft,
                        top:  newTop,
                        width:  newWidth || constrainedWidth,
                        height: newHeight || expandedHeight,
                        maxHeight: newWidth? newMaxHeight: undefined
                    };
                    // Only use difference in height if it was shortened(we need to compensate it in margin).
                    // var tempH = (cssUpdates.height - parseFloat(currentStyle.height)) || 0;
                    // designer.heightExpandedDiffValue = expandedHeight?  tempH : -tempH;
                    designer.heightExpandedDiffValue = expandedHeight? (cssUpdates.height - parseFloat(currentStyle.height)) || 0 : 0;
                    designer.widthNarrowedDiffValue  = constrainedWidth? (cssUpdates.width  - parseFloat(currentStyle.width))  || 0 : 0;

                });
                return cssUpdates;
            }


        designer.getBoundingElements = function(pickedElement) {
            var boundingBoxes = {};
            var pickedRect = pickedElement.getBoundingClientRect();

            var prevBoxes = getElementsAround(pickedRect, pickedElement, false);
            var nextBoxes = getElementsAround(pickedRect, pickedElement, true);

            $.extend(boundingBoxes, prevBoxes);
            $.extend(boundingBoxes, nextBoxes);

            return boundingBoxes;
        }

        /**
         * Gets the bounding elements based on previous or next siblings;
         * Second part of DFS algorithm used.
         * @param {Object} pickedRect
         * @param {HTMLObject} current
         * @param {boolean} next Defines which direction to use: nextSibling if true; previousSibling if false.
         * @returns {Object} res Two-element array containing bounding boxes:
         * - right & below boxes if next siblings are looked thhrough;
         * - above & left boxes if previous elements are looked through.
         * 
         * Example of result:
         * Object {above: input{Object}, left: head{Object}, below: p#p2{Object}}
         * 
         */
        function getElementsAround(pickedRect, current, next) {
            var res = {};
            var whichDirectionSibling = next? 'nextSibling' : 'previousSibling';

            return function _recurse(pickedRect, current) {
                if (Object.keys(res).length === 2 || common.isValidNonVisualElement(current)) {
                    return res;
                }

               var iter = current[whichDirectionSibling];
                if (!iter) {
                    iter = current.parentNode;
                    current = iter;
                    return _recurse(pickedRect, current);
                }

                while (!common.isValidBoundingElement(iter)) {
                    iter = iter[whichDirectionSibling];
                    if (!iter) {
                        iter = current.parentNode;
                        current = iter;
                        return _recurse(pickedRect, current);
                    }
                    if (common.isValidNonVisualElement(iter)) {
                       return res; 
                    }
                }

                current = iter;
                var rect = current.getBoundingClientRect();
                if (next) {
                    if (!res['below'] && (Math.abs(rect.top) >= Math.abs(pickedRect.bottom))) {
                        res['below'] = current;
                    }
                    if (!res['right'] && (Math.abs(rect.left) >= Math.abs(pickedRect.right))) {
                        res['right'] = current;
                    }
                    return _recurse(pickedRect, current);
                }
                // Previous
                if (!res['above'] && (Math.abs(rect.bottom) <= Math.abs(pickedRect.top))) {
                    res['above'] = current;
                }
                if (!res['left']) {
                    if ((Math.abs(rect.right) <= Math.abs(pickedRect.left))
                        // #eeoc
                        || ($(current).css('float') !== 'none'
                        && (Math.abs(rect.right) <=  Math.abs(pickedRect.left) + rect.width + (Math.abs(rect.left) - Math.abs(pickedRect.left))))) {
                        res['left'] = current;
                    }
                }
                return _recurse(pickedRect, current);

            }(pickedRect, current);
        }

        /**
         * Make sure underlying content doesn't shift after we apply HLBs styles.
         * Calculates margin shift to be applied.
         * @param {HTMLObject} $el
         * @returns {Object}
         */
        designer.getShift = function($el, boundingBoxes, computedStyles) {
            // todo:  2* additionalBoxOffset * extraZoom
            return {'vert': getShiftVert($el, boundingBoxes, computedStyles) + 'px', 'horiz': getShiftHoriz($el, boundingBoxes, computedStyles) + 'px'};
        }

        /**
         * Get vertical shift to be compensated after we apply HLB styles.
         * @param {HTMLObject} $el
         * @returns {Number}
         */
        function getShiftVert($el, boundingBoxes, computedStyles) {
            var aboveBox = boundingBoxes.above;
            // #1 case: general case.
            var compensateShiftVert = getTopIndent(computedStyles);
            // #2 case: first element in the body or the prev element has bigger margin bottom.
            if (aboveBox && parseFloat($(aboveBox).css('margin-bottom')) >= parseFloat($el.css('margin-top'))) {
                compensateShiftVert -= parseFloat(computedStyles['margin-top']);
            }
            return compensateShiftVert;
        }

        /**
         * Get horizontal shift to be compensated after we apply HLB styles.
         * @param {HTMLObject} $el
         * @returns {Number}
         */
        function getShiftHoriz($el, boundingBoxes, computedStyles) {
            var leftBox = boundingBoxes.left;
             // #1 case: general case.
            var compensateShiftHoriz = getLeftIndent(computedStyles);
            // #2 case: first element in the body or the previous element has the bigger margin-right.
            if (leftBox && parseFloat($(leftBox).css('margin-right')) >= parseFloat($el.css('margin-left'))) {
                compensateShiftHoriz -= + parseFloat(computedStyles['margin-left']);
            }
            return compensateShiftHoriz;
        }

        function getTopIndent(computedStyles) {
            var fullTopInset, minimumTopInset, isNotImage;
            isNotImage = common.isEmptyBgImage(computedStyles['background-image']);
            minimumTopInset =
                    (parseFloat(computedStyles['border-top-width']) + parseFloat(computedStyles['border-bottom-width'])
                    + parseFloat(computedStyles['margin-top']))
                    - 2 * designer.kBoxBorderWidth;
            if (isNotImage) {
                fullTopInset =
                    minimumTopInset
                    + parseFloat(computedStyles['padding-top']) + parseFloat(computedStyles['paddin-bottom'])
                    - 2 * designer.kBoxPadding;
            }
            return fullTopInset || minimumTopInset;
        }

        function getLeftIndent(computedStyles) {
            var fullLeftInset, minimumLeftInset, isNotImage;
            isNotImage = common.isEmptyBgImage(computedStyles['background-image']);
            minimumLeftInset = (parseFloat(computedStyles['border-left-width']) + parseFloat(computedStyles['border-right-width'])
                    + parseFloat(computedStyles['margin-left']))
                    - 2 * designer.kBoxBorderWidth;
            if (isNotImage) {
                fullLeftInset = minimumLeftInset
                    + parseFloat(computedStyles['padding-left']) + parseFloat(computedStyles['padding-right'])
                    - 2 * designer.kBoxPadding;
            }
            return fullLeftInset || minimumLeftInset;
        }

        /**
         * On zoom chrome behavies differently from the rest of browsers:
         * instead of fixed value, for ex., '10px', it sets '9.99999999663px'.
         * This brings shifts of underlying content when we inflate the element.
         * The method below neutralizes roundings problem.
         * @returns {Object} Set of styles to be set.
         */
        designer.getRoudingsOnZoom = function(el, boundingBoxes, currentStyle, compensateShift) {
            var roundingsStyle = {};
            var belowBox = boundingBoxes.below;
            var aboveBox = boundingBoxes.above;
            var compensateShiftFloat = parseFloat(compensateShift['vert']);
            var newComputedStyles = el.currentStyle || window.getComputedStyle(el, null);

            var diffHeight = this.getHeightExpandedDiffValue()? 0: getDiffHeight(currentStyle, newComputedStyles);
            var diffWidth  = this.getWidthNarrowedDiffValue()?  0: getDiffWidth(currentStyle, newComputedStyles);

            if (diffWidth !== 0) {
                // todo: copy the diffHeight part, making specific changes.
                roundingsStyle['margin-left'] = parseFloat(newComputedStyles['margin-left']) + diffWidth + magicNumber + 'px';
                roundingsStyle['left'] = (parseFloat($(el).css('left')) || 0) - ((parseFloat(roundingsStyle['margin-left']) || 0) - parseFloat(currentStyle['margin-left']));
            }

            if (diffHeight === 0) {
                return roundingsStyle;
            }

            if ($(el).css('clear') === 'both') {
                if (belowBox && parseFloat($(belowBox).css('margin-top')) <= compensateShiftFloat) {
                    roundingsStyle['margin-bottom'] = parseFloat(newComputedStyles['margin-bottom']) + diffHeight + 'px';
                }
                if (aboveBox && parseFloat($(aboveBox).css('margin-bottom')) <= compensateShiftFloat) {
                    roundingsStyle['margin-top'] = parseFloat(newComputedStyles['margin-top']) + diffHeight + 'px';
                }
            } else {
                // The current element has biggest the top & bottom margins initially but new one(s) are smaller.
                if (compensateShiftFloat > 0
                  && (belowBox && parseFloat($(belowBox).css('margin-top')) >= compensateShiftFloat)
                  && (aboveBox && parseFloat($(aboveBox).css('margin-bottom')) >= compensateShiftFloat)) {
                        roundingsStyle = {'margin-top': parseFloat(newComputedStyles['margin-top']) - diffHeight / 2  + 'px',
                                          'margin-bottom':  parseFloat(newComputedStyles['margin-bottom']) - diffHeight / 2  + 'px'};
                } else if (compensateShiftFloat < 0
                    && (aboveBox && parseFloat($(aboveBox).css('margin-bottom')) <= parseFloat(currentStyle['margin-top']))) {
                        roundingsStyle['margin-bottom'] = parseFloat(newComputedStyles['margin-bottom']) + diffHeight + 'px';
                } else {
                    roundingsStyle['margin-top'] = parseFloat(newComputedStyles['margin-top']) + diffHeight + 'px';
                }
            }

            roundingsStyle['top'] = (parseFloat($(el).css('top')) || 0) - ((parseFloat(roundingsStyle['margin-top']) || 0) - parseFloat(currentStyle['margin-top']));
            return roundingsStyle;
        }

        function getDiffHeight(currentStyle, newComputedStyles) {
            var origMarginHeight = parseFloat(currentStyle['margin-top']) + parseFloat(currentStyle['margin-bottom']);
            var newMarginHeight  = parseFloat(newComputedStyles.marginTop) + parseFloat(newComputedStyles.marginBottom);

            var origBorderHeight =  parseFloat(currentStyle['border-top-width']) + parseFloat(currentStyle['border-bottom-width'])
            var newBorderHeight  = parseFloat(newComputedStyles.borderTopWidth) + parseFloat(newComputedStyles.borderBottomWidth);

            var origPaddingHeight = parseFloat(currentStyle['padding-top']) + parseFloat(currentStyle['padding-bottom']);
            var newPaddingHeight  = parseFloat(newComputedStyles.paddingTop) + parseFloat(newComputedStyles.paddingBottom);

            var origHeight = parseFloat(currentStyle['height']);
            var newHeight  = parseFloat(newComputedStyles.height);

            var diffHeight = origMarginHeight + origBorderHeight + origPaddingHeight + origHeight
                           - (newMarginHeight + newBorderHeight + newPaddingHeight + newHeight);

            return diffHeight;
        }

        function getDiffWidth(currentStyle, newComputedStyles) {
            var origMarginWidth = parseFloat(currentStyle['margin-left']) + parseFloat(currentStyle['margin-right']);
            var newMarginWidth  = parseFloat(newComputedStyles.marginLeft) + parseFloat(newComputedStyles.marginRight);

            var origBorderWidth =  parseFloat(currentStyle['border-left-width']) + parseFloat(currentStyle['border-right-width'])
            var newBorderWidth  = parseFloat(newComputedStyles.borderLeftWidth) + parseFloat(newComputedStyles.borderRightWidth);

            var origPaddingWidth = parseFloat(currentStyle['padding-left']) + parseFloat(currentStyle['padding-right']);
            var newPaddingWidth  = parseFloat(newComputedStyles.paddingLeft) + parseFloat(newComputedStyles.paddingRight);

            var origWidth = parseFloat(currentStyle['width']);
            var newWidth  = parseFloat(newComputedStyles.width);

            var diffWidth = origMarginWidth + origBorderWidth + origPaddingWidth + origWidth
                           - (newMarginWidth + newBorderWidth + newPaddingWidth + newWidth);
            return diffWidth;
        }

            /**
             * 
             * @param {type} $el
             * @param {type} currentStyle
             * @returns {Number|Boolean} False if we don't need to narrow the width;
             * Number of pixels otherwise.
             */
            function getConstrainedWidth($el, currentStyle, viewport) {
                // If text is non-word-wrappable forget about it.
                if (!common.isWordWrappableElement($el[0])) {
                    return false;
                }

                // Pixel-based solution isn't reliable b/c each font had differences
                // in terms of char height and width. Let's find out how much space 50-x
                // chars text takes and use the value as constrained width.
                var currentWidth = parseFloat(currentStyle.width),
                    xCharWidth = common.getXCharWidth(currentStyle),
                    minXCharsQuantity = 50,
                    maxXCharsQuantity = 65,
                    widthOf50xChars = xCharWidth * minXCharsQuantity,
                    widthOf65xChars = xCharWidth * maxXCharsQuantity,
                    $testNode = createTestNode($el[0]),
                    maxWidth  = viewport.width,
                    maxHeight = viewport.height;
            
                // Remove testNode once the script finished execution.
                setTimeout(function() {$testNode.remove();}, 0);
                if ((currentWidth <= widthOf50xChars) && !common.hasVertScroll($el[0])) {
                    // All good, no need for constrains.
                    return false;
                }

                // If width greater than 50 x-width characters then...
                if (common.hasVertScroll($el[0])) {
                     // If vertical scrolling was already necessary, try to add width up max of 65 x-widths
                     var expandedWidth = _recurseWidthCloseToNChars($testNode, maxXCharsQuantity, widthOf65xChars, currentWidth, maxHeight);
                     // If it doesn't cause box to go offscren and removes need for vertical scrolling
                     if (expandedWidth && (expandedWidth < maxWidth)) {
                         return expandedWidth;
                     }
                     // Otherwise, shorten to 50 x-widths
                     return widthOf50xChars;
                }

                // Vertical scrolling was not necessary --
                // shorten lines as close to 50 x-widths as possible,
                // up to the point where vertical scrolling still is not necessary.

                // Find the best constrained width, if any needed.
                var constrainedWidth = _recurseWidthCloseToNChars($testNode, minXCharsQuantity, currentWidth, widthOf50xChars, maxHeight);
                return constrainedWidth;
            }

            function createTestNode(el) {
                // Clone an element and check if the vertical scroll appears at any step.
                // todo: use 'false' instead of 'true'( do not copy events and data)
                // or, simply remove the attrs, copying the styles before that
                var testNode = el.cloneNode(true);
                $(testNode)
                        // todo: copy-set all of the styles assigned to ID as they may affect the font?
                        // Having > 1 element with the same ID may cause layout problems.
                        .attr('id', '')
                        .css('visibility', 'hidden')
                        .appendTo('body');
                return $(testNode);
            }

            function _recurseWidthCloseToNChars($testNode, n, currentWidth, limitedWidth, maxHeight) {
                // Exit if the constrained width become equal to the current width.
                if (Math.round(currentWidth - limitedWidth) === 0) {
                    return false;
                }
                var savedHeight = parseFloat($testNode.css('height'));
                $testNode.css({'width': limitedWidth + 'px'});
                if (common.hasVertScroll($testNode[0])) {
                    // Define the constained width as close to 50 x-widths as possible:
                    // Add 1/2 of width clipped iteratively.
                    return _recurseWidthCloseToNChars($testNode, n, currentWidth, limitedWidth + Math.round(currentWidth - limitedWidth) / 2, maxHeight);
                } else {
                    var changedHeight = parseFloat($testNode.css('height'));
                    if (changedHeight >= maxHeight) {
                        // The new height is greater than viewport's height;
                        // this will cause vertical scroll finally to appear.
                        $testNode.css({'height': savedHeight + 'px'});
                        return _recurseWidthCloseToNChars($testNode, n, currentWidth, limitedWidth + Math.round(currentWidth - limitedWidth) / 2, maxHeight);
                    }
                    // No vertical scroll should appear, we are done(finally).
                    designer.expandedHeight = changedHeight;
                    return limitedWidth;
                }
            };

            /**
             * Get new background color of highlight box when it appears.
             * Returns the either parent's background color or default one(if we haven't fetched a suitible background color from parent).
             * @param parents Array
             * @return Object
             */
            function getNewBgColor(itemNode, parents) {
                // Set a variable for the default background in case we don't find one.
                var bgColor = designer.kDefaultBgColor;
                // Special treatment for images since they might have text on transparent background.
                // We should make sure text is readable anyways.
                if (!common.isEmptyBgImage($(itemNode).css('backgroundImage'))) {
                    // Create image object using bg image URL.
                    var imageObj = new Image();
                    imageObj.onload = function() {
                        var rgb = common.getAverageRGB(this);
                        bgColor = 'rgb(' + rgb.r + ',' + rgb.b + ',' + rgb.g + ')';
                    };
                    var bgImage = $(itemNode).css('backgroundImage');
                    // RegExp below will take out bg image URL from the string.
                    // Example: 'url(http://example.com/foo.png)' will evaluate to 'http://example.com/foo.png'.
                    var url = bgImage.match(/\(([^)]+)\)/)[1];
                    if (common.validateUrl(url)) {
                        imageObj.src = url;
                    }
                } else if (itemNode[0].tagName.toLowerCase() === 'img') {
                    var rgb = common.getAverageRGB($(itemNode)[0]);
                    bgColor = 'rgb(' + rgb.r + ',' + rgb.b + ',' + rgb.g + ')';
                } else {
                    // Not an image, doesn't have bg image so just iterate over element's parents.
                    $(parents).each(function () {
                        // Iterate through the parents looking for a background color.
                        var thisNodeColor = $(this).css('backgroundColor');
                        // See if the background color is a default or transparent color(if no, then $.inArray() returns '-1' value).
                        if ($.inArray(thisNodeColor, transparentColorNamesSet) < 0) {
                            // Found a background color specified in this node, no need to check further up the tree.
                            bgColor = thisNodeColor;
                            return false;
                        }
                    });
                }

                // Return the default background color if we haven't fetched a suitible background color from parent.
                return {
                    'bgColor': bgColor
                };

            }

            /**
             * Get new background image of highlight box when it appears.
             * Returns either parent's background image or the default one if we haven't returned a parent's background.
             * @param parents Array
             * @param itemNode HTML node Object
             * @return Object
             */
            function getNewBgImage(parents, itemNode) {
                // Some elements such as inputs don't require background.
                // todo: if other elements are tested below then better to arrange an array.
                if (itemNode[0].tagName.toLowerCase() !== 'input' && itemNode[0].tagName.toLowerCase() !== 'textarea') {
                    var bgImage, bgPos, bgRepeat;
                    $(parents).each(function () {
                        // Iterate through the parents looking for a background image.
                        // todo: fix list items bullet background being considered as background image because they are.
                        if ($(this)[0].tagName.toLowerCase() !== 'li') {
                            var thisNodeImage = $(this).css('backgroundImage');
                            if (!common.isEmptyBgImage(thisNodeImage)) {
                                // It's an easy case: we just retrieve the parent's background image.
                                bgImage  = thisNodeImage;
                                bgPos    = $(this).css('backgroundPosition');
                                bgRepeat = $(this).css('backgroundRepeat');
                                return false;
                            }
                        }
                    });

                    return {
                        'bgImage': bgImage,
                        'bgPos': bgPos,
                        'bgRepeat': bgRepeat
                    };
                }
            }

        });

    // Done.
    callback();
});
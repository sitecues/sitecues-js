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

    designer.heightExpandedDiffValue = 0;
    designer.widthNarrowedDiffValue  = 0;

    // Copied from source/highlight-box.js
    designer.kMinDistanceFromEdge = 32;       // The viewport inset from the window edges.
    designer.kBoxBorderWidth = '3px';
    designer.kBoxPadding = '4px';
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
             */
            designer.getNewRectStyle = function(selector, currentStyle, center, extraZoom, totalZoom) {
                //TODO: Figure out a better way to get the offset.left...I've tried to figure
                //      out the math involved for way too long, and decided to use the easier way.
                //      I myself don't notice the scaling to 1, so maybe we can get away with this but I don't like it.
				//EQ-880
                if (!('zoom' in document.createElement('div').style)) {
                    $('body').css({'transform':'scale(1)'});
                }
                // Ensure a zoom exists.
                var extraZoom = extraZoom || 1;
                // Use the proper center.
                var centerLeft = center.left;
                var centerTop = center.top;
                // Correctly compute the viewport.
                var viewport = positioning.getViewportDimensions(designer.kMinDistanceFromEdge, totalZoom);
                var cssUpdates = {};
                $(selector).each(function () {
                    var jElement = $(this);

                    // Determine the final dimensions, and their affect on the CSS dimensions.
                    var additionalBoxOffset = (parseFloat(designer.kBoxBorderWidth) + parseFloat(designer.kBoxPadding));
                    // For floated elements the visual width and the actual width are different. Here we need the visual one.
                    var newCurrentStyle = $.extend({}, currentStyle, {'width': Math.min(conf.get('rect').width, parseFloat(currentStyle.width)) + 'px'});
                    var shortenWidthValue = narrowWidth(jElement, newCurrentStyle);
                    var expandedHeightValue;
                    if (shortenWidthValue) {
                        var heightValue = expandHeight(jElement, currentStyle, shortenWidthValue);
                        if (expandedHeightValue > parseFloat(currentStyle.height)) {
                            expandedHeightValue = heightValue;
                        }
                    }

                    var rect = this.getBoundingClientRect();
                    var width  = shortenWidthValue || (rect.width + 2 * additionalBoxOffset)    * extraZoom;
                    var height = expandedHeightValue || (rect.height + 2 * additionalBoxOffset) * extraZoom;
                    var left = centerLeft - (width / 2);
                    var top  = centerTop - (height / 2);

                    // If we need to change the element's dimensions, so be it. However, explicitly
                    // set the dimensions only if needed.
                    var newWidth, newHeight, newLeft, newTop;

                    // Check the width and horizontal positioning.   
                    if (width > viewport.width) {
                        // Fit to width of viewport.
                        newWidth   = (viewport.width - 2 * additionalBoxOffset) / extraZoom;
                        var zoomWidthDiff = (width - jElement[0].getBoundingClientRect().width) / (2 * extraZoom) ;          // new width - old width
                        newLeft = - jElement.offset().left + window.pageXOffset + zoomWidthDiff + designer.kMinDistanceFromEdge;
                    } else {
                        // The element isn't too wide. However, if the element is out of the view area, move it back in.
                        if (viewport.left > left) {
                            newLeft = viewport.left - left;
                        } else if ((left + width) > viewport.right) {
                            newLeft = viewport.right - (left + width);
                        }
                    }

                    // Check the height and vertical positioning.
                    if (height > viewport.height) {
                        // Shrink the height.
                        newHeight = (viewport.height - 2 * additionalBoxOffset * totalZoom) / extraZoom;
                        // Set top to viewport's top border.
                        var zoomHeightDiff = (height - jElement[0].getBoundingClientRect().height) / (2 * extraZoom) ;          // new height - old height
                        newTop = - jElement.offset().top + window.pageYOffset + zoomHeightDiff + designer.kMinDistanceFromEdge;
                        
                    } else {
                        // The element isn't too tall. However, if the element is out of the view area, move it back in.
                        if (viewport.top > top) {
                            newTop = viewport.top - top;
                        } else if ((top + height) > viewport.bottom) {
                            newTop = viewport.bottom - (top + height);
                        }
                    }
                    var newMaxHeight = newHeight || (viewport.bottom - positioning.getOffset(jElement).top - 2 * additionalBoxOffset) / extraZoom;
                    // Create the CSS needed to place the element where it needs to be, and to zoom it.
                    cssUpdates = {
                        left: newLeft,
                        top:  newTop,
                        width:  shortenWidthValue || newWidth,
                        height: newHeight || expandedHeightValue,
                        maxHeight: newWidth? newMaxHeight: undefined
                    };
                    // Only use difference in height if it was shortened(we need to compensate it in margin).
                    designer.heightExpandedDiffValue = expandedHeightValue? (cssUpdates.height - parseFloat(currentStyle.height)) || 0 : 0;
                    designer.widthNarrowedDiffValue  = shortenWidthValue?   (cssUpdates.width  - parseFloat(currentStyle.width))  || 0 : 0;

                });
                //TODO: Figure out a better way to get the offset.left...I've tried to figure
                //      out the math involved for way too long, and decided to use the easier way.
                //      I myself don't notice the scaling to 1, so maybe we can get away with this but I don't like it.
                //EQ-880
                if (!('zoom' in document.createElement('div').style)) {
                    $('body').css({'transform':'scale('+totalZoom+')'});
                }
                return cssUpdates;
            }

            // todo: do not use scroll unless absolutely necessary.
            function narrowWidth($el, currentStyle) {
                // EQ-1359: If width > 50 x-width characters and text is word-wrappable
                // then shorten to 50 x-widths
                if ($el[0].localName !== 'img') {
                    /* Font characteristics:
                        font-family: "Arial, Helvetica, sans-serif"
                        font-size: "19.230770111083984px"
                        font-style: "normal"
                        font-variant: "normal"
                        font-weight: "500"
                     */
                    var fontStyle = {
                        'font-family': currentStyle['font-family'],
                        'font-size':   currentStyle['font-size'],
                        'font-style':  currentStyle['font-style'],
                        'font-variant':currentStyle['font-variant'],
                        'font-weight': currentStyle['font-weight']
                    };
                    // Pixel-based solution isn't reliable b/c each font had differences
                    // in terms of char height and width.
                    // Let's check how many pixles each char takes in average.
                    $('body').append('<div id="testwidth"><span>&nbsp;</span></div>');
                    var wSlim = $('#testwidth span').css($.extend({'width': '1ch'}, fontStyle)).width();
                    $('#testwidth').remove();

                    $('body').append('<div id="testwidth2"><span>w</span></div>');
                    var wThick = $('#testwidth2 span').css('width', '1ch').width();
                    $('#testwidth2').remove();

                    var wMiddle = (wSlim + wThick) / 2;
                    var charsQuantity = 50;
                    var textWidth = wMiddle * charsQuantity;
                    if (parseFloat(currentStyle.width) > textWidth) {
                        return textWidth;
                    }
                }
                return false;
            }

            function expandHeight($el, currentStyle, shortenWidthValue) {
                // todo: common.hasVertScroll($el[0]);
                var lineHeight = common.getLineHeight($el);

                var oldHeight  = parseFloat(currentStyle.height);
                var oldWidth  = parseFloat(currentStyle.width);
                var newWidth = shortenWidthValue;

                var oldLineNumber = Math.round(oldHeight / lineHeight);
                var newLineNumber = Math.round(((conf.get('absoluteRect').width || oldWidth) / newWidth) * oldLineNumber);
                var expandedHeight = newLineNumber * lineHeight + 'px';

                return expandedHeight;
            }

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
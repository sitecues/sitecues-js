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
                            - parseFloat(closestStyle['border-left-width'])   // Odd -- why repeated?
                            - parseFloat(closestStyle['border-left-width'])
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
            designer.getNewRectStyle = function(selector, center, extraZoom, totalZoom) {
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

                    // As we are not moving the element within the DOM, we need to position the
                    // element relative to it's offset parent. These calculations need to factor
                    // in the total zoom of the parent.
                    var offsetParent = jElement.offsetParent();
                    var offsetParentPosition = positioning.getOffset(offsetParent);
                    var offsetParentZoom = positioning.getTotalZoom(offsetParent);

                    // Determine the final dimensions, and their affect on the CSS dimensions.
                    var additionalBoxOffset = (parseFloat(designer.kBoxBorderWidth) + parseFloat(designer.kBoxPadding));
                    var rect = positioning.getSmartBoundingBox(this);
                    var width = (rect.width + 2 * additionalBoxOffset) * extraZoom;
                    var height = (rect.height + 2 * additionalBoxOffset) * extraZoom;
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
                // AK: leave it in case we get regression bugs. todo: should be removed in future.
                //cssUpdates.maxHeight = viewport.bottom - positioning.getOffset(jElement).top - 2 * additionalBoxOffset;
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
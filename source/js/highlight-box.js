/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 */
sitecues.def('highlight-box', function (highlightBox, callback) {

    // Get dependencies
    sitecues.use('jquery', 'conf', 'cursor', 'util/positioning', 'util/common', 'hlb/event-handlers', 'background-dimmer', 'ui',
    function ($, conf, cursor, positioning, common, eventHandlers, backgroundDimmer) {

        // Constants

        // This is the default setting, the value used at runtime will be in conf.
        var kMinHighlightZoom = 1.01;

        var extraZoom = 1.5;
		var toClass = {}.toString;

        // Chrome returns an rgba color of rgba(0, 0, 0, 0) instead of transparent.
        // http://stackoverflow.com/questions/5663963/chrome-background-color-issue-transparent-not-a-valid-value
        // Array of what we'd expect if we didn't have a background color
        var transparentColorNamesSet = [
            'transparent',
            'rgba(0, 0, 0, 0)'
        ];
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
                sitecues.emit('hlb/' + state.name, highlightBox);
            }
        };

        // Current highlight box instance, only work with it. There can only be one instance in the system
        // that is not in the CLOSED state, and that instance will be referenced by 'instance'
        var instance = null;

        // Returns the state of the highlight box module. If there is no instance, use the global state.
        var getState = highlightBox.getState = function() {
            return (instance ? instance.getState() : state);
        };

		// todo: take out common things like these below into general sitecues file which is loaded before any other file starts loading.
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
                this.state = STATES.CREATE;
                this.savedCss = [];
                this.savedStyleAttr = [];
                this.origRectDimensions = [];
                this.item = target; // Need to know when we have box for checking mouse events before closing prematurely
                this.itemNode = $(this.item);

                // notify about new hlb
                sitecues.emit('hlb/create', this.item);

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
            HighlightBox.kBoxZindex = 2147483646;
            HighlightBox.kMinDistanceFromEdge = 32;       // The viewport inset from the window edges.
            HighlightBox.kBoxBorderWidth = '3px';
            HighlightBox.kBoxPadding = '4px';             // Give the text a little extra room
            HighlightBox.kBoxBorderRadius = '4px';
            HighlightBox.kBoxBorderStyle = 'solid';
            HighlightBox.kBoxBorderColor = '#222222';
            HighlightBox.kDefaultBgColor = '#ffffff';
            // Space placeholders prevent content after box from going underneath it.
            HighlightBox.kPlaceHolderClass = 'sitecues-eq360-box-placeholder';
            HighlightBox.kPlaceHolderWrapperClass = 'sitecues-eq360-box-placeholder-wrapper';
            // TODO: Expand this array to include all appropriate elements.
            // HighlightBox.kDimensionAdjustableElements = { p: true, span: true, td: true };


            HighlightBox.isSticky = false;

            /**
             * Toggle Sticky state of highlight box
             */
            sitecues.toggleStickyHLB = function () {
              if (HighlightBox.isSticky){
                HighlightBox.isSticky = false;
              } else {
                HighlightBox.isSticky = true;
              }

              return HighlightBox.isSticky;
            };

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

                // Immediately enter the HLB
                this.state = STATES.INFLATING;
                sitecues.emit('hlb/inflating', this.item);

                var _this = this;

                // Get the current element styles.
                var currentStyle = this.savedCss[this.savedCss.length - 1],
                    origRectSize = this.origRectDimensions[this.origRectDimensions.length - 1];

                var center    = positioning.getCenter(this.item),
                    totalZoom = positioning.getTotalZoom(this.item, true),
                    cssUpdate = getNewRectStyle(this.itemNode, center, extraZoom, totalZoom);

                // Handle table special behaviour on inner contents.
                handleTableElement(this.itemNode, currentStyle);

                // Get animation CSS styles.
                var cssBeforeAnimateStyles = this.getInflateBeforeAnimateStyles(currentStyle, cssUpdate);
                // Only animate the most important values so that animation is smoother
                var cssAnimateStyles = $.extend({}, cssUpdate, {
                    transform: 'scale(' + extraZoom + ')'
                });

                // Insert placeholder before HLB target is absoultely positioned.
                // Otherwise, we might loose white space intent to the left/right because
                // in most cases sequence of whitespace will collapse into a single whitespace.
                this.prepareAndInsertPlaceholder(currentStyle, origRectSize);

                // Quick state issue fix! If the HLB is still inflating slightly after the animation is supposed to end, then
                // close it out.
                setTimeout(function() {
                    if (getState() === STATES.INFLATING) {
					    log.warn("hlb in bad state. resetting.");
                        // Bad state. This instance is now officially closed.
                        _this.state = STATES.CLOSED;
                        // Call the module method to clean up after close BEFORE calling listeners.
                        onHighlightBoxClosed(_this.item);
                        // Ensure the bg dimmer is gone.
                        // AK: comment out all the dimmer calls by AL request
                        backgroundDimmer.removeDimmer();
                        // Trigger the background blur effect if there is a highlight box only.
                        log.into("hlb closed");
                        sitecues.emit('hlb/closed', _this.item);
                    }
                }, HighlightBox.kShowBoxSpeed + 100);

                // Animate HLB (keep in mind $.animate() is non-blocking).
	            var ancestorCSS = [ ];
	            $(this.itemNode).parents().each(function () {
                    ancestorCSS.push({
                        zIndex   : this.style.zIndex,
                        overflowX: this.style.overflowX,
                        overflowY: this.style.overflowY,
                        overflow : this.style.overflow});
	            });

	            this.savedAncestorCSS = ancestorCSS;
	            var parents = this.itemNode.parentsUntil(document.body);
                $.each(parents, function() {
                    $(this).style({'z-index': HighlightBox.kBoxZindex.toString(),
                                  'overflow': 'visible'
                                  }, '', 'important');
                });

                this.itemNode
                    .style(cssBeforeAnimateStyles)
                    .animate(cssAnimateStyles, HighlightBox.kShowBoxSpeed, 'easeOutBack', function() {

                // Once the animation completes, set the new state and emit the ready event.
                _this.state = STATES.READY;
                log.info("hlb ready");
                sitecues.emit('hlb/ready', _this.item);

                // Trigger the background blur effect if there is a highlight box only.
                //  > AM: Added call to cloneNode, so highlight knows the coordinates around which to draw the dimmer (SVG Dimmer approach)
                onHighlightBoxReady($(this));
                backgroundDimmer.dimBackgroundContent(this, totalZoom);
              });

              return false;
            };

            /**
             * Hide the reading box.
             */
            HighlightBox.prototype.deflate = function () {
              if (HighlightBox.isSticky === false) {
                var _this = this;

                // Update state.
                this.state = STATES.DEFLATING;
                sitecues.emit('hlb/deflating', _this.item);

                // Get the current element styles.
  	            var ancestorCSS = this.savedAncestorCSS;
                var parents = this.itemNode.parentsUntil(document.body);
                $.each(parents, function() {
                    var css = ancestorCSS.shift();
                    $(this).style({'z-index'   : css.zIndex,
                                 'overflow-x': css.overflowX,
                                 'overflow-y': css.overflowY,
                                 'overflow'  : css.overflow});
                });
                this.itemNode.style('outline', '0px solid transparent', 'important');

	            var currentStyle = this.savedCss[this.savedCss.length - 1];
                var clientRect = this.item.getBoundingClientRect();

                var cssAnimateStyles = $.extend({}, currentStyle, {
                    position: 'absolute',
                    transform: 'scale(1)',
                    width: clientRect.width / extraZoom,
				    // Don't change height if there's a backgroudn image, otherwise it is destroyed.
				    height: currentStyle.backgroundImage ? currentStyle.height / extraZoom : clientRect.height / extraZoom
                });

                // Deflate the highlight box.
                this.itemNode.animate(cssAnimateStyles, HighlightBox.kHideBoxSpeed , 'easeOutBack', function () {
                  // Cleanup all elements inserted by sitecues on the page.
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
                  onHighlightBoxClosed(_this.item);

                  log.info("hlb closed");
                  sitecues.emit('hlb/closed', _this.item);
              });
              }
            };

            /*
             * Calculate CSS styles to set before inflation animation.
             * @param currentStyle Object
             * @param cssUpdate Object
             * @return Object
             */
            HighlightBox.prototype.getInflateBeforeAnimateStyles = function(currentStyle, cssUpdate) {
                // Fetch the exact value for width(not rounded)
                var clientRect = this.item.getBoundingClientRect();

                var cssBeforeAnimateStyles = {
                        'top': cssUpdate.top + 'px',
                        'left': cssUpdate.left + 'px',
                        '-webkit-transform-origin': '50% 50%',
                        'position': 'absolute',
                        'overflow-y': currentStyle.overflow || currentStyle.overflowY ? currentStyle.overflow || currentStyle.overflowY : 'auto',
                        'overflow-x': 'hidden',
                        // Sometimes width is rounded, so float part gets lost.
                        // Preserve it so that inner content is not rearranged when width is a bit narrowed.
                        'width': parseFloat(clientRect.width) + 2 * parseFloat(HighlightBox.kBoxBorderWidth) + 'px',
                        // Don't change height if there's a background image, otherwise it is destroyed.
                        'height': !isEmptyBgImage(currentStyle.backgroundImage) ? currentStyle.height : 'auto',
                        'z-index': HighlightBox.kBoxZindex.toString(),
                        'border': '0px solid white',
                        'list-style-position': 'inside',
                        'margin': '0',
                        'border-radius': HighlightBox.kBoxBorderRadius,
                        'border-color':  HighlightBox.kBoxBorderColor,
                        'border-style':  HighlightBox.kBoxBorderStyle,
                        'border-width':  HighlightBox.kBoxBorderWidth,
                        'outline':      '0'
                    };
				// Leave some extra space for text, only if there's no background image which is displayed incorrectly in this case.
				if (isEmptyBgImage(currentStyle.backgroundImage)) {
 					cssBeforeAnimateStyles.padding = HighlightBox.kBoxPadding;
 				}

				if (!isEmptyBgImage(currentStyle.backgroundImage)) {
                    cssBeforeAnimateStyles['overflow-y'] = 'hidden';
				} else {
                    cssBeforeAnimateStyles['overflow-y'] = currentStyle.overflow || currentStyle.overflowY ? currentStyle.overflow || currentStyle.overflowY : 'auto';
				}
				if (this.item.tagName.toLowerCase() === 'img') {
					preserveImageRatio(cssBeforeAnimateStyles, cssUpdate, clientRect)
				}

                var oldBgColor = currentStyle['background-color'];
                var oldBgImage = currentStyle['background-image'];
                var newBg = getNewBackground(this.itemNode, oldBgColor, oldBgImage);
                var newBgColor = newBg.bgColor ? newBg.bgColor : oldBgColor;

                // If color and background color are not contrast then either set background image or invert background color.
                if (!isEmptyBgImage(oldBgImage)) {
                    cssBeforeAnimateStyles['background-repeat']   = currentStyle['background-repeat'];
                    cssBeforeAnimateStyles['background-image']    = oldBgImage;
                    cssBeforeAnimateStyles['background-position'] = currentStyle['background-position'];
                    cssBeforeAnimateStyles['background-size']     = clientRect.width + 'px ' + clientRect.height+ 'px';
                    cssBeforeAnimateStyles['background-color']    = common.getRevertColor(newBgColor);

					// If we operate with a 'list-item' then most likely that bg-image represents bullets, so, handle then accordingly.
					if (this.savedCss[0].display === 'list-item' || this.item.tagName.toLowerCase() === 'li') {
                        delete cssBeforeAnimateStyles['background-size'];
					}
                }

				// If background color is not contrast to text color, invert background one.
                var compStyle = this.item.currentStyle || window.getComputedStyle(this.item, null);
				var color = compStyle.getPropertyCSSValue("color");
				var isContrastColors = common.getIsContrastColors(color, newBgColor);
				// We don't know what's the text color in the image.
				if (!isContrastColors || (this.item.tagName.toLowerCase() === 'img')) {
					cssBeforeAnimateStyles['background-color'] = common.getRevertColor(newBgColor);
				} else {
					cssBeforeAnimateStyles['background-color'] = newBgColor;
				}

                return cssBeforeAnimateStyles;
            }

            /* Isolates placeholder logic.
             * Space placeholders prevent content after box from going underneath it. Creates, prepares ans inserts it in the correct place.
             * @param currentStyle Object
             * @param origRectSize Object
             */
            HighlightBox.prototype.prepareAndInsertPlaceholder = function (currentStyle, origRectSize) {

               // Prepare clone element as a clone of the scaled highlight box element.
                var clone = this.item.cloneNode(true),
                    cloneNode = $(clone);
                // Remove all the attributes from the placeholder(clone) tag.
                common.removeAttributes(cloneNode);
               // Clean clone from inner <script> before insertion to DOM
                cloneNode.find('script').remove();
                var colspan = parseInt(this.itemNode.attr('colspan')) || 1;

                // Then, insert placeholder so that content which comes after doesn't move back.
                cloneNode.addClass(HighlightBox.kPlaceHolderClass);
                var styles = $.extend({}, currentStyle, {
                        // Make sure clone display turned to 'block' if it is a tbale cell
                        display: (currentStyle.display.indexOf('table') === 0) ? 'block' : currentStyle.display,
                        visibility: 'hidden',
                        width: parseFloat(origRectSize.width) + 'px',
                        height: origRectSize.height + 'px'
                    });
                cloneNode.style(styles, '', 'important');
				// If this is an ancestor to the table cell which doesn't have colspan.
				var tableCellAncestorParents = getTableCellAncestorParents(this.itemNode);
				if (tableCellAncestorParents && colspan === 1) {
					//cloneNode[0].style.width = 'auto';
				}

			   // If we insert a placeholder with display 'list-item' then ordered list items numbers will be increased.
			   if (cloneNode[0].style.display === 'list-item') {
				  cloneNode.style('display', 'block', '!important');
			   }

               this.itemNode.after(cloneNode);

               return cloneNode;
            };

           /*
            * Table elements require extra work for some cases - especially when table has flexible layout.
            * @param itemNode HTML node Object
            * @param currentStyle Object
            */
           function handleTableElement(itemNode, currentStyle) {
               // To reposition 'table'-like(for example,'td') elements, we need to set the td, tr, tbody, and table to display: block;
                var savedDisplay = currentStyle.display;
				// If the target is <td>, <tr>, <table> or any other table cell element then exit.
                if (savedDisplay.indexOf('table') === 0) {
                    itemNode.style('display', 'block', 'important');
                    return false;
                }

                // If the target is some inner element, like <div> or <p> inside of table cell then
				// handle flexible table width effect dependent of the inner elements.
				var tableCellAncestorParents = getTableCellAncestorParents(itemNode);
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
													- parseFloat(closestStyle['border-left-width'])
													+ 'px';
                        }
                        $(closest).children().wrapAll("<div class='" + HighlightBox.kPlaceHolderWrapperClass + "'></div>");
                        itemNode.style('display', 'block', 'important');
                        $('.'+HighlightBox.kPlaceHolderWrapperClass).style('width', updateInnerElStyle.width, 'important');

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
			function getTableCellAncestorParents(itemNode) {
				var parents = itemNode.parents().andSelf();
				if (parents && parents.length > 0) {
					return parents;
				}
				return false;
			}
 
            /**
             * Get the size and position of the current HLB to inflate.
             * @param selector What element is being positioned
             * @param center   The center over which selector is positioned
             * @param zoom     Zooming the selector element if needed
             * @return cssUpdates An object containing left, top, width and height of the positioned element.
             */
            function getNewRectStyle(selector, center, extraZoom, totalZoom) {
                // Ensure a zoom exists.
                var extraZoom = extraZoom || 1;
                // Use the proper center.
                var centerLeft = center.left;
                var centerTop = center.top;

                // Correctly compute the viewport.
                var viewport = positioning.getViewportDimensions(HighlightBox.kMinDistanceFromEdge, totalZoom);

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
					// AK: leave it in case we get regression bugs. todo: should be removed in future.
                    //cssUpdates.maxHeight = viewport.bottom - positioning.getOffset(jElement).top - 2 * additionalBoxOffset;
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

			// Keep ratio for images
			function preserveImageRatio(cssBeforeAnimateStyles, cssUpdate, clientRect) {
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
             * Get the background value of highlight box when it appears.
             * @param itemNode HTML node Object
             * @param oldBgColor String
             * @param oldBgImage String
             * @return Object
             */
            function getNewBackground(itemNode, oldBgColor, oldBgImage) {
                var bgColorObj = {},
                    bgImageObj = {};
                var parents = itemNode.parents().toArray();
                // Check to see if we have an existing background color
                if (!oldBgColor || $.inArray(oldBgColor, transparentColorNamesSet) >= 0) {
                    // Didn't find an existing background color, so see if a parent has one
                    bgColorObj = getNewBgColor(itemNode, parents);
                }
                // todo: fix list items bullet bg being considered as background image because they are.
                if (!oldBgImage || $(itemNode)[0].tagName.toLowerCase() === 'li' || isEmptyBgImage(oldBgImage)) {
                    bgImageObj = getNewBgImage(parents, itemNode);
                }
                return $.extend({}, bgColorObj, bgImageObj);
            }

            /**
             * Get new background color of highlight box when it appears.
             * Returns the either parent's background color or default one(if we haven't fetched a suitible background color from parent).
             * @param parents Array
             * @return Object
             */
            function getNewBgColor(itemNode, parents) {
                // Set a variable for the default background in case we don't find one.
                var bgColor = HighlightBox.kDefaultBgColor;
				// Special treatment for images since they might have text on transparent background.
				// We should make sure text is readable anyways.
				if (!isEmptyBgImage($(itemNode).css('backgroundImage'))) {
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
                return {'bgColor': bgColor};

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
                            if (!isEmptyBgImage(thisNodeImage)) {
                                // It's an easy case: we just retrieve the parent's background image.
                                bgImage  = thisNodeImage;
                                bgPos    = $(this).css('backgroundPosition');
                                bgRepeat = $(this).css('backgroundRepeat');
                                return false;
                            }
                        }
                    });

                    return {'bgImage': bgImage, 'bgPos': bgPos, 'bgRepeat': bgRepeat};
                }
            }

			/*
			 * Check if current image value is not empty.
			 * @imageValue A string that represents current image value.
			 * @return true if image value contains some not-empty value.
			 */
			function isEmptyBgImage(imageValue) {
				return common.isEmpty(imageValue) || imageValue === 'none';
			}

            return {
                // Return Highlight if need to support a few instances instead.
                createInstance: function (target) {
                    // Don't return an instance if the target is ineligible.
                    // There used to be an isValidTarget function call here,
                    // but that logic already exists in mouse-highlight.  We
                    // should keep that logic in one place and this component
                    // should assume that any target sent to it is valid.
                    return ( target ? new HighlightBox( target ) : null );
                }
            };
        })();

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

        // Performs global clean-up when an instance is closed.
        function onHighlightBoxClosed(hlb) {
            // Unbind!
            $(hlb).off('mousewheel DOMMouseScroll', eventHandlers.wheelHandler);
            $(window).off('keydown', eventHandlers.keyDownHandler);
            // At the current time within the module we need to remove the instance.
            $(hlb).blur();
            instance = null;
            eventHandlers.enableWheelScroll();
        };

        // Handle scroll key events when their target is HLB element or its children.
        function onHighlightBoxReady(hlb) {
            // Then handle special keys such as 'pageup', 'pagedown' since they scroll element and window at the same time.
            // Note: You need to give the div a tabindex so it can receive focus. Otherwise, it will not catch keydown/keyup/keypress event.
            // Alternatively, we can catch the event on document/widnow level.
            // http://stackoverflow.com/questions/1717897/jquery-keydown-on-div-not-working-in-firefox
            $(hlb).focus();
            // Add listener below to correctly handle scroll event(s) if HLB is opened.
            $(hlb).on('mousewheel DOMMouseScroll', {'hlb': hlb}, eventHandlers.wheelHandler);
            $(window).on('keydown', {'hlb': hlb}, eventHandlers.keyDownHandler);
        }

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
        sitecues.on('highlight/animate', function (e) {
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
                    instance = HighlightBox.createInstance(e.dom.mouse_highlight);
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
        sitecues.on('zoom', function (value) {
            updateZoomLevel(value);
        });

        sitecues.on( 'key/esc', function ( event ) {
            instance.deflate();
        } );

        // Lower the threshold when speech is enabled.
        sitecues.on('speech/enable', function(){
            conf.set('highlightBoxMinZoom', 1.00);
            updateZoomLevel(conf.get('zoom'));
        });

        // Revert the threshold when speech is enabled.
        sitecues.on('speech/disable', function(){
            conf.set('highlightBoxMinZoom', kMinHighlightZoom);
            updateZoomLevel(conf.get('zoom'));
        });

        // Now that we have initialized the HLB, update the zoom level, emitting the ON or OFF event.
        updateZoomLevel(conf.get('zoom'));

    });

    // Done.
    callback();
});
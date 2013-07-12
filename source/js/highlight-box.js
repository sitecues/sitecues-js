/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 */
sitecues.def('highlight-box', function (highlightBox, callback, log) {

    // Get dependencies
    sitecues.use('jquery', 'conf', 'cursor', 'util/positioning', 'util/common', 'hlb/event-handlers', 'hlb/designer', 'background-dimmer', 'ui', 'speech',
    function ($, conf, cursor, positioning, common, eventHandlers, designer, backgroundDimmer, ui, speech) {

        // Constants

        // This is the default setting, the value used at runtime will be in conf.
        var kMinHighlightZoom = 1.01;

        var extraZoom = 1.5;

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
        var globalZoom;

        var updateZoomLevel = function (zl) {
            globalZoom = zl;
            updateState();
        };

        var updateState = function() {
          // The HLB is always enabled when TTS is on.
          var newState = (speech.isEnabled() || (globalZoom >= conf.get('highlightBoxMinZoom')) ? STATES.ON : STATES.OFF);
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

            // Constants. NOTE: some of them are duplicated in hlb/designer.js too.
            HighlightBox.kShowBoxSpeed = 300;
            HighlightBox.kHideBoxSpeed = 150;
            HighlightBox.kBoxZindex = 2147483646;
            HighlightBox.kBoxBorderWidth = '3px';
            HighlightBox.kBoxPadding     = '4px';             // Give the text a little extra room
            HighlightBox.kBoxBorderRadius = '4px';
            HighlightBox.kBoxBorderStyle = 'solid';
            HighlightBox.kBoxBorderColor = '#222222';
            HighlightBox.kDefaultBgColor = '#ffffff';
            HighlightBox.kBoxNoOutline   = '0px solid transparent';
            // Space placeholders prevent content after box from going underneath it.
            HighlightBox.kPlaceHolderClass = 'sitecues-eq360-box-placeholder';
            HighlightBox.kPlaceHolderWrapperClass = 'sitecues-eq360-box-placeholder-wrapper';
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
                    cssUpdate = designer.getNewRectStyle(this.itemNode, center, extraZoom, totalZoom);

                // Handle table special behaviour on inner contents.
                designer.handleTableElement(this.itemNode, currentStyle);

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
                        log.info("hlb closed");
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
                    .style(cssBeforeAnimateStyles);
                this.itemNode.animate(cssAnimateStyles, HighlightBox.kShowBoxSpeed, 'easeOutBack', function() {

                // Once the animation completes, set the new state and emit the ready event.
                _this.state = STATES.READY;

                // Trigger the background blur effect if there is a highlight box only.
                // > AM: Added call to cloneNode, so highlight knows the coordinates around which to draw the dimmer (SVG Dimmer approach)
                onHighlightBoxReady($(this));
                backgroundDimmer.dimBackgroundContent(this, totalZoom);
                log.info("hlb ready");
                sitecues.emit('hlb/ready', _this.item);
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
                this.itemNode.style('outline', HighlightBox.kBoxNoOutline, 'important');

	            var currentStyle = this.savedCss[this.savedCss.length - 1];
                var clientRect = this.item.getBoundingClientRect();

                var cssAnimateStyles = $.extend({}, currentStyle, {
                    position: 'absolute',
                    transform: 'scale(1)',
                    width: clientRect.width / extraZoom,
				    // Don't change height if there's a backgroudn image, otherwise it is destroyed.
				    height: currentStyle['background-image'] ? currentStyle.height / extraZoom : clientRect.height / extraZoom
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
                        'overflow-y': currentStyle.overflow || currentStyle['overflow-y'] ? currentStyle.overflow || currentStyle['overflow-y'] : 'auto',
                        'overflow-x': 'hidden',
                        // Sometimes width is rounded, so float part gets lost.
                        // Preserve it so that inner content is not rearranged when width is a bit narrowed.
                        'width': parseFloat(clientRect.width) + 'px',
                        // Don't change height if there's a background image, otherwise it is destroyed.
                        'height' : !common.isEmptyBgImage(currentStyle['background-image']) ? currentStyle.height : 'auto',
                        'z-index': HighlightBox.kBoxZindex.toString(),
                        'border' : HighlightBox.kBoxNoOutline,
                        'list-style-position': 'inside',
                        'margin': '0',
                        'border-radius': HighlightBox.kBoxBorderRadius,
                        'border-color':  HighlightBox.kBoxBorderColor,
                        'border-style':  HighlightBox.kBoxBorderStyle,
                        'border-width':  HighlightBox.kBoxBorderWidth,
                        'outline'     :  HighlightBox.kBoxNoOutline
                    };
				// Leave some extra space for text, only if there's no background image which is displayed incorrectly in this case.
				if (common.isEmptyBgImage(currentStyle['background-image'])) {
 					cssBeforeAnimateStyles.padding = HighlightBox.kBoxPadding;
 				}

				if (!common.isEmptyBgImage(currentStyle['background-image'])) {
                    cssBeforeAnimateStyles['overflow-y'] = 'hidden';
				} else {
                    cssBeforeAnimateStyles['overflow-y'] = currentStyle.overflow || currentStyle['overflow-y'] ? currentStyle.overflow || currentStyle['overflow-y'] : 'auto';
				}
				if (this.item.tagName.toLowerCase() === 'img') {
					designer.preserveImageRatio(cssBeforeAnimateStyles, cssUpdate, clientRect)
				}

                this.setBgStyle(currentStyle, cssBeforeAnimateStyles);

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
                        // Make sure clone display turned to 'block' if it is a table cell
                        display: (currentStyle.display.indexOf('table') === 0) ? 'block' : currentStyle.display,
                        visibility: 'hidden',
                        width: parseFloat(origRectSize.width) + 'px',
                        height: origRectSize.height + 'px'
                    });
                cloneNode.style(styles, '', 'important');
				// If this is an ancestor to the table cell which doesn't have colspan.
				var tableCellAncestorParents = designer.getTableCellAncestorParents(this.itemNode);
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
             * Defines which background suits to HLB & sets it: both background image and color.
             * @param currentStyle Object
             * @param cssBeforeAnimateStyles Object
             */
            HighlightBox.prototype.setBgStyle = function(currentStyle, cssBeforeAnimateStyles) {
                var oldBgColor = currentStyle['background-color'];
                var oldBgImage = currentStyle['background-image'];
                var newBg = designer.getNewBackground(this.itemNode, oldBgColor, oldBgImage);
                var newBgColor = newBg.bgColor ? newBg.bgColor : oldBgColor;
                
                // If color and background color are not contrast then either set background image or invert background color.
                if (!common.isEmptyBgImage(oldBgImage)) {
                    cssBeforeAnimateStyles['background-repeat']   = currentStyle['background-repeat'];
                    cssBeforeAnimateStyles['background-image']    = oldBgImage;
                    cssBeforeAnimateStyles['background-position'] = currentStyle['background-position'];
                    //cssBeforeAnimateStyles['background-size']     = clientRect.width + 'px ' + clientRect.height+ 'px';
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
            }
 
            /**
             * Notify all inputs if zoom in or out.
             * todo: define if we need to leave this code after code transferring to a new event model.
             */
            function notifyZoomInOrOut (element, isZoomIn) {
                var zoomHandler = isZoomIn ? 'zoomin' : 'zoomout';
                element.triggerHandler(zoomHandler);
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
            if (hlb[0].tagName.toLowerCase() == 'input' || hlb[0].tagName.toLowerCase() == 'textarea') {
               $(hlb).focus(); 
            }
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

        sitecues.on('key/esc', function () {
            instance.deflate();
        } );

        // Lower the threshold when speech is enabled.
        sitecues.on('speech/enable', function() {
            conf.set('highlightBoxMinZoom', kMinHighlightZoom);
            updateZoomLevel(conf.get('zoom'));
        });

        // Revert the threshold when speech is enabled.
        sitecues.on('speech/disable', function() {
            conf.set('highlightBoxMinZoom', kMinHighlightZoom);
            updateZoomLevel(conf.get('zoom'));
        });

        // Now that we have initialized the HLB, update the zoom level, emitting the ON or OFF event.
        updateZoomLevel(conf.get('zoom'));
    });

    // Done.
    callback();
});
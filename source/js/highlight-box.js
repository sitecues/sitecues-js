/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 */
sitecues.def('highlight-box', function (highlightBox, callback, log) {

  // Get dependencies
  sitecues.use('jquery', 'conf', 'cursor', 'util/positioning', 'util/common',
    'hlb/event-handlers', 'hlb/designer', 'background-dimmer', 'ui', 'speech',
    'util/close-button', 'platform', 'hlb/style',
  function ($, conf, cursor, positioning, common,
    eventHandlers, designer, backgroundDimmer, ui, speech,
    closeButton, platform, hlbStyle) {

    // Constants

    // This is the default setting, the value used at runtime will be in conf.
    var kMinHighlightZoom = 0.99;
    var kExtraZoom = 1.5;

    // The states that the HLB can be in.
    // TODO: Convert to state instances.
    var STATES = highlightBox.STATES = {
      // The HLB is off. The zoom level of the page is too low to allow for HLB creation.
      OFF: {
        id : 1,
        name : 'off'
      },

      // The HLB is on, and ready to create HLBs.
      ON: {
        id : 2,
        name : 'on'
      },

      // The HLB (instance) has been created and is initializing.
      CREATE: {
        id : 4,
        name : 'create'
      },

      // The HLB (instance) is in the animation phase of inflating.
      INFLATING: {
        id : 8,
        name : 'inflating'
      },

      // The HLB (instance) is inflated and ready for interaction.
      READY: {
        id : 16,
        name : 'ready'
      },

      // The HLB (instance) is in the animation of deflating.
      DEFLATING: {
        id : 32,
        name : 'deflating'
      },

      // The HLB (instance) is closed.
      CLOSED: {
        id : 64,
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
      sitecues.emit('hlb/' + state.name, highlightBox, {});
      }
    };

    // Current highlight box instance, only work with it. There can only be one instance in the system
    // that is not in the CLOSED state, and that instance will be referenced by 'instance'
    var instance = null;

    // Returns the state of the highlight box module. If there is no instance, use the global state.
    var getState = highlightBox.getState = function() {
      return (instance ? instance.getState() : state);
    };

    // Returns the state of the highlight box module. If there is no instance, use the global state.
    var getCurrentTarget = highlightBox.getCurrentTarget = function() {
      return (instance ? instance.item : null);
    };

    // todo: take out common things like these below into general sitecues file which is loaded before any other file starts loading.
    // Add easing function for box open animation, to create bounce-back effect
    $.extend($['easing'], {   // From http://stackoverflow.com/questions/5207301
      easeOutBack: function (x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
      }
    });

    // Create the close button shared across HLBs.
    var hlbCloseButton = closeButton.create(function() {
      sitecues.emit('highlight/animate', {});
    });

    sitecues.on('hlb/deflating', function() {
      hlbCloseButton.disable();
    });

    // Display the close button.
    // AK: I have no idea what is the value of closeButtonInset, I just add a random value -
    // to exclude exception closeButtonInset throws "ReferenceError: closeButtonInset is not defined"
    var closeButtonInset = 5;
    var displayCloseButton = function(hlbTarget, totalZoom) {
      var hlbNode = $(hlbTarget);
      var hlbBorderWidth = parseFloat(hlbNode.css('borderWidth')) || 0;
      var boundingBox = positioning.getBoundingBox(hlbTarget);
      var left = ((boundingBox.left  + hlbBorderWidth) * totalZoom) + closeButtonInset;
      var top  = ((boundingBox.top   + hlbBorderWidth) * totalZoom) + closeButtonInset;

      closeButton.enable(left, top);
    };

    var HighlightBox = (function () {
      // Constructor: Initialize HLB.
      function HighlightBox(target, options) {
        this.initHLBValues(target, options);
        // Notify about new HLB
        sitecues.emit('hlb/create', this.item, $.extend(true, {}, this.options));

        // Temp values.
        this.computedStyles  = common.getElementComputedStyles(this.item);
        var computedStyles = this.computedStyles; // a bit shorter alias
        var offset = positioning.getOffset(this.item);
        var width = (computedStyles.width === 'auto' || computedStyles.width === '') ? this.$item.width() : computedStyles.width;
        var height = (computedStyles.height === 'auto' || computedStyles.height === '') ? this.$item.height() : computedStyles.height;
        var size = { width: parseFloat(width), height: parseFloat(height) };

        this.fillHLBValues(offset, size);
      }

      HighlightBox.prototype.initHLBValues = function(target, options) {
        this.options = $.extend(true,
            {'needsCompensation': true,
                'isChrome': platform.browser.isChrome,
            }, options);
        this.state = STATES.CREATE;
        this.savedCss = [];
        this.savedStyleAttr = {};
        this.origRectDimensions = [];
        this.item = target; // Need to know when we have box for checking mouse events before closing prematurely
        this.$item = $(this.item);
      };

      HighlightBox.prototype.fillHLBValues = function(offset, size) {
        this.origRectDimensions.push($.extend(offset, size)); // Only numeric values, useful for calculations
        this.clientRect = positioning.getSmartBoundingBox(this.item);
        this.boundingBoxes = designer.getBoundingElements(this.item);
        this.compensateShift = designer.getShift(this.$item, this.boundingBoxes, this.computedStyles);
        this.savedCss.push(this.computedStyles);
        this.saveAttrs(['style', 'width', 'height']);
      };

      /**
       * List of attributes we save original values for because we might want to redefine them later.
       * @returns {undefined}
       */
      HighlightBox.prototype.saveAttrs = function(attrsList) {
        for(var key in attrsList) {
            var attr = attrsList[key];
            this.savedStyleAttr[attr] = this.$item.attr(attr);
        }
      };

      // Constants. NOTE: some of them are duplicated in hlb/designer.js too.
      HighlightBox.kShowBoxSpeed = 400;
      HighlightBox.kHideBoxSpeed = 150;
      HighlightBox.kShowAnimationSchema = 'easeOutBack';
      HighlightBox.kHideAnimationSchema = 'linear';
      HighlightBox.kBoxZindex = 2147483644;
      HighlightBox.isSticky = false;
      HighlightBox.kPlaceHolderWrapperClass = 'sitecues-eq360-box-placeholder-wrapper';

      /**
       * Toggle Sticky state of highlight box
       */
      sitecues.toggleStickyHLB = function () {
        HighlightBox.isSticky = !HighlightBox.isSticky;
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
        sitecues.emit('hlb/inflating', this.item, $.extend(true, {}, this.options));

        var _this = this;

        // Get the current element styles.
        
        // *** #1 Calculate cssBeforeAnimateStyles ***
        
        var currentStyle = this.savedCss[this.savedCss.length - 1],
            center  = positioning.getCenterForActualElement(this.item, conf.get('zoom')),
            totalZoom = positioning.getTotalZoom(this.item, true),
            cssUpdate = designer.getNewRectStyle(this.$item, currentStyle, center, kExtraZoom);

        // Handle table special behaviour on inner contents.
//        designer.handleTableElement(this.$item, currentStyle);

        var cssBeforeAnimateStyles = hlbStyle.getCssBeforeAnimateStyles(this, currentStyle, cssUpdate);
        // Anything on the module namespace will be available in the customization file.
        _this.cssBeforeAnimateStyles = cssBeforeAnimateStyles;
        sitecues.emit('hlb/animation/styles', _this, $.extend(true, {}, _this.options));
        // Only animate the most important values so that animation is smoother
        
        // *** #2 Calcualte cssAnimateStyles ***
        var cssAnimateStyles = hlbStyle.getCssAnimateStyles(kExtraZoom);

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
            sitecues.emit('hlb/closed', _this.item, $.extend(true, {}, _this.options));
          }
        }, HighlightBox.kShowBoxSpeed + 100);

        // Animate HLB (keep in mind $.animate() is non-blocking).
        var ancestorCSS = [ ];
        var parents = this.$item.parentsUntil(document.body);
        $.each(parents, function () {
          ancestorCSS.push({
            zIndex   : this.style.zIndex,
            overflowX: this.style.overflowX,
            overflowY: this.style.overflowY,
            overflow : this.style.overflow});
        });

        this.savedAncestorCSS = ancestorCSS;
        $.each(parents, function() {
          $(this).style({'z-index': HighlightBox.kBoxZindex.toString(),
                  'overflow': 'visible'
                  }, '', 'important');
        });

        // If website uses width/height attributes let's remove those while HLB is inlated.
        if (!common.isCanvasElement(this.$item)) {
            if (cssBeforeAnimateStyles.height || cssBeforeAnimateStyles.width) {
              for (var attrName in this.savedStyleAttr) {
                if (attrName === 'style') {
                  continue;
                }
                if (this.savedStyleAttr[attrName] && this.savedStyleAttr[attrName] !== 0) {
                  this.$item.removeAttr(attrName);
                }
              }
            }
        } else {
            delete cssBeforeAnimateStyles.width;
            delete cssBeforeAnimateStyles.height;
            // todo: remove this awful hardcode
            cssBeforeAnimateStyles['background-color'] = 'rgb(173, 172, 167)';
        }

        // Since jQuery animate doesn't understand 'important' then do:
        // - remove properties having 'important' priority animation is going to override;
        // - set non-important property with the same value it used to have.
        var styleObj = this.$item[0].style;
        for (var prop in cssAnimateStyles) {
          //first check that both of these objects has the property we are interested in
          if (cssBeforeAnimateStyles.hasOwnProperty(prop) && cssAnimateStyles.hasOwnProperty(prop)) {
            styleObj.removeProperty(prop);
            this.$item[0].style.setProperty(prop, cssBeforeAnimateStyles[prop], null);
          }
        }

        // todo: use '$.style' instead of '$.css'
        this.$item.css(cssBeforeAnimateStyles);
        this.$item.animate(cssAnimateStyles, HighlightBox.kShowBoxSpeed, HighlightBox.kShowAnimationSchema, function() {
          // Once the animation completes, set the new state and emit the ready event.
          _this.state = STATES.READY;

          // Trigger the background blur effect if there is a highlight box only.
          // > AM: Added call to cloneNode, so highlight knows the coordinates around which to draw the dimmer (SVG Dimmer approach)
          onHighlightBoxReady($(this));
          backgroundDimmer.dimBackgroundContent(this, totalZoom);
          if (_this.options.close_button) {
            displayCloseButton(_this.item, totalZoom);
          }

          log.info("hlb ready");
          sitecues.emit('hlb/ready', _this.item, $.extend(true, {}, _this.options));
          // Update the dimensions object.
          _this.clientRect = positioning.getSmartBoundingBox(_this.item);
        });

        if (this.options.isChrome
            && this.options.needsCompensation
            && !isFloated) {
          var roundingsStyle = designer.getRoudingsOnZoom(this.item, this.boundingBoxes, currentStyle, this.compensateShift);
          this.$item.css(roundingsStyle);
        }

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
        sitecues.emit('hlb/deflating', _this.item, $.extend(true, {}, _this.options));

        // Get the current element styles.
          var ancestorCSS = this.savedAncestorCSS;
        var parents = this.$item.parentsUntil(document.body);
        $.each(parents, function() {
          var css = ancestorCSS.shift();
          $(this).style({'z-index'   : css.zIndex,
                 'overflow-x': css.overflowX,
                 'overflow-y': css.overflowY,
                 'overflow'  : css.overflow});
        });
        this.$item.style('outline', hlbStyle.kBoxNoOutline, 'important');

        var currentStyle = this.savedCss[this.savedCss.length - 1],
            clientRect;
        
        try { //Required for FF
          clientRect = positioning.getSmartBoundingBox(this.item);
          if (!clientRect) {
            clientRect = positioning.getBoundingBox(this.item); 
          }
        } catch(e) {
          clientRect = positioning.getBoundingBox(this.item);
        }
        var cssBeforeAnimateStyles = getCorrectedDeflateStyle(currentStyle);
        var cssAnimateStyles = {
                'webkit-transform': 'scale(1)',
                '-moz-transform': 'scale(1)',
                '-o-transform': 'scale(1)',
                '-ms-transform': 'scale(1)',
                'transform': 'scale(1)'
        };

        if (!common.isCanvasElement(this.$item)) { 
//            $.extend(cssAnimateStyles, {
//                'width': clientRect.width / kExtraZoom,
//                // Don't change height if there's a background image, otherwise it is destroyed.
//                'height': !common.isEmptyBgImage(currentStyle['background-image'])
//                    ? parseFloat(currentStyle.height) + 'px' / kExtraZoom
//                    : clientRect.height / kExtraZoom + 'px'
//            });
        }

        // Deflate the highlight box.
        this.$item.css(cssBeforeAnimateStyles);
        this.$item.animate(cssAnimateStyles, HighlightBox.kHideBoxSpeed , HighlightBox.kHideAnimationSchema, function () {
          // Cleanup all elements inserted by sitecues on the page.
          if ($('.' + HighlightBox.kPlaceHolderWrapperClass).length > 0) {
            // Remove placeholder wrapper element if the table child highlighted.
            $('.' + HighlightBox.kPlaceHolderWrapperClass)
              .children()
              .unwrap("<div class='" + HighlightBox.kPlaceHolderWrapperClass + "</div>");
          }

          backgroundDimmer.removeDimmer();
          setTimeout(function () {
            // Animation callback: notify all inputs about zoom out.
            // We should do this with next tick to allow handlers catch right scale level.
            notifyZoomInOrOut(_this.$item, false);
          }, 0);

          // If website used to have width/height attributes let's restore those while HLB is defalted.
          for (var attrName in _this.savedStyleAttr) {
            if (attrName === 'style') {
               _this.$item.removeAttr('style');
            }
            if (!common.isCanvasElement(_this.$item)) {
                if (_this.savedStyleAttr[attrName] && _this.savedStyleAttr[attrName] !== 0) {
                  _this.$item.attr(attrName, _this.savedStyleAttr[attrName]);
                }
            }
          }
          // This instance is now officially closed.
          _this.state = STATES.CLOSED;

          // Call the module method to clean up after close BEFORE calling listeners.
          onHighlightBoxClosed(_this.item);

          log.info("hlb closed");
          sitecues.emit('hlb/closed', _this.item, $.extend(true, {}, _this.options));
        });
        }
      };
        function getCorrectedDeflateStyle(currentStyle) {
            var correctedStyle = {
                // HLB styles.
                'position': 'relative',
                'background-color': currentStyle.backgroundColor,
                'padding': currentStyle.padding,
                'border': currentStyle.border,
                'border-radius': currentStyle.borderRadius
            }
           return correctedStyle;
        }

      /*
       * Defines which background suits to HLB & sets it: both background image and color.
       * @param currentStyle Object
       * @param cssBeforeAnimateStyles Object
       */
      HighlightBox.prototype.setBgStyle = function(currentStyle, cssBeforeAnimateStyles) {
        var oldBgColor = currentStyle['background-color'];
        var oldBgImage = currentStyle['background-image'];
        var newBg = designer.getNewBackground(this.$item, oldBgColor, oldBgImage);
        var newBgColor = newBg.bgColor ? newBg.bgColor : oldBgColor;
        
        // If color and background color are not contrast then either set background image or invert background color.
        if (!common.isEmptyBgImage(oldBgImage)) {
          cssBeforeAnimateStyles['background-repeat']   = currentStyle['background-repeat'];
          cssBeforeAnimateStyles['background-image']  = oldBgImage;
          cssBeforeAnimateStyles['background-position'] = currentStyle['background-position'];
          //cssBeforeAnimateStyles['background-size']   = this.clientRect.width + 'px ' + this.clientRect.height+ 'px';
          cssBeforeAnimateStyles['background-color']  = common.getRevertColor(newBgColor);
          
          // If we operate with a 'list-item' then most likely that bg-image represents bullets, so, handle then accordingly.
          if (this.savedCss[0].display === 'list-item' || this.item.tagName.toLowerCase() === 'li') {
            delete cssBeforeAnimateStyles['background-size'];
          }
        }
        
        // If background color is not contrast to text color, invert background one.
        var color = designer.getCurrentTextColor(this.item);
        var isContrastColors = common.getIsContrastColors(color, newBgColor);
        // EQ-1011: always use black for images.
        if (this.item.tagName.toLowerCase() === 'img') {
          cssBeforeAnimateStyles['background-color'] = '#000';
          return;
        }
        if (!isContrastColors && common.isCanvasElement(this.$item)) {
          // Favor a white background with dark text when original background was white.
          if (common.isLightTone(newBgColor)) {
            newBgColor = 'rgb(255, 255, 255)';
            cssBeforeAnimateStyles['color'] = common.getRevertColor(color);
          }
        }
        
        cssBeforeAnimateStyles['background-color'] = newBgColor;
        return;
      }
 
        // Those objects are sared across the file so do not make them local.
        var isFloated = false;

        /** 
         * Ley's define if there any interesting floats:
         * topLeft, topRight then change the dimensions.
         * See example below:
         *  -------------------------
         *  |          |// - 1 -//|  |
         *  |          |//////////|  |
         *  |                        |
         *  |     - 2 -              |
         *  -------------------------
         *  wrapping element contains 2 blocks:
         *  #1 is the interesting floating
         *  #2 is the text which floats #1, we inflate it and need to
         *  re-calculate its values: top, width, height etc.
         *  @return floatRectHeight The shift height value produces by floating elements.
         */
        function setStyleForInterestingFloatings(cssBeforeAnimateStyles, currentStyle) {
            var floatRectHeight = 0;
            // This magic values comes from mh.js: floatRectForPoint which calls geo.expandOrContractRect().
            var delta = 14; 
            var floatRects = conf.get('floatRects'); // See mouse-highlight.js
            var floatRectsKeys = Object.keys(floatRects);

            for (var index in floatRectsKeys) {
                var innerKeys = floatRects[floatRectsKeys[index]];
                // todo: fix the dirty trick for #eeoc.
                if (innerKeys && Object.keys(innerKeys).length > 0) {
                    isFloated = true;
                    var oldHeight = parseFloat(cssBeforeAnimateStyles.height);
                    // Current element's area(width * height)
                    var fullSpace = parseFloat(currentStyle.width) * parseFloat(currentStyle.height);
                    // Floating element's area(width * height)
                    var innerSpace = innerKeys? (innerKeys.width - delta) * (innerKeys.height - delta): 0;
                    // Substract floated element's space from the full area.
                    var clippedSpace = fullSpace - innerSpace;

                    // Update position.
                    var interestingFloatingHeight  = (innerKeys && innerKeys.height) || 0;
                    var currentPosTop = (cssBeforeAnimateStyles.top && parseFloat(cssBeforeAnimateStyles.top)) || 0;
                    cssBeforeAnimateStyles.top = currentPosTop - interestingFloatingHeight;
                    // The width is expanded, so height has some extra-space. Let's cut it out!
                    cssBeforeAnimateStyles.height = innerKeys? clippedSpace / parseFloat(cssBeforeAnimateStyles.width) + 'px': conf.get('absoluteRect').height;
                    // Difference between original height and the new one.
                    var heightDiff  = oldHeight - parseFloat(cssBeforeAnimateStyles.height);
                    floatRectHeight = interestingFloatingHeight - heightDiff;
                }
             }
             return floatRectHeight;
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
        createInstance: function (target, options) {
          // Don't return an instance if the target is ineligible.
          // There used to be an isValidTarget function call here,
          // but that logic already exists in mouse-highlight.  We
          // should keep that logic in one place and this component
          // should assume that any target sent to it is valid.
          return ( target ? new HighlightBox(target, options) : null );
        }
      };
    })();

    // Take care on target change event.
    function onTargetChange(newTarget) {
      if (getState() === STATES.READY) { // if something is ready
        if (!instance.options.suppress_mouse_out) {
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
    }

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
    sitecues.on('highlight/animate', function (e) {
      var currentState = getState();
      var hlbOptions = e.hlb_options || {};
      if (currentState === STATES.READY) {
        // An HLB instance exists and is inflated, so deflate it.
        instance.deflate();
      } else if ((currentState === STATES.ON) || ((currentState === STATES.OFF) && hlbOptions.force)) {
        // There is no current HLB and we can create one, so do just that.
        // If the target element is ineligible, the create request may return null.
        instance = HighlightBox.createInstance(e.dom.hlb_target || e.dom.mouse_highlight, hlbOptions);
        if (instance) {
          instance.inflate();
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
    });

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

    // Done.
    callback();
  });
});
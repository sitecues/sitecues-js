/**
 * Smooth zoom
 * See docs at https://equinox.atlassian.net/wiki/display/EN/Smooth+Zoom
 */

sitecues.def('zoom', function (zoom, callback) {

  'use strict';

  sitecues.use('jquery', 'conf', 'platform', 'util/common',
    function ($, conf, platform, common) {
      if (window !== window.top) {
        // TODO we might want to put in a rule like this for all of sitecues
        return; // Only zoom top level window so that we do not double zoom iframes
      }
      var
        // Default zoom configuration
        // Can be customized via zoom.provideCustomConfig()
        zoomConfig = {
          // Should smooth zoom animations be enabled?
          shouldSmoothZoom: true,

          // Does the web page use a fluid layout, where content wraps to the width?
          isFluid: undefined, // Can override in site preferences

          // Should the width of the page be restricted as zoom increases?
          // This is helpful for pages that try to word-wrap or use a fluid layout.
          // Eventually use fast page health calculation to automatically determine this
          // Assumes window width of 1440 (maximized screen on macbook)
          maxZoomToRestrictWidthIfFluid: 1.35,

          // Set to 5 on sites where the words get too close to the left window's edge
          leftMarginOffset: 2
        },

        // Body-related
        body,
        $body,
        originalBodyInfo,        // The info we have on the body, including the rect and mainNode

        // Key frame animations
        $zoomStyleSheet,                 // <style> element we insert for animations (and additional fixes for zoom)

        // Zoom operation state
        minZoomChangeTimer,      // Keep zooming at least for this long, so that a glide does a minimum step
        zoomAnimator,            // Frame request ID that can be cancelled
        completedZoom = 1,       // Current zoom as of the last finished operation
        currentTargetZoom = 1,   // Zoom we are aiming for in the current operation
        startZoomTime,           // If no current zoom operation, this is cleared (0 or undefined)
        isInitialLoadZoom,       // Is this the initial zoom for page load? (The one based on previous user settings)
        nativeZoom,              // Amount of native browserZoom
        isRetinaDisplay,         // Is the current display a retina display?

        // Zoom slider change listener
        glideChangeListener,    // Supports a single listener that is called back as animation proceeds
        glideChangeTimer,       // Timer used for callbacks
        GLIDE_CHANGE_INTERVAL_MS = 30,  // How often to call back with a new zoom value

        // Metrics info
        zoomInput = {},

        // State to help with animation optimizations and will-change
        zoomBeginTimer, // Timer before zoom can actually begin (waiting for browser to create composite layer)
        clearAnimationOptimizationTimer,   // Timer to clear will-change when zoom is finished
        isPanelOpen,   // True if the panel is open

        // Should document scrollbars be calculated by us?
        // Should always be true for IE, because it fixes major positioning bugs
        shouldManuallyAddScrollbars = platform.browser.isIE,

        // Should we repaint when zoom is finished (after any animations)?
        // Should always be true in Chrome, because it makes text crisper
        // Don't use backface repainting method if there is a background-image on the <body>, because it will be erased.
        // (We still want to use the backface method when we can, because it often produces better results than our
        // other method, which is to overlay a transparent div and then remove it)
        shouldRepaintOnZoomChange = platform.browser.isChrome,
        shouldUseBackfaceRepaint = shouldRepaintOnZoomChange && $(body).css('backgroundImage') !== 'none',
        REPAINT_FOR_CRISP_TEXT_MS = 15,

        // Optimize fonts for legibility? Helps a little bit with Chrome on Windows
        shouldOptimizeLegibility = platform.browser.isChrome && platform.os.isWin,

        // Native form control CSS fix -- automagically fixes the form appearance issues in Chrome when zooming
        shouldFixNativeFormAppearance =  platform.browser.isWebKit && platform.os.isMac,

        // Constants
        MIN_ZOOM_PER_CLICK = 0.20,  // Change zoom at least this amount if user clicks on A button or presses +/-
        MS_PER_X_ZOOM_NORMAL = 1400, // For animations, the number of milliseconds per unit of zoom (e.g. from 1x to 2x)
        MS_PER_X_ZOOM_SLIDER = 500,
        ZOOM_PRECISION = 3, // Decimal places allowed
        SITECUES_ZOOM_ID = 'sitecues-zoom',
        ANIMATION_END_EVENTS = 'animationend webkitAnimationEnd MSAnimationEnd',
        MIN_RECT_SIDE = 4,
        ANIMATION_OPTIMIZATION_SETUP_DELAY = 100,   // Provide extra time to set up compositor layer if a key is pressed
        IS_WILL_CHANGE_SUPPORTED = typeof document.body.style.willChange === 'string',
        CLEAR_ANIMATION_OPTIMIZATION_DELAY = 7000;  // After zoom, clear the will-change property if no new zoom occurs within this amount of time

      // ------------------------ PUBLIC -----------------------------

      // Values used for zoom math
      // TODO should these be getters? Doing it via direct access variables is legacy.
      zoom.max = 3;
      zoom.min = 1;
      zoom.step = 0.01;
      zoom.range = zoom.max - zoom.min;

      // Is this the zoom that occurs on page load?
      zoom.getIsInitialZoom = function() {
        return isInitialLoadZoom;
      };

      // Allow customization of zoom configuration on a per-website basis
      zoom.provideCustomZoomConfig = function(customZoomConfig) {
        $.extend(zoomConfig, customZoomConfig);
      };

      // Use to jump the current zoom immediately to the targetZoom requested
      // The use case for this is currently the zoom slider
      zoom.jumpTo = function(targetZoom) {
        var shouldPerformContinualUpdates = !shouldFixFirefoxScreenCorruptionBug();
        if (!isZoomOperationRunning()) {
          // 1st call -- we will glide to it, it may be far away from previous zoom value
          beginZoomOperation(targetZoom, {isSlider: true}); // Get ready for more slider updates
          if (shouldPerformContinualUpdates && targetZoom !== completedZoom) {
            performJsAnimateZoomOperation();
            if (glideChangeListener) {
              glideChangeTimer = setInterval(onGlideChange, GLIDE_CHANGE_INTERVAL_MS);
            }
          }
        }
        else {
          if (!zoomInput.isSliderDrag) {
            // 2nd call -- cancel glide and begin continual updates
            cancelFrame(zoomAnimator);
            cancelGlideChangeTimer();
            zoomInput.isSliderDrag = true;
            if (shouldPerformContinualUpdates) {
              zoomAnimator = requestFrame(performContinualZoomUpdates);
            }
          }
          // 3rd and subsequent calls, just update the target zoom value
          // so that the continual update loop uses the new value
          currentTargetZoom = getSanitizedZoomValue(targetZoom); // Change target
        }

        if (!shouldPerformContinualUpdates) {
          performInstantZoomOperation();
        }
      };

      // Retrieve and store whether the current window is on a Retina display
      zoom.isRetina = function() {
        if (typeof isRetinaDisplay !== 'undefined') {
          return isRetinaDisplay;
        }

        isRetinaDisplay = false;

        // Safari doesn't alter devicePixelRatio for native zoom
        if (platform.browser.isSafari) {
          isRetinaDisplay = devicePixelRatio === 2;
        }
        else if (platform.browser.isChrome) {
          isRetinaDisplay = Math.round(devicePixelRatio / zoom.getNativeZoom()) === 2;
        }
        else if (platform.browser.isFirefox) {
          // This is only a guess, unfortunately
          // The following devicePixelRatios can be either on a retina or not:
          // 2, 2.4000000953674316, 3
          // Fortunately, these would correspond to a relatively high level of zoom on a non-Retina display,
          // so hopefully we're usually right (2x, 2.4x, 3x)
          // We can check the Firefox zoom metrics to see if they are drastically different from other browsers.
          isRetinaDisplay = devicePixelRatio >= 2;
        }
        return isRetinaDisplay;
      };

      // Retrieve and store the amount of native browser zoom
      zoom.getNativeZoom = function() {
        if (nativeZoom) {
          return nativeZoom; // We already know it
        }
        nativeZoom = 1;
        if (platform.browser.isWebKit) {
          nativeZoom = window.outerWidth / window.innerWidth;
        }
        else if (platform.browser.isIE) {
          nativeZoom = screen.deviceXDPI / screen.systemXDPI;
        }
        else if (platform.browser.isFirefox) {
          // Since isRetina() is not 100% accurate, neither will this be
          nativeZoom = zoom.isRetina() ? devicePixelRatio / 2 : devicePixelRatio;
        }

        SC_DEV && console.log('*** Native zoom: ' + nativeZoom);

        return nativeZoom;
      };

      // This is the body's currently visible width, with zoom factored in
      zoom.getBodyWidth = function() {
       // Use the originally measured visible body width
       initZoomModule();

       // If width was restricted
       var divisorUsedToRestrictWidth = shouldRestrictWidth() ? getZoomForWidthRestriction(completedZoom, window.innerWidth) : 1

        // Multiply be the amount of zoom currently used
       return completedZoom * originalBodyInfo.width / divisorUsedToRestrictWidth;
      };

      zoom.getBodyRight = function() {
        initZoomModule();

        return originalBodyInfo.right * completedZoom;
      };

      zoom.getCompletedZoom = function() {
        return completedZoom;
      };

      // Add a listener for mid-animation zoom updates.
      // These occur when the user holds down A, a, +, - (as opposed to conf.set and the 'zoom' event which occur at the end)
      // Currently only supports one listener.
      zoom.setGlideChangeListener = function (listener) {
        glideChangeListener = listener;
      };

      // ------------------------ PRIVATE -----------------------------

      // Continual slider updates
      // This matches our updates with screen refreshes.
      // Unfortunately, it causes issues in some older versions of Firefox on Mac + Retina.
      function performContinualZoomUpdates() {
        zoomAnimator = requestFrame(performContinualZoomUpdates);
        performInstantZoomOperation();
        completedZoom = currentTargetZoom;
      }

      function finishZoomSliderOperation() {
        if (zoomInput.isSliderDrag || !shouldSmoothZoom) {
          // Was dragging the slider
          finishZoomOperation();
        }
        // Else is in the middle of gliding to a zoom click -- let it finish --
        // the animation's end will cause finishZoomOperation() to be called
      }

      // Should smooth zoom be used or step zoom?
      // In dev, we can override as follows:
      // Shift-key: Script-based smooth zoom
      // Ctrl-key: CSS-based smooth zoom
      function shouldSmoothZoom() {
        if (SC_DEV && (zoomInput.shiftKey || zoomInput.ctrlKey)) {
          return true; // Dev override -- use animation no matter what
        }

        if (shouldFixFirefoxScreenCorruptionBug()) {
          return false;
        }

        return zoomConfig.shouldSmoothZoom;
      }

      // If smooth zoom is used, which kind -- JS or CSS keyframes?
      // In dev, we can override default behavior as follows:
      // Shift-key: Script-based
      // Ctrl-key: CSS-based
      function shouldUseKeyFramesAnimation() {
        if (SC_DEV) {
          // In dev, allow overriding of animation type
          if (zoomInput.shiftKey) {
            return false; // Use JS-based animation
          }
          else if (zoomInput.ctrlKey) {
            return true;
          }
        }

        return shouldSmoothZoom()
          // IE9 just can't do CSS animate
          && (!platform.browser.isIE || platform.browser.version > 9)
          // Safari is herky jerky if animating the width and using key frames
          // TODO fix initial load zoom with jsZoom -- not doing anything
          && (!platform.browser.isSafari || !shouldRestrictWidth())
          // Chrome has jerk-back bug on Retina displays so we should only do it for initial zoom
          // which has an exact end-of-zoom,and really needs key frames during the initial zoom which is
          // stressing the browser because it's part of the critical load path.
          && (!platform.browser.isChrome || isInitialLoadZoom || zoomInput.isSlider || !zoom.isRetina() || shouldRestrictWidth());
      }

      // Should we wait for browser to create compositor layer?
      function shouldPrepareAnimations() {
        // In case zoom module isn't initialized yet, safely provide 'body' in local scope.
        var body = body || document.body;
        return IS_WILL_CHANGE_SUPPORTED
          && body.style.willChange === '' // Animation property not set yet: give browser time to set up compositor layer
          && !shouldRestrictWidth();
      }

      // Avoid evil Firefox insanity bugs, where zoom animation jumps all over the place on wide window with Retina display
      function shouldFixFirefoxScreenCorruptionBug() {
        return platform.browser.isFirefox && platform.browser.version < 33 && zoom.isRetina() &&
          window.outerWidth > 1024;
      }

      function shouldRestrictWidth() {
        return zoomConfig.isFluid;
      }

      // Make sure the zoom value is within the min and max, and does not use more decimal places than we allow
      function getSanitizedZoomValue(value) {
        value = parseFloat(value);

        // value is too small
        if (!value || value < zoom.min) {
          return zoom.min;
        }

        // value is too big
        if (value > zoom.max){
          return zoom.max;
        }

        // value have float value
        return parseFloat(value.toFixed(ZOOM_PRECISION));
      }

      // Begin an operation to the glide toward the current zoom, if smooth zoom is currently supported.
      // If no smooth zoom, apply an instant zoom change to increase or decrease zoom by a constant amount.
      // If we are zooming with +/- or clicking A/a
      function beginGlide(targetZoom, event) {
        if (!isZoomOperationRunning() && targetZoom !== completedZoom) {
          var input = {};
          if (event) {
            if (event.keyCode) {
              //input.isKey = true;
              //input.isBrowserZoomKeyOverride = (event.ctrlKey || event.metaKey)
              input.shiftKey = event.shiftKey;
              input.ctrlKey = event.ctrlKey;
            }
//            else {
//              input.isAButtonPress = true;
//            }
          }

          if (!shouldSmoothZoom()) {
            beginZoomOperation(targetZoom, input);
            // Instant zoom
            if (event) {
              // When no animations and key/button pressed -- just be clunky and zoom a bit closer to the target
              var delta = completedZoom < targetZoom ? MIN_ZOOM_PER_CLICK : -MIN_ZOOM_PER_CLICK;
              currentTargetZoom = getSanitizedZoomValue(completedZoom + delta);
            }
            performInstantZoomOperation();
            finishZoomOperation();
            return;
          }

          input.isLongGlide = true; // Default, assume glide will not be cut off early
          beginZoomOperation(targetZoom, input, beginGlideAnimation);  // Provide callback for when animation can actually start
          $(window).one('keyup', finishGlideIfEnough);
        }

        function beginGlideAnimation() {
          if (glideChangeListener) {
            glideChangeTimer = setInterval(onGlideChange, GLIDE_CHANGE_INTERVAL_MS);
          }

          if (!zoomInput.isLongGlide) {
            // Button/key was already released, zoom only for long enough to get minimum zoom
            var delta = completedZoom < targetZoom ? MIN_ZOOM_PER_CLICK : -MIN_ZOOM_PER_CLICK;
            currentTargetZoom = getSanitizedZoomValue(completedZoom + delta);
            minZoomChangeTimer = setTimeout(finishZoomOperation, MIN_ZOOM_PER_CLICK * getMsPerXZoom());
          }


          if (shouldUseKeyFramesAnimation()) {
            SC_DEV && console.log('Begin keyframes zoom');
            performKeyFramesZoomOperation();
          }
          else {
            SC_DEV && console.log('Begin JS zoom');
            performJsAnimateZoomOperation();
          }

        }
      }

      function getMsPerXZoom() {
        return zoomInput.isSlider ? MS_PER_X_ZOOM_SLIDER : MS_PER_X_ZOOM_NORMAL;
      }

      // Get what the zoom value would be if we stopped the animation now
      function getMidAnimationZoom() {
        var totalZoomChangeRequested = Math.abs(currentTargetZoom - completedZoom),
          zoomDirection = currentTargetZoom > completedZoom ? 1 : -1,
          zoomChange = getZoomOpElapsedTime() / getMsPerXZoom();
        if (zoomChange > totalZoomChangeRequested) {
          zoomChange = totalZoomChangeRequested;
        }
        return getSanitizedZoomValue(completedZoom + zoomDirection * zoomChange);
      }

      // Helper for calling back glide change listener
      function onGlideChange() {
        glideChangeListener(getMidAnimationZoom());
      }

      // How many milliseconds have elapsed since the start of the zoom operation?
      function getZoomOpElapsedTime() {
        return Date.now() - startZoomTime;
      }

      // When an A button or +/- key is pressed, we always glide at least MIN_ZOOM_PER_CLICK.
      // This provides a consistent amount of zoom change for discrete presses.
      function finishGlideIfEnough() {
        if (!isZoomOperationRunning()) {
          return;
        }

        if (!isGlideCurrentlyRunning()) {
          // Glide has started, but animation hasn't started yet -- we are waiting for
          // the ANIMATION_OPTIMIZATION_SETUP_DELAY period while the browser sets up for the animation.
          zoomInput.isLongGlide = false;  // beginGlideAnimation() will see this and setup it's own timer
          return;
        }

        // If MIN_ZOOM_PER_CLICK has not been reached, we set a timer to finish the zoom
        // based on how much time would be needed to achieve MIN_ZOOM_PER_CLICK
        var timeElapsed = getZoomOpElapsedTime(),
          timeRemaining = Math.max(0, MIN_ZOOM_PER_CLICK * getMsPerXZoom() - timeElapsed);

        zoomInput.isLongGlide = timeRemaining === 0;

        minZoomChangeTimer = setTimeout(finishGlideEarly, timeRemaining);
      }

      // A glide operation is finishing. Use the current state of the zoom animation for the final zoom amount.
      function finishGlideEarly() {
        if (!shouldUseKeyFramesAnimation()) {
          currentTargetZoom = getMidAnimationZoom();
          finishZoomOperation();
          return;
        }

        zoomAnimator = requestFrame(function () {
          // Stop the key-frame animation at the current zoom level
          // Yes, it's crazy, but this sequence helps the zoom stop where it is supposed to, and not jump back a little
          $body.css({
            animationPlayState: 'paused'
          });
          zoomAnimator = requestFrame(function() {
            currentTargetZoom = getActualZoom();
            onGlideStopped();
          });
        });
      }

      // Get the current zoom value as reported by the layout engine
      function getActualZoom() {
        var transform = $body.css('transform');
        return getSanitizedZoomValue(transform.substring(7));
      }

      function onGlideStopped() {
        $body
          .css(getZoomCss(currentTargetZoom))
          .css('animation', '');
        finishZoomOperation();
      }

      // Go directly to zoom. Do not pass go. But do collect the $200 anyway.
      function performInstantZoomOperation() {
        $body.css(getZoomCss(currentTargetZoom));
        if (glideChangeListener) {
          glideChangeListener(currentTargetZoom);
        }
      }

      // Animate until the currentTargetZoom, used for gliding zoom changes
      function performJsAnimateZoomOperation() {
        function jsZoomStep(/*currentTime*/) {  // Firefox passes in a weird startZoomTime that can't be compared with Date.now()
          var midAnimationZoom = getMidAnimationZoom();
          $body.css(getZoomCss(midAnimationZoom));
          if (midAnimationZoom === currentTargetZoom) {
            finishZoomOperation();
          }
          else {
            zoomAnimator = requestFrame(jsZoomStep);
          }
        }

        zoomAnimator = requestFrame(jsZoomStep);
      }

      // This is used for the following types of zoom:
      // * Initial load zoom
      // * Keypress (+/-) or A button press, which zoom until the button is let up
      function performKeyFramesZoomOperation() {
        var zoomSpeedMs = Math.abs(currentTargetZoom - completedZoom) * getMsPerXZoom(),
          animationCss = {
            animation: getAnimationName(currentTargetZoom)  + ' ' + zoomSpeedMs + 'ms linear',
            animationPlayState: 'running',
            animationFillMode: 'forwards'
          };

        // Apply the new CSS
        $body.css(animationCss);

        // No zoom/stop received for initial zoom
        $body.one(ANIMATION_END_EVENTS, onGlideStopped);
      }

      // Create <style> for keyframes animations
      // For initial zoom, call with the targetZoom
      // Otherwise, it will create a reverse (zoom-out) and forward (zoom-in) style sheet
      function setupNextZoomStyleSheet(targetZoom) {
        var css = '';
        if (shouldUseKeyFramesAnimation()) {
          if (targetZoom) {
            // Style sheet to zoom exactly to targetZoom
            css = getAnimationCSS(targetZoom);
          }
          else {
            if (completedZoom > zoom.min) {
              // Style sheet for reverse zoom (zoom-out to 1x)
              css += getAnimationCSS(zoom.min);
            }
            if (completedZoom < zoom.max) {
              // Style sheet for forward zoom (zoom-in to 3x)
              css += getAnimationCSS(zoom.max);
            }
          }
        }

        applyZoomStyleSheet(css);
      }

      function getAnimationName(targetZoom) {
        return SITECUES_ZOOM_ID + '-' + Math.round(completedZoom * 1000) + '-' + Math.round(targetZoom * 1000);
      }

      // Get keyframes css for animating from completed zoom to target zoom
      function getAnimationCSS(targetZoom) {
        var animationName = getAnimationName(targetZoom),
          keyFramesCssProperty = platform.browser.isWebKit ? '@-webkit-keyframes ' : '@keyframes ',
          keyFramesCss = animationName + ' {\n',
          percent = 0,
          step = 0,
          // For animation performance, use adaptive algorithm for number of keyframe steps:
          // Bigger zoom jump = more steps
          numSteps = Math.ceil(Math.abs(targetZoom - completedZoom) * 10),
          zoomIncrement = (targetZoom - completedZoom) / numSteps,
          percentIncrement = 100 / numSteps,
          animationStepZoom = completedZoom,
          cssPrefix = platform.cssPrefix.slice().replace('-moz-', '');

        for (; step <= numSteps; ++step) {
          percent = step === numSteps ? 100 : Math.round(step * percentIncrement);
          var zoomCss = getZoomCss(animationStepZoom),
            zoomCssString = cssPrefix + 'transform: ' + zoomCss.transform + (zoomCss.width ? '; width: ' + zoomCss.width : '');
          keyFramesCss += percent + '% { ' + zoomCssString + ' }\n';
          animationStepZoom += zoomIncrement;
        }
        keyFramesCss += '}\n\n';

        return keyFramesCssProperty + keyFramesCss;
      }

      // Must be called before beginning any type zoom operation, to set up the operation.
      function beginZoomOperation(targetZoom, input, animationReadyCallback) {
        // Initialize zoom input info
        zoomInput = $.extend({
          // Commented out ones are no longer needed unless we decide to do metrics from within modules
//          isKey: false,                     // + or - key (or with modifier)
//          isBrowserZoomKeyOverride: false,  // User is pressing the browser's zoom key command
//          isAButtonPress: false,            // Small or large A in panel
//          fromZoom: completedZoom           // Old zoom value
          isSlider: false,                    // Slider in panel
          isSliderDrag: false,                // True if the user drags the slider (as opposed to clicking in it)
          isLongGlide: false                  // Key or A button held down to glide extra
        }, input);

        // Make sure we're ready
        initZoomModule();

        // Ensure no other operation is running
        clearZoomCallbacks();

        currentTargetZoom = getSanitizedZoomValue(targetZoom);

        // Add what we need in <style> if we haven't already
        if (!$zoomStyleSheet) {
          setupNextZoomStyleSheet(currentTargetZoom);
        }

        function beginZoomOperationAfterDelay() {
          // Correct the start zoom time with the real starting time
          startZoomTime = Date.now();

          // Temporarily disable mouse cursor events and CSS behavior, to help with zoom performance
          $body.css({
            pointerEvents: 'none'
          });

          sitecues.emit('zoom/begin');

          animationReadyCallback && animationReadyCallback();
        }

        if (shouldPrepareAnimations()) {
          // Wait for key frames animation style sheet to be applied and for compositor layer to be created
          prepareAnimationOptimizations();
          zoomBeginTimer = setTimeout(beginZoomOperationAfterDelay, ANIMATION_OPTIMIZATION_SETUP_DELAY);
          startZoomTime = Date.now(); // Will be set to start of animation time after animation begins
        }
        else {
          beginZoomOperationAfterDelay();
        }
      }

      // Are we in the middle of a zoom operation?
      function isZoomOperationRunning() {
        return startZoomTime;
      }

      function isGlideCurrentlyRunning() {
        return glideChangeTimer;
      }

      // Must be called at the end of a zoom operation.
      function finishZoomOperation() {
        var didUnzoom = completedZoom > currentTargetZoom;

        completedZoom = currentTargetZoom;
        startZoomTime = 0;

        if (didUnzoom) {
          maximizeContentVisibility();
        }

        // Remove and re-add scrollbars -- we will re-add them after zoom if content is large enough
        determineScrollbars();

        // Restore mouse cursor events and CSS behavior
        $body.css('pointerEvents', '');

        // When zooming is finished, we will restrict the width
        // Un-Blur text in Chrome
        repaintToEnsureCrispText();

        // notify all about zoom change
        conf.set('zoom', completedZoom);
        sitecues.emit('zoom', completedZoom);

        clearZoomCallbacks();

        isInitialLoadZoom = false;
        zoomInput = {};

        // If the panel is not open, clear will-change so that the browser can reclaim animation resources used
        // (If the panel is open, we wait until it closes to clear this as the slider could be used at any time)
        if (!isPanelOpen) {
          clearAnimationOptimizationTimer = setTimeout(clearAnimationOptimizations, CLEAR_ANIMATION_OPTIMIZATION_DELAY);
        }

        // Get next forward/backward glide animations ready.
        // Doing it now helps with performance, because stylesheet will be parsed and ready for next zoom.
        setTimeout(setupNextZoomStyleSheet, 0);
      }

      function prepareAnimationOptimizations() {
        if (shouldRestrictWidth()) {
          // If animating width as well, optimizing the animations will just make them worse, because the
          // compositor layers would constantly need updating
          return false;
        }
        if (IS_WILL_CHANGE_SUPPORTED) { // Is will-change supported?
          // In case zoom module isn't initialized yet, safely provide 'body' in local scope.
          var $body = $body || $('body');
          // This is a CSS property that aids performance of animations
          $body.css('willChange', 'transform');
        }
      }

      function clearAnimationOptimizations() {
        if (!isZoomOperationRunning()) {
          $body.css({
            willChange: ''
          });
          clearTimeout(clearAnimationOptimizationTimer);
          clearAnimationOptimizationTimer = null;
        }
      }

      function cancelGlideChangeTimer() {
        if (glideChangeTimer) {
          glideChangeListener(completedZoom);
          clearInterval(glideChangeTimer);
          glideChangeTimer = 0;
        }
      }

      // Make sure the current zoom operation does not continue
      function clearZoomCallbacks() {
        // Ensure no further changes to zoom from this operation
        cancelFrame(zoomAnimator);
        clearTimeout(minZoomChangeTimer);
        clearTimeout(zoomBeginTimer);
        clearTimeout(clearAnimationOptimizationTimer);
        cancelGlideChangeTimer();
        $body.off(ANIMATION_END_EVENTS, onGlideStopped);
        $(window).off('keyup', finishGlideIfEnough);
      }

      // Scroll content to maximize the use of screen real estate, showing as much content as possible.
      // In effect, stretch the bottom-right corner of the visible content down and/or right
      // to meet the bottom-right corner of the window.
      function maximizeContentVisibility() {
        var bodyRight = originalBodyInfo.rightMostNode.getBoundingClientRect().right, // Actual right coord of visible content
          bodyHeight = $(document).height(),
          winWidth = window.innerWidth,
          winHeight = window.innerHeight,
          hScrollNow = window.pageXOffset,
          vScrollNow = window.pageYOffset,
          // How much do we need to scroll by to pull content to the bottom-right corner
          hScrollDesired = Math.max(0, winWidth - bodyRight), // Amount to pull right as a postive number
          vScrollDesired = Math.max(0, winHeight - bodyHeight), // Amount to pull down as a postive number
          // Don't scroll more than we actually can
          hScroll = Math.min(hScrollNow, hScrollDesired),
          vScroll = Math.min(vScrollNow, vScrollDesired);

        window.scrollBy(- hScroll, - vScroll); // Must negate the numbers to get the expected results
      }

      /**
       * repaintToEnsureCrispText's purpose is to render text clearly in browsers (chrome only)
       * that do not repaint the DOM when using CSS Transforms.  This function simply sets a
       * property, which is hopefully not set on pages sitecues runs on, that forces repaint.
       * 15ms of time is required, because the browser may not be done transforming
       * by the time Javascript is executed without the setTimeout.
       *
       * See here: https://equinox.atlassian.net/wiki/display/EN/Known+Issues
       */
      function repaintToEnsureCrispText() {
        // We used to use backfaceVisibility trick, but it erased backgrounds on the body.
        // This was done as follows:
        // Luckily, inserting a shim seems to work now (may not have in previous versions of Chrome when we tried it)
        if (!shouldRepaintOnZoomChange) {
          return;
        }
        if (shouldUseBackfaceRepaint) {
          $(body).css('backfaceVisibility', '');
          setTimeout(function () {
            $(body).css('backfaceVisibility', 'hidden')
          }, REPAINT_FOR_CRISP_TEXT_MS);
        }
        else {
          var appendedDiv = $('<div>')
            .css({
              position: 'fixed',
              width: '1px',
              height: '1px',
              opacity: '0',
              pointerEvents: 'none'
            })
            .appendTo('html');
          setTimeout(function () {
            appendedDiv.remove();
          }, REPAINT_FOR_CRISP_TEXT_MS);
        }
      }

      // We are going to remove scrollbars and re-add them ourselves, because we can do a better job
      // of knowing when the visible content is large enough to need scrollbars.
      // This also corrects the dreaded IE scrollbar bug, where fixed position content
      // and any use of getBoundingClientRect() was off by the height of the horizontal scrollbar, or the
      // width of the vertical scroll bar, but only when the user scrolled down or to the right.
      // By controlling the visibility of the scrollbars ourselves, the bug magically goes away.
      // This is also good because we're better than IE at determining when content is big enough to need scrollbars.
      function determineScrollbars() {
        if (!shouldManuallyAddScrollbars) {
          return;
        }

        // Use scrollbars if necessary for size of content
        // Get the visible content rect (as opposed to element rect which contains whitespace)
        var rect = getBodyInfo(),
          right = Math.max(rect.right, rect.width),
          bottom = Math.max(rect.bottom, rect.height),
          winHeight = window.innerHeight,
          winWidth = window.innerWidth;

        // If the right side of the visible content is beyond the window width,
        // or the visible content is wider than the window width, show the scrollbars.
        $('html').css({
          overflowX: right > winWidth ? 'scroll' : 'hidden',
          overflowY: bottom > winHeight ? 'scroll' : 'hidden'
        });
      }

      // Request an animation frame
      function requestFrame(fn) {
        var req = window.requestAnimationFrame || window.msRequestAnimationFrame;
        if (req) {
          return req(fn);
        }
        return setTimeout(fn, 16);  // 16ms is about 60fps
      }

      // Cancel any currently reequested animation frame
      function cancelFrame(id) {
        var cancel = window.cancelAnimationFrame || window.msCancelRequestAnimationFrame;
        if (cancel) {
          cancel(id);
        }
        else {
          clearTimeout(id);
        }
      }

      // Add useful zoom fixes to a stylesheet for the entire document
      function getZoomStyleSheetFixes() {
        return shouldFixNativeFormAppearance ? 'input,select,button {transform:scale3d(1,1,1);}' : '';
      }

      // Add useful zoom fixes to the body's @style
      function getZoomBodyCSSFixes() {
        var css = {
          // Allow the content to be horizontally centered, unless it would go
          // offscreen to the left, in which case start zooming the content from the left-side of the window
          transformOrigin: shouldRestrictWidth() ? '0% 0%' : '50% 0%',
          perspective: 999
        };

        if (shouldOptimizeLegibility) {
          css.textRendering = 'optimizeLegibility';
        }

        return css;
      }

      // Replace current zoom stylesheet or insert a new one with the
      // requested styles plus generic stylesheet fixes for the current configuration.
      function applyZoomStyleSheet(additionalCss) {
        var styleSheetText = (additionalCss || '') + getZoomStyleSheetFixes();
        if (styleSheetText) {
          if (!$zoomStyleSheet) {
            $zoomStyleSheet = $('<style>').appendTo('head')
              .attr('id', SITECUES_ZOOM_ID);
          }
          $zoomStyleSheet.text(styleSheetText);
        }
      }

      // Get a CSS object for the targetZoom level
      function getZoomCss(targetZoom) {
        var transform = 'scale(' + targetZoom.toFixed(ZOOM_PRECISION) + ') ' + getFormattedTranslateX(targetZoom),
          css = {
            transform: transform
          };
        if (shouldRestrictWidth()) {
          css.width = getRestrictedWidth(targetZoom);
        }

        return css;
      }

      // This is the zoom that we will still restrict the width
      function getZoomForWidthRestriction(currZoom, winWidth) {
        // Adjust max zoom for width restrictions for current window width
        // The max zoom for width restriction is set for a specific size of window
        // We use a maximized window on a MacBook pro retina screen (1440px wide)
        // The default is to restrict width up to a max of 1.35x zoom
        // If the user's window is 75% of the 1440px, we multiply the max zoom by .75
        var maxZoomToRestrictWidth = Math.max(1, zoomConfig.maxZoomToRestrictWidthIfFluid * (winWidth / 1440));

        return Math.min(currZoom, maxZoomToRestrictWidth); // Can't be larger than current zoom
      }

      // Get the desired width of the body for the current level of zoom
      function getRestrictedWidth(currZoom) {
        var winWidth = window.innerWidth;
        return winWidth / getZoomForWidthRestriction(currZoom, winWidth) + 'px';
      }

      // Return a formatted string for translateX as required by CSS
      function getFormattedTranslateX(targetZoom) {
        if (shouldRestrictWidth()) {
          return '';  // For fluid layouts, we use an transforim-origin of 0% 0%, so we don't need this
        }
        var zoomOriginX = Math.max(window.innerWidth, originalBodyInfo.transformOriginX) / 2, // X-coordinate origin of transform
          bodyLeft = originalBodyInfo.left,
          halfOfBody = (zoomOriginX - bodyLeft) * targetZoom,
          pixelsOffScreenLeft = (halfOfBody - zoomOriginX) + zoomConfig.leftMarginOffset,
          pixelsToShiftRight = Math.max(0, pixelsOffScreenLeft),
          translateX = pixelsToShiftRight / targetZoom;

        // Need to shift entire zoom image to the right so that start of body fits on screen
        return 'translateX(' + translateX.toFixed(ZOOM_PRECISION) + 'px)';
      }

      // Is it a fluid layout?
      function isFluidLayout() {
        if (originalBodyInfo.width === window.outerWidth) {
          // Handle basic case -- this works for duxburysystems.com, where the visible body content
          // spans the entire width of the available space
          return true;
        }
        // We consider it fluid if the main node we discovered inside the body changes width
        // if we change the body's width.
        var origWidth = originalBodyInfo.mainNode.scrollWidth,
          newWidth,
          isFluid;
        body.style.width = (window.outerWidth / 5) + 'px';
        newWidth = originalBodyInfo.mainNode.scrollWidth;
        isFluid = origWidth !== newWidth;
        body.style.width = '';

        return isFluid;
      }

      // Get the rect for visible contents in the body, and the main content node
      function getBodyInfo() {
        var bodyInfo = { },
          visibleNodes = [ ],
          mainNode,
          mainNodeRect = { width: 0, height: 0 },
          leftMostNode,
          leftMostCoord = 9999, // Everything else will be smaller
          rightMostNode,
          rightMostCoord = 0,
          MIN_WIDTH_MAIN_NODE = 300,
          bodyStyle = getComputedStyle(body);

        getBodyRectImpl(body, bodyInfo, visibleNodes, bodyStyle, true);

        if (!visibleNodes.length) {
          getBodyRectImpl(body, bodyInfo, visibleNodes, bodyStyle);
        }

        bodyInfo.width = bodyInfo.right - bodyInfo.left;
        bodyInfo.height = bodyInfo.bottom - bodyInfo.top;

        // Find tallest node
        visibleNodes.forEach(function(node) {
          var rect = node.rect;
          if (rect.height >= mainNodeRect.height && rect.width > MIN_WIDTH_MAIN_NODE) {
            if (rect.height > mainNodeRect.height || rect.width > mainNodeRect.width) {
              mainNodeRect = rect;
              mainNode = node.domNode;
            }
          }
          if (rect.left < leftMostCoord) {
            leftMostNode = node.domNode;
            leftMostCoord = rect.left;
          }
          if (rect.right > rightMostCoord) {
            rightMostNode = node.domNode;
            rightMostCoord = rect.right;
          }
        });
        bodyInfo.mainNode = mainNode;
        bodyInfo.leftMostNode = leftMostNode;
        bodyInfo.rightMostNode = rightMostNode;
        bodyInfo.transformOriginX = body.getBoundingClientRect().width / 2;

        return bodyInfo;
      }

      function willAddRect(newRect, node, style, parentStyle, isStrict) {
        if (node === document.body) {
          return false;
        }

        // Strict checks
        if (isStrict) {
          if (node.childNodes.length === 0 ||
            newRect.width < MIN_RECT_SIDE || newRect.height < MIN_RECT_SIDE ||
            // Watch for text-align: center or -webkit-center -- these items mess us up
            style.textAlign.indexOf('center') >= 0) {
            return false;
          }
        }

        // Must check
        if (newRect.left < 0 || newRect.top < 0 ||
          style.visibility !== 'visible') {
          return false;
        }

        // Good heuristic -- when x > 0 it tends to be a useful rect
        if (newRect.left > 0) {
          return true;
        }

        // newRect.left === 0
        // We usually won't these rectangles flush up against the left margin,
        // but will add them if there are visible children.
        // If we added them all the time we would often have very large left margins.
        // This rule helps get left margin right on duxburysystems.com.
        if (style.overflow !== 'visible' ||
          (!common.hasVisibleContent(node, style, parentStyle) && !common.isVisualRegion(node, style, parentStyle))) {
          return false; // No visible content
        }
        
        return true;
      }

      // Recursively look at rectangles and add them if they are useful content rectangles
      function getBodyRectImpl(node, sumRect, visibleNodes, parentStyle, isStrict) {

        var newRect = getAbsoluteRect(node),
          style = getComputedStyle(node);
        if (willAddRect(newRect, node, style, parentStyle, isStrict)) {
          addRect(sumRect, newRect);
          visibleNodes.push({ domNode: node, rect: newRect });
          return;  // Valid rectangle added. No need to walk into children.
        }
        $(node).children().each(function() {
          getBodyRectImpl(this, sumRect, visibleNodes, style, isStrict);
        });
      }

      // Add the rectangle to the sum rect if it is visible and has a left margin > 0
      function addRect(sumRect, newRect) {
        if (isNaN(sumRect.left) || newRect.left < sumRect.left) {
          sumRect.left = newRect.left;
        }
        if (isNaN(sumRect.right) || newRect.right > sumRect.right) {
          sumRect.right = newRect.right;
        }
        if (isNaN(sumRect.top) || newRect.top < sumRect.top) {
          sumRect.top = newRect.top;
        }
        if (isNaN(sumRect.bottom) || newRect.bottom > sumRect.bottom) {
          sumRect.bottom = newRect.bottom;
        }
      }

      // Gets the absolute rect of a node
      // Does not use getBoundingClientRect because we need size to include overflow
      function getAbsoluteRect(node) {
        var clientRect = node.getBoundingClientRect(),
          width = Math.max(node.scrollWidth, clientRect.width),
          height = Math.max(node.scrollHeight, clientRect.height),
          left = clientRect.left + window.pageXOffset,
          top = clientRect.top + window.pageYOffset;
        return {
          left: left,
          top: top,
          width: width,
          height: height,
          right: left + width,
          bottom: top + height
        };
      }

      // Lazy init, saves time on page load
      function initZoomModule() {
        if (originalBodyInfo) {
          return; //Already initialized
        }

        body = document.body;
        $body = $(body);
        originalBodyInfo = getBodyInfo();

        if (typeof zoomConfig.isFluid === 'undefined') {
          zoomConfig.isFluid = isFluidLayout();
        }

        $(window).resize(onResize);

        $body.css(getZoomBodyCSSFixes()); // Get it read as soon as zoom might be used

        if (SC_DEV) {
          console.log('_______________________________________________________');
          console.log('Zoom configuration: %o', zoomConfig);
          console.log('Window width: %o', window.outerWidth);
          console.log('Visible body rect: %o', originalBodyInfo);
          console.log('isFluid?: %o', zoomConfig.isFluid);
          console.log('_______________________________________________________');
        }
      }

      function onDocumentReady() {
        var targetZoom = conf.get('zoom');
        if (!targetZoom) {
          // Initialize as soon as panel opens for faster slider responsiveness
          sitecues.on('panel/show', initZoomModule);
        }
        else if (targetZoom > 1) {
          isInitialLoadZoom = true;
          beginGlide(targetZoom);
        }
      }

      /**
       * Recompute the visible body size, and re-zoom the page as that handles the logic
       * to properly scale, resize, and position the page and its elements with respect to the current
       * sizes of the body and window.
       */
      function onResize() {
        if (!$body) {
          return;
        }
        isRetinaDisplay = undefined; // Invalidate, now that it may have changed

        $body.css({width: '', transform: ''});
        originalBodyInfo = getBodyInfo();
        $body.css(getZoomCss(completedZoom));
        if (shouldRestrictWidth()) {
          // Restrict the width of the body so that it works similar to browser zoom
          // Documents designed to fit the width of the page still will
          $body.css('width', getRestrictedWidth(completedZoom));
        }
        determineScrollbars();
        sitecues.emit('resize');
      }

      // use conf module for sharing current zoom level value
      conf.def('zoom', function (value) {
        return getSanitizedZoomValue(value);
      });

      // Set up listeners for zoom  operations
      sitecues.on('zoom/stop-slider', finishZoomSliderOperation);
      sitecues.on('zoom/stop-button', finishGlideIfEnough);
      sitecues.on('zoom/increase', function(event) {
        // Increase up to max or until zoom/stop requested
        beginGlide(zoom.max, event);
      });
      sitecues.on('zoom/decrease', function(event) {
        beginGlide(zoom.min, event);
      });
      sitecues.on('panel/show', function() {
        isPanelOpen = true;
        if (shouldPrepareAnimations()) {
          prepareAnimationOptimizations();
        }
      });
      sitecues.on('panel/hide', function() {
        isPanelOpen = false;
        clearAnimationOptimizations(); // Browser can reclaim resources used
      });

      zoom.getNativeZoom(); // Make sure we have native zoom value available

      // We used to zoom before the document was ready, causing us to examine the body
      // before much of it was actually there. This patch waits until the document before zooming and examining the body.
      // In the future, we could try to examine the body every second until it is able to find the info. This would
      // allow us to zoom sooner -- but it makes sense to keep to the simple approach for now.
      // Also, it seems that zoom initialization is much faster when it happens outside of the critical path
      // (after the load). So another advantage of doing this after the document is ready is to not
      // slow down the page load.
      if (document.readyState === 'complete') {
        onDocumentReady();
      }
      else {
        $(document).ready(onDocumentReady);
      }

      callback();
    });

});

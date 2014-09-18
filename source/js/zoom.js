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
        doKeyFramesAnimationDelayHack,  // Set when we need to wait before activating an animation

        // Zoom operation state
        minZoomChangeTimer,      // Keep zooming at least for this long, so that a glide does a minimum step
        zoomAnimator,            // Frame request ID that can be cancelled
        glideInputEvent,         // The input event that initiated a zoom glide
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
        MS_PER_X_ZOOM = 1400, // For animations, the number of milliseconds per unit of zoom (e.g. from 1x to 2x)
        ZOOM_PRECISION = 3, // Decimal places allowed
        SITECUES_ZOOM_ID = 'sitecues-zoom',
        ANIMATION_END_EVENTS = 'animationend webkitAnimationEnd MSAnimationEnd',
        MIN_RECT_SIDE = 4;

      // ------------------------ PUBLIC -----------------------------

      // Values used for zoom math
      // TODO should these be getters? Doing it via direct access variables is legacy.
      zoom.max = 3;
      zoom.min = 1;
      zoom.step = 0.01;
      zoom.range = zoom.max - zoom.min;

      // Allow customization of zoom configuration on a per-website basis
      zoom.provideCustomZoomConfig = function(customZoomConfig) {
        $.extend(zoomConfig, customZoomConfig);
      };

      // Use to jump the current zoom immediately to the targetZoom requested
      // The use case for this is currently the zoom slider
      zoom.jumpTo = function(targetZoom) {
        var shouldPerformContinualUpdates = !shouldFixFirefoxScreenCorruptionBug();
        if (!isZoomOperationRunning()) {
          beginZoomOperation(targetZoom);
          if (shouldPerformContinualUpdates) {
            zoomAnimator = requestFrame(performContinualZoomUpdates);
          }
        }
        else {
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

      zoom.getBodyWidth = function() {
        // If we have restricted the width, use that value
        var width = parseFloat(document.body.style.width);

        // Otherwise, use the originally measured visible body width
        if (!width) {
          initZoomModule();
          width = originalBodyInfo.width;
        }

        return width * completedZoom;
      };

      // Add a listener for mid-animation zoom updates.
      // These occur when the user holds down A, a, +, - (as opposed to conf.set and the 'zoom' event which occur at the end)
      // Currently only supports one listener.
      zoom.setGlideChangeListener = function (listener) {
        glideChangeListener = listener;
      };

      // ------------------------ PRIVATE -----------------------------

      // This matches our updates with screen refreshes.
      // Unfortunately, it causes issues in some older versions of Firefox on Mac + Retina.
      function performContinualZoomUpdates() {
        zoomAnimator = requestFrame(performContinualZoomUpdates);
        performInstantZoomOperation();
        completedZoom = currentTargetZoom;
      }

      // Should smooth zoom be used or step zoom?
      // In dev, we can override as follows:
      // Shift-key: Script-based smooth zoom
      // Ctrl-key: CSS-based smooth zoom
      function shouldSmoothZoom() {
        if (SC_DEV && glideInputEvent && (glideInputEvent.shiftKey || glideInputEvent.ctrlKey)) {
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
        if (SC_DEV && glideInputEvent) {
          // In dev, allow overriding of animation type
          if (glideInputEvent.shiftKey) {
            return false; // Use JS-based animation
          }
          else if (glideInputEvent.ctrlKey) {
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
          && (!platform.browser.isChrome || isInitialLoadZoom || !zoom.isRetina() || shouldRestrictWidth());
      }

      // Should we do our hacky fix for Chrome's animation jerk-back?
      // This is where zooming up from 1 and stopping causes the stoppage of the zoom to jerk backwards at the end
      function shouldFixAnimationJerkBack() {
        return platform.browser.isChrome && shouldUseKeyFramesAnimation();
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
          glideInputEvent = event;
          beginZoomOperation(targetZoom);
          $(window).one('keyup', finishGlideIfEnough);
          if (!shouldSmoothZoom()) {
            // When no animations -- just be clunky and zoom a bit closer to the target
            var delta = completedZoom < targetZoom ? MIN_ZOOM_PER_CLICK : -MIN_ZOOM_PER_CLICK;
            currentTargetZoom = getSanitizedZoomValue(completedZoom + delta);
            performInstantZoomOperation();
            finishZoomOperation();
            return;
          }
          if (glideChangeListener) {
            glideChangeTimer = setInterval(onGlideChange, GLIDE_CHANGE_INTERVAL_MS);
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

      // Get what the zoom value would be if we stopped the animation now
      function getMidAnimationZoom() {
        var totalZoomChangeRequested = Math.abs(currentTargetZoom - completedZoom),
          zoomDirection = currentTargetZoom > completedZoom ? 1 : -1,
          zoomChange = getZoomOpElapsedTime() / MS_PER_X_ZOOM;
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
        var timeElapsed = getZoomOpElapsedTime(),
          timeRemaining = Math.max(0, MIN_ZOOM_PER_CLICK * MS_PER_X_ZOOM - timeElapsed);

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
        if (doKeyFramesAnimationDelayHack) {
          // Wait for Chrome animation style sheet to be ready
          // Normally we don't need this hack in order to prevent Chrome's jerk-back bug,
          // because we set up the next zoom style sheets ahead of time.
          // However, if a page loads with zoom of 1, we don't want to pollute the page with
          // the zoom style sheets (best practice is to keep the page clean when sitecues isn't used).
          // In this case, if the user starts a zoom glide, we need to set up the new zoom
          // style sheet and have an extra delay before we start zooming. This is the only
          // case where we need this code.
          doKeyFramesAnimationDelayHack = false;
          $body.css('animation'); // Force reflow to finish
          var HACK_DELAY = 150;   // Give Chrome an extra 150ms as a birthday present, to finish whatever it seems to need to do
          startZoomTime = Date.now() + HACK_DELAY;
          setTimeout(performKeyFramesZoomOperation, HACK_DELAY);
          SC_DEV && console.log('Performing Chome animation delay hack');
          return;
        }

        var zoomSpeedMs = Math.abs(currentTargetZoom - completedZoom) * MS_PER_X_ZOOM,
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
      function beginZoomOperation(targetZoom) {
        // Make sure we're ready
        initZoomModule();

        // Ensure no other operation is running
        clearZoomCallbacks();

        // Add what we need in <style> if we haven't already
        if (!$zoomStyleSheet) {
          setupNextZoomStyleSheet(targetZoom);
          doKeyFramesAnimationDelayHack = shouldFixAnimationJerkBack();
        }

        // General CSS fixes on body
        if (completedZoom === 1) {  // Starting at zoom === 1 means these haven't been set yet
          $body.css(getZoomBodyCSSFixes());
        }

        // Make sure all animations are dead
        // Temporarily disable mouse cursor events and CSS behavior, to help with zoom performance
        $body.css({
          pointerEvents: 'none'
        });

        sitecues.emit('zoom/begin');

        currentTargetZoom = getSanitizedZoomValue(targetZoom);
        startZoomTime = Date.now();
      }

      // Are we in the middle of a zoom operation?
      function isZoomOperationRunning() {
        return startZoomTime;
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

        glideInputEvent = null;
        isInitialLoadZoom = false;

        // Get next forward/backward glide animations ready.
        // Doing it now helps with performance, because stylesheet will be parsed and ready for next zoom.
        setTimeout(setupNextZoomStyleSheet, 0);
      }

      // Make sure the current zoom operation does not continue
      function clearZoomCallbacks() {
        // Ensure no further changes to zoom from this operation
        cancelFrame(zoomAnimator);
        clearTimeout(minZoomChangeTimer);
        if (glideChangeTimer) {
          glideChangeListener(completedZoom);
          clearInterval(glideChangeTimer);
          glideChangeTimer = 0;
        }
        $body.off(ANIMATION_END_EVENTS, onGlideStopped);
        $(window).off('keyup', finishGlideIfEnough);
      }

      // Scroll content to maximize the use of screen real estate, showing as much content as possible.
      // In effect, stretch the bottom-right corner of the visible content down and/or right
      // to meet the bottom-right corner of the window.
      function maximizeContentVisibility() {
        var bodyRight = originalBodyInfo.rightMostNode.getBoundingClientRect().right, // Actual right coord of visible content
          bodyHeight = $(document).height(),
          winWidth = $(window).width(),
          winHeight = $(window).height(),
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
        var prefix = platform.browser.isChrome ? '-webkit-' : '',
          background = 'background: ' + prefix + 'gradient(linear, 0% 0%, 0% 100%, color-stop(0%,#fff), color-stop(35%,#f9f9f9), color-stop(100%,#ddd));';
        return shouldFixNativeFormAppearance ?
          // Adding this CSS automagically fixes the form issues in Chrome when zooming
          'select {\nborder: 1px solid #bbb;\n' + background + '\n}\n\n;' : '';
      }

      // Add useful zoom fixes to the body's @style
      function getZoomBodyCSSFixes() {
        var css = {
          // Allow the content to be horizontally centered, unless it would go
          // offscreen to the left, in which case start zooming the content from the left-side of the window
          transformOrigin: shouldRestrictWidth() ? '0% 0%' : '50% 0%',
          // These two properties prevent webKit from having the jump back bug when we pause the animation
          perspective: 999,
          backfaceVisibility: 'hidden'
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

      // Get the desired width of the body for the current level of zoom
      function getRestrictedWidth(currZoom) {
        // Adjust for current window width
        var winWidth = window.innerWidth,
          maxZoomToRestrictWidth = Math.max(1, zoomConfig.maxZoomToRestrictWidthIfFluid * (winWidth / 1440)),
          useZoom = Math.min(currZoom, maxZoomToRestrictWidth);
        // We used to use document.documentElement.clientWidth, but this caused the page
        // to continually shrink on resize events.
        // Check out some different methods for determining viewport size: http://ryanve.com/lab/dimensions/
        // More information on document.documentElement.clientWidth and browser viewports: http://www.quirksmode.org/mobile/viewports.html
        return (winWidth / useZoom) + 'px';
      }

      // Return a formatted string for translateX as required by CSS
      function getFormattedTranslateX(targetZoom) {
        if (shouldRestrictWidth()) {
          return '';  // For fluid layouts, we use an transforim-origin of 0% 0%, so we don't need this
        }
        var zoomOriginX = Math.max(window.outerWidth, originalBodyInfo.width) / 2, // X-coordinate origin of transform
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
          MIN_WIDTH_MAIN_NODE = 300;

        getBodyRectImpl(body, bodyInfo, visibleNodes);

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

        return bodyInfo;
      }

      function willAddRect(newRect, node) {
        if (node === document.body || newRect.left < 0 || newRect.top < 0 ||
          newRect.width < MIN_RECT_SIDE || newRect.height < MIN_RECT_SIDE ||
          node.childNodes.length === 0) {
          return false;
        }

        if (newRect.left > 0) {
          return true;
        }

        // newRect.left === 0
        // We usually won't these rectangles flush up against the left margin,
        // but will add them if there are visible children.
        // If we added them all the time we would often have very large left margins.
        // This rule helps get left margin right on duxburysystems.com.
        if ($(node).css('overflow') !== 'visible' || !common.hasVisibleChildContent(node)) {
          return false; // No visible children
        }
        return true;
      }

      // Recursively look at rectangles and add them if they are useful content rectangles
      function getBodyRectImpl(node, sumRect, visibleNodes) {

        var newRect = getAbsoluteRect(node);
        if (willAddRect(newRect, node)) {
          addRect(sumRect, newRect);
          visibleNodes.push({ domNode: node, rect: newRect });
          return;  // Valid rectangle added. No need to walk into children.
        }
        $(node).children().each(function() {
          getBodyRectImpl(this, sumRect, visibleNodes);
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
      sitecues.on('zoom/stop-slider', finishZoomOperation);
      sitecues.on('zoom/stop-button', finishGlideIfEnough);
      sitecues.on('zoom/increase', function(event) {
        // Increase up to max or until zoom/stop requested
        beginGlide(zoom.max, event);
      });
      sitecues.on('zoom/decrease', function(event) {
        beginGlide(zoom.min, event);
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

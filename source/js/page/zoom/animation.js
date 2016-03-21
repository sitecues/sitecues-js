define(
  [
    '$',
    'core/conf/user/manager',
    'core/platform',
    'core/events',
    'core/metric',
    'page/util/common',
    'page/zoom/state',
    'page/zoom/constants',
    'page/zoom/config/config',
    'page/zoom/util/viewport',
    'page/zoom/util/body-geometry',
    'page/zoom/util/restrict-zoom'
  ],
  function (
    $,
    conf,
    platform,
    events,
    metric,
    common,
    state,
    constants,
    config,
    viewport,
    bodyGeo,
    restrictZoom
  ) {

    'use strict';

    var
      isInitialized,
      body, $body,
      // Key frame animations
      $zoomStyleSheet,                 // <style> element we insert for animations (and additional fixes for zoom)

      // Zoom operation state
      minZoomChangeTimer,      // Keep zooming at least for this long, so that a glide does a minimum step
      zoomAnimator,            // Frame request ID that can be cancelled
      elementDotAnimatePlayer, // AnimationPlayer used in some browsers (element.animate)

      // Zoom slider change listener
      thumbChangeListener,    // Supports a single listener that is called back as animation proceeds
      glideChangeTimer,       // Timer used for callbacks

      // Function to call for requesting an animation frame
      requestFrame = window.requestAnimationFrame || window.msRequestAnimationFrame ||
        function(fn) { return setTimeout(fn, 16); },  // 16ms is about 60fps

      // State to help with animation optimizations and will-change
      zoomBeginTimer, // Timer before zoom can actually begin (waiting for browser to create composite layer)

      // Should we repaint when zoom is finished (after any animations)?
      // Should always be true in Chrome, because it makes text crisper
      // Don't use backface repainting method if there is a background-image on the <body>, because it will be erased.
      // (We still want to use the backface method when we can, because it often produces better results than our
      // other method, which is to overlay a transparent div and then remove it)
      shouldRepaintOnZoomChange,

      // Should we use the Web Animations API (element.animate) ?
      shouldUseElementDotAnimate,

      // Optimize fonts for legibility? Helps a little bit with Chrome on Windows
      shouldOptimizeLegibility,
      TRANSFORM_PROP_CSS,
      // We store their current applied transition shorthand property, to revert to when we finish the zoom operation
      cachedTransitionProperty = null,

      // Constants

      // Change zoom at least this amount if user clicks on A button or presses +/- or left/right in slider
      MIN_ZOOM_PER_CLICK           = constants.MIN_ZOOM_PER_CLICK,

      // For animations, the number of milliseconds per unit of zoom (e.g. from 1x to 2x)
      MS_PER_X_ZOOM_GLIDE          = constants.MS_PER_X_ZOOM_GLIDE,

      // For click in slider
      MS_PER_X_ZOOM_SLIDER         = constants.MS_PER_X_ZOOM_SLIDER,

      // Decimal places allowed
      ZOOM_PRECISION               = constants.ZOOM_PRECISION,

      // How often to call back with a new zoom value
      GLIDE_CHANGE_INTERVAL_MS     = constants.GLIDE_CHANGE_INTERVAL_MS,
      SITECUES_ZOOM_ID             = constants.SITECUES_ZOOM_ID,
      ANIMATION_END_EVENTS         = constants.ANIMATION_END_EVENTS,

      // This is conjured out of thin air. Just seems to work.
      REPAINT_FOR_CRISP_TEXT_DELAY = constants.REPAINT_FOR_CRISP_TEXT_DELAY,
      CRISPING_ATTRIBUTE           = constants.CRISPING_ATTRIBUTE,
      MAX                          = constants.MAX_ZOOM,
      MIN                          = constants.MIN_ZOOM;

    // Must be called to set up any type of zoom operation
    function beginZoomOperation(targetZoom, input, animationReadyCallback) {
      // Initialize zoom input info
      state.zoomInput = $.extend({
        isSlider: false,                  // Slider in panel
        isSliderDrag: false,             // True if the user drags the slider (as opposed to clicking in it)
        isSliderClick: false,            // True if the user dragged the slider and now stopped
        isLongGlide: false,              // Key or A button held down to glide extra
        isKey: false,
        isButtonPress: false,            // Small or large A in panel
        fromZoom: state.completedZoom           // Old zoom value
      }, input);

      // Make sure we're ready
      bodyGeo.init();

      fixBodyTransitionStyle();

      // Ensure no other operation is running
      clearZoomCallbacks();

      state.currentTargetZoom = restrictZoom.toValidRange(targetZoom);

      // Add what we need in <style> if we haven't already
      if (!$zoomStyleSheet) {
        setupNextZoomStyleSheet(state.currentTargetZoom);
      }

      // Correct the start zoom time with the real starting time
      state.startZoomTime = Date.now();

      // Temporarily disable mouse cursor events and CSS behavior, to help with zoom performance
      $body.css({
        pointerEvents: 'none'
      });

      events.emit('zoom/begin');

      if (animationReadyCallback) {
        animationReadyCallback();
      }
    }

    // Begin an operation to the glide toward the current zoom, if smooth zoom is currently supported.
    // If no smooth zoom, apply an instant zoom change to increase or decrease zoom by a constant amount.
    // If we are zooming with +/- or clicking A/a
    function beginGlide(targetZoom, event) {
      if (!isZoomOperationRunning() && targetZoom !== state.completedZoom) {
        var input = {};
        if (event) {
          if (event.keyCode) {
            // TODO should we differentiate between Enter on A/a vs +/- ?
            input.isKey = true;
            input.isBrowserKeyOverride = event.ctrlKey || event.metaKey;
          }
          else {
            input.isButtonPress = true;
          }
        }
        if (!shouldSmoothZoom()) {
          beginZoomOperation(targetZoom, input);
          // Instant zoom
          if (event) {
            // When no animations and key/button pressed -- just be clunky and zoom a bit closer to the target
            var delta = MIN_ZOOM_PER_CLICK * (state.completedZoom < targetZoom ? 1 : -1);
            state.currentTargetZoom = restrictZoom.toValidRange(state.completedZoom + delta);
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
        glideChangeTimer = setInterval(onGlideChange, GLIDE_CHANGE_INTERVAL_MS);
        if (!state.zoomInput.isLongGlide) {
          // Button/key was already released, zoom only for long enough to get minimum zoom
          var delta = MIN_ZOOM_PER_CLICK * (state.completedZoom < targetZoom ? 1 : -1);
          state.currentTargetZoom = restrictZoom.toValidRange(state.completedZoom + delta);
          minZoomChangeTimer = setTimeout(finishZoomOperation, MIN_ZOOM_PER_CLICK * getMsPerXZoom());
        }


        if (shouldUseElementDotAnimate) {
          if (SC_DEV) { console.log('Begin element.animate zoom'); }
          performElementDotAnimateZoomOperation();
        }
        else if (shouldUseKeyFramesAnimation()) {
          if (SC_DEV) { console.log('Begin keyframes zoom'); }
          performKeyFramesZoomOperation();
        }
        else {
          if (SC_DEV) { console.log('Begin JS zoom'); }
          performJsAnimateZoomOperation();
        }

      }
    }

    // Get a CSS object for the targetZoom level
    function getZoomCss(targetZoom) {
      var transform = 'scale(' + targetZoom.toFixed(ZOOM_PRECISION) + ') ' + bodyGeo.getFormattedTranslateX(targetZoom),
        css = {};

      css[TRANSFORM_PROP_CSS] = transform;
      if (config.shouldRestrictWidth) {
        css.width = bodyGeo.getRestrictedBodyWidth(targetZoom);
      }

      return css;
    }

    // Cancel any currently requested animation frame
    function cancelFrame() {
      var cancel = window.cancelAnimationFrame || window.msCancelRequestAnimationFrame;
      if (cancel) {
        cancel(zoomAnimator);
      }
      else {
        clearTimeout(zoomAnimator);
      }
    }

    // Add useful zoom fixes to the body's @style
    function fixZoomBodyCss() {
      // Allow the content to be horizontally centered, unless it would go
      // offscreen to the left, in which case start zooming the content from the left-side of the window
      body.style[platform.transformOriginProperty] = config.shouldRestrictWidth ? '0 0' : '50% 0';
      if (shouldOptimizeLegibility) {
        body.style.textRendering = 'optimizeLegibility';
      }
    }

    // Replace current zoom stylesheet or insert a new one with the
    // requested styles plus generic stylesheet fixes for the current configuration.
    function applyZoomStyleSheet(additionalCss) {
      var styleSheetText = additionalCss || '';
      if (styleSheetText) {
        if (!$zoomStyleSheet) {
          $zoomStyleSheet = $('<style>').appendTo('head')
            .attr('id', SITECUES_ZOOM_ID);
        }
        $zoomStyleSheet.text(styleSheetText);
      }
    }

    // Continual slider updates
    // This matches our updates with screen refreshes.
    // Unfortunately, it causes issues in some older versions of Firefox on Mac + Retina.
    function performContinualZoomUpdates() {
      zoomAnimator = requestFrame(performContinualZoomUpdates);
      performInstantZoomOperation();
      state.completedZoom = state.currentTargetZoom;
    }

    function finishZoomSliderOperation() {

      // ---- Slider drag ----
      if (state.zoomInput.isSliderDrag) {
        cancelFrame();
        finishZoomOperation();
        return;
      }

      // ---- Slider click ----
      // Is in the middle of gliding to a zoom click -- this always uses JS.
      // Let it finish -- the animation's end will cause finishZoomOperation() to be called
      state.zoomInput.isSliderClick = true;
    }

    // Should smooth zoom be used or step zoom?
    // In dev, we can override as follows:
    // Shift-key: Script-based smooth zoom
    // Ctrl-key: CSS-based smooth zoom
    function shouldSmoothZoom() {
      if (viewport.shouldFixFirefoxScreenCorruptionBug()) {
        return false;
      }

      return config.shouldSmoothZoom;
    }

    // If smooth zoom is used, which kind -- JS or CSS keyframes?
    // In dev, we can override default behavior as follows:
    // Shift-key: Script-based
    // Ctrl-key: CSS-based
    function shouldUseKeyFramesAnimation() {

      // Only IE10 and up can do CSS animate.
      var isOldIE = platform.browser.isIE && platform.browser.version < 10,
        isSafari = platform.browser.isSafari,
        restrictingWidthInSafari = isSafari && config.shouldRestrictWidth;

      return shouldSmoothZoom()   &&
        !isOldIE                  &&
          // Safari is herky jerky if animating the width and using key frames
          // TODO fix initial load zoom with jsZoom -- not doing anything
        !restrictingWidthInSafari &&
          // Chrome will use element.animate();
        !shouldUseElementDotAnimate;
    }

    // Animate until the currentTargetZoom, used for gliding zoom changes
    // Use falsey value for isTargetZoomStable for slider zoom, where the
    // target keeps changing as the slider moves
    function performJsAnimateZoomOperation() {
      function jsZoomStep(/*currentTime*/) {  // Firefox passes in a weird startZoomTime that can't be compared with Date.now()
        var midAnimationZoom = getMidAnimationZoom();
        $body.css(getZoomCss(midAnimationZoom));
        if (midAnimationZoom === state.currentTargetZoom && !isSliderActive()) {
          zoomAnimator = requestFrame(finishZoomOperation);
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
      var zoomSpeedMs = Math.abs(state.currentTargetZoom - state.completedZoom) * getMsPerXZoom(),
        animationCss = {
          animation: getAnimationName(state.currentTargetZoom)  + ' ' + zoomSpeedMs + 'ms linear',
          animationPlayState: 'running',
          fillMode: 'forwards'
        };


      // Apply the new CSS
      $body.css(animationCss);

      // No zoomStopRequested() received for initial zoom
      $body.one(ANIMATION_END_EVENTS, onGlideStopped);
    }

    // This is used to repaint the DOM after a zoom in WebKit to ensure crisp text
    function getCssCrispingFixes() {
      if (shouldRepaintOnZoomChange) {
        return '\n[' + CRISPING_ATTRIBUTE + '] * { backface-visibility: hidden; }\n';
      }
      return '';
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
          if (state.completedZoom > MIN) {
            // Style sheet for reverse zoom (zoom-out to 1x)
            css += getAnimationCSS(MIN);
          }
          if (state.completedZoom < MAX) {
            // Style sheet for forward zoom (zoom-in to 3x)
            css += getAnimationCSS(MAX);
          }
        }
      }

      css += getCssCrispingFixes();

      applyZoomStyleSheet(css);
    }

    function getAnimationName(targetZoom) {
      return SITECUES_ZOOM_ID + '-' + Math.round(state.completedZoom * 1000) + '-' + Math.round(targetZoom * 1000);
    }

    function getAnimationKeyFrames(targetZoom, doEase, doIncludeTimePercent) {
      var timePercent,
        animationPercent,
        step = 0,
      // For animation performance, use adaptive algorithm for number of keyframe steps:
      // Bigger zoom jump = more steps
        numSteps = Math.ceil(Math.abs(targetZoom - state.completedZoom) * 20),
        percentIncrement = 1 / numSteps,
        keyFrames = [];

      for (; step <= numSteps; ++step) {
        timePercent = step === numSteps ? 1 : step * percentIncrement;
        if (doEase) {
          // Provide simple sinusoidal easing in out effect for initial load zoom
          animationPercent = (Math.cos(Math.PI*timePercent) - 1) / -2;
        }
        else {
          animationPercent = timePercent;
        }
        var midAnimationZoom = state.completedZoom + (targetZoom - state.completedZoom) * animationPercent;
        keyFrames[step] = getZoomCss(midAnimationZoom);
        if (doIncludeTimePercent) {
          keyFrames[step].timePercent = timePercent;
        }
      }

      return keyFrames;
    }

    // Get keyframes css for animating from completed zoom to target zoom
    function getAnimationCSS(targetZoom) {
      var animationName = getAnimationName(targetZoom),
        keyFramesCssProperty = platform.browser.isWebKit ? '@-webkit-keyframes ' : '@keyframes ',
        keyFramesCss = animationName + ' {\n',
        keyFrames = getAnimationKeyFrames(targetZoom, state.isInitialLoadZoom, true),
        numSteps = keyFrames.length - 1,
        step = 0;

      for (; step <= numSteps; ++step) {
        var keyFrame = keyFrames[step],
          zoomCssString = TRANSFORM_PROP_CSS + ': ' + keyFrame[TRANSFORM_PROP_CSS] + (keyFrame.width ? '; width: ' + keyFrame.width : '');

        keyFramesCss += Math.round(10000 * keyFrame.timePercent) / 100 + '% { ' + zoomCssString + ' }\n';
      }
      keyFramesCss += '}\n\n';

      return keyFramesCssProperty + keyFramesCss;
    }


    // Go directly to zoom. Do not pass go. But do collect the $200 anyway.
    function performInstantZoomOperation() {
      var zoomCss = getZoomCss(state.currentTargetZoom);
      if (platform.browser.isChrome && body.animate) {
        // Magically, this works with the new crisper (and the new crisper doesn't kill mouse events on floats ...)
        if (elementDotAnimatePlayer) {
          elementDotAnimatePlayer.cancel();
        }
        elementDotAnimatePlayer = body.animate(
          [zoomCss, zoomCss],
          {
            duration: 1,
            iterations: 1,
            fill: 'forwards'
          });
      }
      else {
        $body.css(zoomCss);
      }
      if (thumbChangeListener) {
        thumbChangeListener(state.currentTargetZoom);
      }
    }

    function performElementDotAnimateZoomOperation() {
      var animationMs = Math.abs(state.currentTargetZoom - state.completedZoom) * MS_PER_X_ZOOM_GLIDE;
      elementDotAnimatePlayer = body.animate(
        getAnimationKeyFrames(state.currentTargetZoom),
        {
          duration: animationMs,
          iterations: 1,
          fill: 'forwards',
          easing: state.isInitialLoadZoom ? 'ease-out' : 'linear'
        });
      elementDotAnimatePlayer.onfinish = onGlideStopped;
    }

    function isSliderActive() {
      return state.zoomInput.isSlider && !state.zoomInput.isSliderClick;
    }

    // Are we in the middle of a zoom operation?
    function isZoomOperationRunning() {
      return state.startZoomTime;
    }

    function isGlideCurrentlyRunning() {
      return glideChangeTimer;
    }

    function getMsPerXZoom() {
      return state.zoomInput.isSlider ? MS_PER_X_ZOOM_SLIDER : MS_PER_X_ZOOM_GLIDE;
    }

    // Get what the zoom value would be if we stopped the animation now
    function getMidAnimationZoom() {
      var totalZoomChangeRequested = Math.abs(state.currentTargetZoom - state.completedZoom),
        zoomDirection = state.currentTargetZoom > state.completedZoom ? 1 : -1,
        zoomChange = state.elapsedZoomTime / getMsPerXZoom();
      if (zoomChange > totalZoomChangeRequested) {
        zoomChange = totalZoomChangeRequested;
      }
      return restrictZoom.toValidRange(state.completedZoom + zoomDirection * zoomChange);
    }

    // Helper for calling back glide change listener
    function onGlideChange() {
      if (thumbChangeListener) {
        thumbChangeListener(getMidAnimationZoom());
      }
    }

    function onGlideStopped() {
      if (elementDotAnimatePlayer) {
        // If we don't do this, then setting CSS directly on body no longer works
        // (May not have been cancelled if user holds + and reaches 3 or holds - and reaches 1)
        elementDotAnimatePlayer.cancel();
        elementDotAnimatePlayer = null;
      }
      $body
        .css(getZoomCss(state.currentTargetZoom))
        .css('animation', '');
      finishZoomOperation();
    }

    // Must be called at the end of a zoom operation.
    function finishZoomOperation() {
      if (elementDotAnimatePlayer) {
        // Can't leave animation player around, as it will prevent future animations
        $body.css(getZoomCss(state.currentTargetZoom));
        elementDotAnimatePlayer.onfinish = null;
        elementDotAnimatePlayer.cancel();
      }

      var didUnzoom = state.completedZoom > state.currentTargetZoom;

      state.completedZoom = getActualZoom();
      state.startZoomTime = 0;

      if (didUnzoom) {
        viewport.maximizeContentVisibility();
      }

      // Remove and re-add scrollbars -- we will re-add them after zoom if content is large enough
      viewport.determineScrollbars();

      // Restore mouse cursor events and CSS behavior
      $body.css('pointerEvents', '');

      if (platform.browser.isWebKit || platform.browser.isFirefox) {
        state.hasFormsToFix = state.hasFormsToFix || document.querySelector('select,body>input,button');
        if (state.hasFormsToFix) {
          require(['zoom-forms/zoom-forms'], function (zoomForms) {
            zoomForms.applyZoomFixes(state.completedZoom);
          });
        }
      }

      // When zooming is finished, we will restrict the width
      // Un-Blur text in Chrome
      repaintToEnsureCrispText();

      // notify all about zoom change
      events.emit('zoom', state.completedZoom);

      if (!state.isInitialLoadZoom) {
        conf.set('zoom', state.completedZoom);
        if (!didUnzoom) {
          require(['audio-cues/audio-cues'], function (audioCues) {
            audioCues.playZoomCue(state.completedZoom);
          });
        }
        new metric.ZoomChange(state.zoomInput).send();
      }

      clearZoomCallbacks();

      if (state.isInitialLoadZoom) {
        viewport.jumpToLocationHash();
      }

      state.isInitialLoadZoom = false;
      state.zoomInput = {};

      // Get next forward/backward glide animations ready.
      // Doing it now helps with performance, because stylesheet will be parsed and ready for next zoom.
      setTimeout(setupNextZoomStyleSheet, 0);

      restoreBodyTransitionStyle();
    }

    function cancelGlideChangeTimer() {
      if (glideChangeTimer) {
        clearInterval(glideChangeTimer);
        glideChangeTimer = 0;
      }
    }

    // Make sure the current zoom operation does not continue
    function clearZoomCallbacks() {
      // Ensure no further changes to zoom from this operation
      cancelFrame();
      clearTimeout(minZoomChangeTimer);
      clearTimeout(zoomBeginTimer);
      cancelGlideChangeTimer();
      $body.off(ANIMATION_END_EVENTS, onGlideStopped);
      $(window).off('keyup', finishGlideIfEnough);
    }

    // When an A button or +/- key is pressed, we always glide at least MIN_ZOOM_PER_CLICK.
    // This provides a consistent amount of zoom change for discrete presses.
    function finishGlideIfEnough() {
      if (!isGlideCurrentlyRunning()) {
        // Glide has started, but animation hasn't started yet -- we are waiting for
        // the ANIMATION_OPTIMIZATION_SETUP_DELAY period while the browser sets up for the animation.
        state.zoomInput.isLongGlide = false;  // beginGlideAnimation() will see this and setup it's own timer
        return;
      }

      // If MIN_ZOOM_PER_CLICK has not been reached, we set a timer to finish the zoom
      // based on how much time would be needed to achieve MIN_ZOOM_PER_CLICK
      var timeRemaining = Math.max(0, MIN_ZOOM_PER_CLICK * getMsPerXZoom() - state.elapsedZoomTime);

      state.zoomInput.isLongGlide = timeRemaining === 0;

      minZoomChangeTimer = setTimeout(finishGlideEarly, timeRemaining);
    }

    function freezeZoom() {
      state.currentTargetZoom = getActualZoom();
      $body.css(getZoomCss(state.currentTargetZoom));
      if (elementDotAnimatePlayer) {
        elementDotAnimatePlayer.onfinish = null;
        elementDotAnimatePlayer.cancel();
      }
      onGlideStopped();
    }

    function finishElementDotAnimate() {
      // We have to stop it like this so that we keep the current amount of zoom in the style attribute,
      // while the animation player is stopped so that it doesn't block future style attribute changes
      // from taking affect (e.g. via the slider)
      requestFrame(function() {
        if (elementDotAnimatePlayer) {
          elementDotAnimatePlayer.pause();
        }
        requestFrame(freezeZoom);
      });
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
      if (!shouldRepaintOnZoomChange) {
        return;
      }

      body.setAttribute(CRISPING_ATTRIBUTE, '');
      setTimeout(function() {
        body.removeAttribute(CRISPING_ATTRIBUTE);
      }, REPAINT_FOR_CRISP_TEXT_DELAY);

      var MAX_ZINDEX = 2147483647,
        appendedDiv = $('<sc>')
          .css({
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 1,
            backgroundColor: 'transparent',
            zIndex: MAX_ZINDEX,
            pointerEvents: 'none'
          })
          .appendTo('html');
      setTimeout(function () {
        appendedDiv.remove();
      }, 0);
    }

    // A glide operation is finishing. Use the current state of the zoom animation for the final zoom amount.
    function finishGlideEarly() {
      cancelGlideChangeTimer();

      // Stop element.animate player
      if (elementDotAnimatePlayer) {
        finishElementDotAnimate();
        return;
      }

      // JS zoom operation
      if (!shouldUseKeyFramesAnimation()) {
        state.currentTargetZoom = getMidAnimationZoom();
        finishZoomOperation();
        return;
      }

      // Stop key frames or element.animate
      zoomAnimator = requestFrame(function () {
        // Stop the key-frame animation at the current zoom level
        // Yes, it's crazy, but this sequence helps the zoom stop where it is supposed to, and not jump back a little
        $body.css({
          animationPlayState: 'paused'
        });
        zoomAnimator = requestFrame(function() {
          state.currentTargetZoom = getActualZoom();
          onGlideStopped();
        });
      });
    }

    // Get the current zoom value as reported by the layout engine
    function getActualZoom() {
      return restrictZoom.toValidRange(common.getComputedScale(body));
    }

    function updateSlider() {
      if (thumbChangeListener) {
        glideChangeTimer = setInterval(onGlideChange, GLIDE_CHANGE_INTERVAL_MS);
      }
    }

    function chooseZoomStrategy(shouldPerformContinualUpdates) {
      if (shouldPerformContinualUpdates) {
        zoomAnimator = requestFrame(performContinualZoomUpdates);
      }
      else {
        performInstantZoomOperation();
      }
    }

    //If there is a transition style applied to the body, we need to be sure that it doesn't apply to transformations
    //otherwise our zoom logic will break
    function fixBodyTransitionStyle() {
      var style  = getComputedStyle(body),
        property = style.transitionProperty,
        delay    = style.transitionDelay.split(',').some(function (dly) {
          return parseFloat(dly);
        }),
        duration;

        if (!delay) {
          duration = style.transitionDuration.split(',').some(function (drtn) {
            return parseFloat(drtn);
          });
        }

      if (!delay && !duration) {
        return;
      }

      if (property.indexOf('all') >= 0 || property.indexOf('transform') >= 0) {
        cachedTransitionProperty = body.style.transition;
        if (body.style.transition) {
          body.style.transition += ', ';
        }
        body.style.transition += 'transform 0s';
      }

    }

    //Restore the intended inline style when we're done transforming the body
    function restoreBodyTransitionStyle() {
      if (typeof cachedTransitionProperty === 'string') {
        body.style.transition = cachedTransitionProperty;
      }
      cachedTransitionProperty = null;
    }

    // Allow one listener for all zoom updates, even mid-animation.
    // These occur when the user holds down A, a, +, - (as opposed to conf.set and the 'zoom' event which occur at the end)
    // Currently only supports one listener.
    // It has to be fast, otherwise it will affect zoom performance.
    function setThumbChangeListener(listener) {
      thumbChangeListener = listener;
    }

    function init() {
      if (isInitialized) {
        return;
      }
      isInitialized = true;
      viewport.init();
      //This module is initialized after body has been parsed
      body = document.body;
      $body = $(body);
      shouldUseElementDotAnimate = platform.browser.isChrome && body.animate;
      shouldOptimizeLegibility   = platform.browser.isChrome && platform.os.isWin;
      shouldRepaintOnZoomChange  = platform.browser.isChrome;
      TRANSFORM_PROP_CSS         = platform.transformPropertyCss;
    }

    return {
      beginZoomOperation: beginZoomOperation,
      beginGlide: beginGlide,
      performInstantZoomOperation: performInstantZoomOperation,
      performJsAnimateZoomOperation: performJsAnimateZoomOperation,
      isZoomOperationRunning: isZoomOperationRunning,
      finishZoomOperation: finishZoomOperation,
      finishZoomSliderOperation: finishZoomSliderOperation,
      finishGlideIfEnough: finishGlideIfEnough,
      updateSlider: updateSlider,
      chooseZoomStrategy: chooseZoomStrategy,
      cancelFrame: cancelFrame,
      cancelGlideChangeTimer: cancelGlideChangeTimer,
      fixZoomBodyCss: fixZoomBodyCss,
      getZoomCss: getZoomCss,
      setThumbChangeListener: setThumbChangeListener,
      init: init
    };

  });
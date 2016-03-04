/**
 * Smooth zoom
 * See docs at https://equinox.atlassian.net/wiki/display/EN/Smooth+Zoom
 */

define(['$', 'core/conf/user/manager', 'core/conf/site', 'core/platform', 'page/util/common', 'core/metric', 'core/events'],
  function ($, conf, site, platform, common, metric, events) {

  // Default zoom configuration

  // Can be customized via provideCustomConfig()
  var zoomConfig = {
      // Should smooth zoom animations be enabled?
      shouldSmoothZoom: true
    },

    // Body-related
    body,
    $body,
    originalBodyInfo,        // The info we have on the body, including the rect and mainNode

    // Key frame animations
    $zoomStyleSheet,                 // <style> element we insert for animations (and additional fixes for zoom)

    // Zoom operation state
    isInitialized,           // Is the zoom module already initialized?
    minZoomChangeTimer,      // Keep zooming at least for this long, so that a glide does a minimum step
    zoomAnimator,            // Frame request ID that can be cancelled
    elementDotAnimatePlayer, // AnimationPlayer used in some browsers (element.animate)
    completedZoom = 1,       // Current zoom as of the last finished operation
    currentTargetZoom = 1,   // Zoom we are aiming for in the current operation
    startZoomTime,           // If no current zoom operation, this is cleared (0 or undefined)
    isInitialLoadZoom = false, // Is this the initial zoom for page load? (The one based on previous user settings)
    hasFormsToFix,

    // Zoom slider change listener
    thumbChangeListener,    // Supports a single listener that is called back as animation proceeds
    glideChangeTimer,       // Timer used for callbacks
    GLIDE_CHANGE_INTERVAL_MS = 30,  // How often to call back with a new zoom value

    // Metrics info
    zoomInput = {},

    // Function to call for requesting an animation frame
    requestFrame = window.requestAnimationFrame || window.msRequestAnimationFrame ||
      function(fn) { return setTimeout(fn, 16); },  // 16ms is about 60fps

    // State to help with animation optimizations and will-change
    zoomBeginTimer, // Timer before zoom can actually begin (waiting for browser to create composite layer)
    clearAnimationOptimizationTimer,   // Timer to clear will-change when zoom is finished
    isPanelOpen,   // True if the panel is open

    // State to help determine when pinch/unpinch ends (ctrl+wheel events)
    unpinchEndTimer,

    // Should document scrollbars be calculated by us?
    // Should always be true for IE, because it fixes major positioning bugs
    shouldManuallyAddScrollbars = platform.browser.isIE,

    // Should we repaint when zoom is finished (after any animations)?
    // Should always be true in Chrome, because it makes text crisper
    // Don't use backface repainting method if there is a background-image on the <body>, because it will be erased.
    // (We still want to use the backface method when we can, because it often produces better results than our
    // other method, which is to overlay a transparent div and then remove it)
    shouldRepaintOnZoomChange = platform.browser.isChrome,

    // Is the will-change CSS property supported? And should we use it?
    shouldUseWillChangeOptimization,

    // Should we use the Web Animations API (element.animate) ?
    shouldUseElementDotAnimate,

    // Optimize fonts for legibility? Helps a little bit with Chrome on Windows
    shouldOptimizeLegibility = platform.browser.isChrome && platform.os.isWin,

    // Constants
    MIN_ZOOM_PER_CLICK = 0.2,  // Change zoom at least this amount if user clicks on A button or presses +/- or left/right in slider

    MS_PER_X_ZOOM_GLIDE = 1400, // For animations, the number of milliseconds per unit of zoom (e.g. from 1x to 2x)
    MS_PER_X_ZOOM_SLIDER = 500, // For click in slider
    ZOOM_PRECISION = 3, // Decimal places allowed
    SITECUES_ZOOM_ID = 'sitecues-js-zoom',
    ANIMATION_END_EVENTS = 'animationend webkitAnimationEnd MSAnimationEnd',
    TRANSFORM_PROP_CSS = platform.transformPropertyCss,
    MIN_RECT_SIDE = 4,
    ANIMATION_OPTIMIZATION_SETUP_DELAY = 20,   // Provide extra time to set up compositor layer if a key is pressed
    CLEAR_ANIMATION_OPTIMIZATION_DELAY = 7000,  // After zoom, clear the will-change property if no new zoom occurs within this amount of time
    REPAINT_FOR_CRISP_TEXT_DELAY = 100,          // This is conjured out of thin air. Just seems to work.
    CRISPING_ATTRIBUTE = 'data-sc-crisp',
    UNPINCH_END_DELAY = 150,
    UNPINCH_POWER = 0.015; // How much the unpinch delta affects zoom

  // ------------------------ PUBLIC -----------------------------

  // Values used for zoom math
  // TODO should these be getters? Doing it via direct access variables is legacy.
  var MAX = 3,
    MIN = 1,
    STEP = 0.01,
    RANGE = MAX - MIN;

  // Is this the zoom that occurs on page load?
  function getIsInitialZoom() {
    return isInitialLoadZoom;
  }

  // Allow customization of zoom configuration on a per-website basis
  function provideCustomZoomConfig(customZoomConfig) {
    $.extend(zoomConfig, customZoomConfig);
  }

  // Use to jump the current zoom immediately to the targetZoom requested
  // The use case for this is currently the zoom slider
  function jumpTo(targetZoom) {
    var shouldPerformContinualUpdates = !shouldFixFirefoxScreenCorruptionBug();
    if (!isZoomOperationRunning()) {
      // 1st call -- we will glide to it, it may be far away from previous zoom value
      beginZoomOperation(targetZoom, {isSlider: true}); // Get ready for more slider updates
      if (shouldPerformContinualUpdates && targetZoom !== completedZoom) {
        performJsAnimateZoomOperation();
        if (thumbChangeListener) {
          glideChangeTimer = setInterval(onGlideChange, GLIDE_CHANGE_INTERVAL_MS);
        }
      }
    } else {
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
  }

  function resetZoom() {
    if (completedZoom > 1) {
      beginZoomOperation(1, {});
      performInstantZoomOperation();
      finishZoomOperation();
    }
  }

  // This is the body's currently visible width, with zoom factored in
  function getBodyWidth() {
    // Use the originally measured visible body width
    initBodyInfo();

    // If width was restricted
    var divisorUsedToRestrictWidth = shouldRestrictWidth() ? getZoomForWidthRestriction(completedZoom, window.innerWidth) : 1;

    // Multiply be the amount of zoom currently used
    return completedZoom * originalBodyInfo.width / divisorUsedToRestrictWidth;
  }

  function getBodyRight() {
    initBodyInfo();

    return originalBodyInfo.right * completedZoom;
  }

  function getBodyLeft() {
    initBodyInfo();

    return originalBodyInfo.leftMostNode.getBoundingClientRect().left + window.pageXOffset;
  }

  function getMainNode() {
    initBodyInfo();

    return originalBodyInfo.mainNode;
  }

  function getCompletedZoom() {
    return completedZoom;
  }

  // Allow one listener for all zoom updates, even mid-animation.
  // These occur when the user holds down A, a, +, - (as opposed to conf.set and the 'zoom' event which occur at the end)
  // Currently only supports one listener.
  // It has to be fast, otherwise it will affect zoom performance.
  function setThumbChangeListener(listener) {
    thumbChangeListener = listener;
  }

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

    // ---- Slider drag ----
    if (zoomInput.isSliderDrag) {
      cancelFrame(zoomAnimator);
      finishZoomOperation();
      return;
    }

    // ---- Slider click ----
    // Is in the middle of gliding to a zoom click -- this always uses JS.
    // Let it finish -- the animation's end will cause finishZoomOperation() to be called
    zoomInput.isSliderClick = true;
  }

  // Should smooth zoom be used or step zoom?
  // In dev, we can override as follows:
  // Shift-key: Script-based smooth zoom
  // Ctrl-key: CSS-based smooth zoom
  function shouldSmoothZoom() {
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

    // Only IE10 and up can do CSS animate.
    var isOldIE = platform.browser.isIE && platform.browser.version < 10,
        isSafari = platform.browser.isSafari,
        restrictingWidthInSafari = isSafari && shouldRestrictWidth();

    return shouldSmoothZoom()   &&
      !isOldIE                  &&
      // Safari is herky jerky if animating the width and using key frames
      // TODO fix initial load zoom with jsZoom -- not doing anything
      !restrictingWidthInSafari &&
      // Chrome will use element.animate();
      !shouldUseElementDotAnimate;
  }

  // Should we wait for browser to create compositor layer?
  function shouldPrepareAnimations() {
    // In case zoom module isn't initialized yet, safely provide 'body' in local scope.
    return shouldUseWillChangeOptimization &&
      body.style.willChange === ''         && // Animation property not set yet: give browser time to set up compositor layer
      !shouldRestrictWidth();
  }

  // Avoid evil Firefox insanity bugs, where zoom animation jumps all over the place on wide window with Retina display
  function shouldFixFirefoxScreenCorruptionBug() {
    return platform.browser.isFirefox && platform.browser.version < 33 && platform.isRetina() &&
      window.outerWidth > 1024;
  }

  function shouldRestrictWidth() {
    return zoomConfig.isFluid;
  }

  // Make sure the zoom value is within the min and max, and does not use more decimal places than we allow
  function getSanitizedZoomValue(value) {
    value = parseFloat(value);

    // value is too small
    if (!value || value < MIN) {
      return MIN;
    }

    // value is too big
    if (value > MAX){
      return MAX;
    }

    // value have float value
    return parseFloat(value.toFixed(ZOOM_PRECISION));
  }

  function beginZoomIncrease(event) {
    // Increase up to max or until zoomStopRequested()
    beginGlide(MAX, event);
  }

  function beginZoomDecrease(event) {
    beginGlide(MIN, event);
  }

  // Begin an operation to the glide toward the current zoom, if smooth zoom is currently supported.
  // If no smooth zoom, apply an instant zoom change to increase or decrease zoom by a constant amount.
  // If we are zooming with +/- or clicking A/a
  function beginGlide(targetZoom, event) {
    if (!isZoomOperationRunning() && targetZoom !== completedZoom) {
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
          var delta = MIN_ZOOM_PER_CLICK * (completedZoom < targetZoom ? 1 : -1);
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
      glideChangeTimer = setInterval(onGlideChange, GLIDE_CHANGE_INTERVAL_MS);
      if (!zoomInput.isLongGlide) {
        // Button/key was already released, zoom only for long enough to get minimum zoom
        var delta = MIN_ZOOM_PER_CLICK * (completedZoom < targetZoom ? 1 : -1);
        currentTargetZoom = getSanitizedZoomValue(completedZoom + delta);
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

  function getMsPerXZoom() {
    return zoomInput.isSlider ? MS_PER_X_ZOOM_SLIDER : MS_PER_X_ZOOM_GLIDE;
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
    if (thumbChangeListener) {
      thumbChangeListener(getMidAnimationZoom());
    }
  }

  // How many milliseconds have elapsed since the start of the zoom operation?
  function getZoomOpElapsedTime() {
    return Date.now() - startZoomTime;
  }

  // When an A button or +/- key is pressed, we always glide at least MIN_ZOOM_PER_CLICK.
  // This provides a consistent amount of zoom change for discrete presses.
  function finishGlideIfEnough() {
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

  function freezeZoom() {
    currentTargetZoom = getActualZoom();
    $body.css(getZoomCss(currentTargetZoom));
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
      currentTargetZoom = getMidAnimationZoom();
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
        currentTargetZoom = getActualZoom();
        onGlideStopped();
      });
    });
  }

  function zoomStopRequested() {
    if (isZoomOperationRunning()) {
      if (zoomInput.isSlider) {
        finishZoomSliderOperation();
      }
      else {   // "A" button or +/- keypress
        finishGlideIfEnough();
      }
    }
  }

  // Get the current zoom value as reported by the layout engine
  function getActualZoom() {
    return getSanitizedZoomValue(common.getComputedScale(body));
  }

  function onGlideStopped() {
    if (elementDotAnimatePlayer) {
      // If we don't do this, then setting CSS directly on body no longer works
      // (May not have been cancelled if user holds + and reaches 3 or holds - and reaches 1)
      elementDotAnimatePlayer.cancel();
      elementDotAnimatePlayer = null;
    }
    $body
      .css(getZoomCss(currentTargetZoom))
      .css('animation', '');
    finishZoomOperation();
  }

  // Go directly to zoom. Do not pass go. But do collect the $200 anyway.
  function performInstantZoomOperation() {
    var zoomCss = getZoomCss(currentTargetZoom);
    if (platform.browser.isChrome && document.body.animate) {
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
      thumbChangeListener(currentTargetZoom);
    }
  }

  function performElementDotAnimateZoomOperation() {
    var animationMs = Math.abs(currentTargetZoom - completedZoom) * MS_PER_X_ZOOM_GLIDE;
    elementDotAnimatePlayer = body.animate(
      getAnimationKeyFrames(currentTargetZoom),
      {
        duration: animationMs,
        iterations: 1,
        fill: 'forwards',
        easing: isInitialLoadZoom ? 'ease-out' : 'linear'
      });
    elementDotAnimatePlayer.onfinish = onGlideStopped;
  }

  function isSliderActive() {
    return zoomInput.isSlider && !zoomInput.isSliderClick;
  }

  // Animate until the currentTargetZoom, used for gliding zoom changes
  // Use falsey value for isTargetZoomStable for slider zoom, where the
  // target keeps changing as the slider moves
  function performJsAnimateZoomOperation() {
    function jsZoomStep(/*currentTime*/) {  // Firefox passes in a weird startZoomTime that can't be compared with Date.now()
      var midAnimationZoom = getMidAnimationZoom();
      $body.css(getZoomCss(midAnimationZoom));
      if (midAnimationZoom === currentTargetZoom && !isSliderActive()) {
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
    var zoomSpeedMs = Math.abs(currentTargetZoom - completedZoom) * getMsPerXZoom(),
      animationCss = {
        animation: getAnimationName(currentTargetZoom)  + ' ' + zoomSpeedMs + 'ms linear',
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
        if (completedZoom > MIN) {
          // Style sheet for reverse zoom (zoom-out to 1x)
          css += getAnimationCSS(MIN);
        }
        if (completedZoom < MAX) {
          // Style sheet for forward zoom (zoom-in to 3x)
          css += getAnimationCSS(MAX);
        }
      }
    }

    css += getCssCrispingFixes();

    applyZoomStyleSheet(css);
  }

  function getAnimationName(targetZoom) {
    return SITECUES_ZOOM_ID + '-' + Math.round(completedZoom * 1000) + '-' + Math.round(targetZoom * 1000);
  }

  function getAnimationKeyFrames(targetZoom, doEase, doIncludeTimePercent) {
    var timePercent,
      animationPercent,
      step = 0,
      // For animation performance, use adaptive algorithm for number of keyframe steps:
      // Bigger zoom jump = more steps
      numSteps = Math.ceil(Math.abs(targetZoom - completedZoom) * 20),
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
      var midAnimationZoom = completedZoom + (targetZoom - completedZoom) * animationPercent;
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
      keyFrames = getAnimationKeyFrames(targetZoom, isInitialLoadZoom, true),
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

  // Must be called before beginning any type zoom operation, to set up the operation.
  function beginZoomOperation(targetZoom, input, animationReadyCallback) {
    // Initialize zoom input info
    zoomInput = $.extend({
      isSlider: false,                  // Slider in panel
      isSliderDrag: false,             // True if the user drags the slider (as opposed to clicking in it)
      isSliderClick: false,            // True if the user dragged the slider and now stopped
      isLongGlide: false,              // Key or A button held down to glide extra
      isKey: false,
      isButtonPress: false,            // Small or large A in panel
      fromZoom: completedZoom           // Old zoom value
    }, input);

    // Make sure we're ready
    initBodyInfo();

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

      events.emit('zoom/begin');

      if (animationReadyCallback) {
        animationReadyCallback();
      }
    }

    if (shouldPrepareAnimations()) {
      // Wait for key frames animation style sheet to be applied and for compositor layer to be created
      prepareAnimationOptimizations();
      zoomBeginTimer = setTimeout(beginZoomOperationAfterDelay, ANIMATION_OPTIMIZATION_SETUP_DELAY);
      startZoomTime = Date.now(); // Will be set to start of animation time after animation begins
    } else {
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

  // After the user's initial zoom we need to realign any location hash target to the top of the screen
  function jumpToLocationHash() {
    var hash = document.location.hash,
      EXTRA_SPACE_SCROLL_TOP = 60;
    if (hash) {
      try {  // Not all ids are necessarily valid -- protect against that
        var elem = document.querySelector(hash + ',[name="' + hash.substring(1) + '"]');
        if (elem) {
          elem.scrollIntoView(true);
          window.scrollBy(0, -EXTRA_SPACE_SCROLL_TOP);
        }
      }
      catch(ex) {}
    }
  }

  // Must be called at the end of a zoom operation.
  function finishZoomOperation() {
    if (elementDotAnimatePlayer) {
      // Can't leave animation player around, as it will prevent future animations
      $body.css(getZoomCss(currentTargetZoom));
      elementDotAnimatePlayer.onfinish = null;
      elementDotAnimatePlayer.cancel();
    }

    var didUnzoom = completedZoom > currentTargetZoom;

    completedZoom = getActualZoom();
    startZoomTime = 0;

    if (didUnzoom) {
      maximizeContentVisibility();
    }

    // Remove and re-add scrollbars -- we will re-add them after zoom if content is large enough
    determineScrollbars();

    // Restore mouse cursor events and CSS behavior
    $body.css('pointerEvents', '');

    if (platform.browser.isWebKit || platform.browser.isFirefox) {
      hasFormsToFix = hasFormsToFix || document.querySelector('select,body>input,button');
      if (hasFormsToFix) {
        require(['zoom-forms/zoom-forms'], function (zoomForms) {
          zoomForms.applyZoomFixes(completedZoom);
        });
      }
    }

    // When zooming is finished, we will restrict the width
    // Un-Blur text in Chrome
    repaintToEnsureCrispText();

    // notify all about zoom change
    events.emit('zoom', completedZoom);

    if (!isInitialLoadZoom) {
      conf.set('zoom', completedZoom);
      if (!didUnzoom) {
        require(['audio-cues/audio-cues'], function (audioCues) {
          audioCues.playZoomCue(completedZoom);
        });
      }
      new metric.ZoomChange(zoomInput).send();
    }

    clearZoomCallbacks();

    if (isInitialLoadZoom) {
      jumpToLocationHash();
    }

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
    if (shouldUseWillChangeOptimization) { // Is will-change supported?
      // This is a CSS property that aids performance of animations
      $body.css('willChange', TRANSFORM_PROP_CSS);
    }
  }

  function clearAnimationOptimizations() {
    if (!isZoomOperationRunning()) {
      $body.css('willChange', '');
      clearTimeout(clearAnimationOptimizationTimer);
      clearAnimationOptimizationTimer = null;
    }
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
      bodyHeight = document.body.scrollHeight,
      winWidth = window.innerWidth,
      winHeight = window.innerHeight,
      hScrollNow = window.pageXOffset,
      vScrollNow = window.pageYOffset,
      // How much do we need to scroll by to pull content to the bottom-right corner
      hScrollDesired = Math.max(0, winWidth - bodyRight), // Amount to pull right as a positive number
      vScrollDesired = Math.max(0, winHeight - bodyHeight), // Amount to pull down as a positive number
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

  // Cancel any currently requested animation frame
  function cancelFrame(id) {
    var cancel = window.cancelAnimationFrame || window.msCancelRequestAnimationFrame;
    if (cancel) {
      cancel(id);
    }
    else {
      clearTimeout(id);
    }
  }

  // Add useful zoom fixes to the body's @style
  function fixZoomBodyCss() {
    // Allow the content to be horizontally centered, unless it would go
    // offscreen to the left, in which case start zooming the content from the left-side of the window
    body.style[platform.transformOriginProperty] = shouldRestrictWidth() ? '0 0' : '50% 0';
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

  // Get a CSS object for the targetZoom level
  function getZoomCss(targetZoom) {
    var transform = 'scale(' + targetZoom.toFixed(ZOOM_PRECISION) + ') ' + getFormattedTranslateX(targetZoom),
      css = {};

    css[TRANSFORM_PROP_CSS] = transform;
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

    // For a short period of time, we tried the following, in a commit that suggested it helped reduce horizontal panning.
    // However, that change led to SC-3191
    //var winWidth = originalBodyInfo.width;

    return winWidth / getZoomForWidthRestriction(currZoom, winWidth) + 'px';
  }

  // Return a formatted string for translateX as required by CSS
  function getFormattedTranslateX(targetZoom) {
    if (shouldRestrictWidth()) {
      return '';  // For fluid layouts, we use an transform-origin of 0% 0%, so we don't need this
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
    var origWidth = originalBodyInfo.mainNode.clientWidth,
      newWidth,
      isFluid;
    body.style.width = (window.innerWidth / 5) + 'px';
    newWidth = originalBodyInfo.mainNode.clientWidth;
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

    bodyInfo.mainNode = mainNode || document.body;
    bodyInfo.leftMostNode = leftMostNode;
    bodyInfo.rightMostNode = rightMostNode;
    bodyInfo.transformOriginX = body.getBoundingClientRect().width / 2;

    return bodyInfo;
  }

  function willAddRect(newRect, node, style, parentStyle, isStrict) {
    if (node === document.body) {
      return;
    }

    // Strict checks
    if (isStrict) {
      if (node.childNodes.length === 0 ||
        newRect.width < MIN_RECT_SIDE || newRect.height < MIN_RECT_SIDE ||
        // Watch for text-align: center or -webkit-center -- these items mess us up
        style.textAlign.indexOf('center') >= 0) {
        return;
      }
    }

    // Must check
    if (newRect.left < 0 || newRect.top < 0 ||
      style.visibility !== 'visible') {
      return;
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
    if (style.overflow !== 'visible' || !common.hasVisibleContent(node, style, parentStyle)) {
      return; // No visible content
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
      //For some reason, Edge will run this function despite there not being any element children belonging to the element. Edge...
      //TODO: Remove this conditional if Edge ever gets its act together. Reproducible here: www.njstatelib.org
      //NOTE: Does not reproduce when the console is open. Yeah that was a fun one to figure out
      if (this.nodeType === 1) {
        getBodyRectImpl(this, sumRect, visibleNodes, style, isStrict);
      }
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
      width = clientRect.width, //  Math.max(node.scrollWidth, clientRect.width),
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

  // Ensure that initial body info is ready
  function initBodyInfo() {
    if (originalBodyInfo) {
      return; //Already initialized
    }

    body = document.body;
    $body = $(body);
    originalBodyInfo = getBodyInfo();

    // Wait until document.body is available to init
    shouldUseElementDotAnimate = platform.browser.isChrome && body.animate;

    // Not necessary to use CSS will-change with element.animate()
    // Putting this on the <body> is too much. We saw the following message in Firefox's console:
    // Will-change memory consumption is too high. Surface area covers 2065500 pixels, budget is the document
    // surface area multiplied by 3 (450720 pixels). All occurrences of will-change in the document are
    // ignored when over budget.
//    shouldUseWillChangeOptimization =
//      typeof body.style.willChange === 'string' && !shouldUseElementDotAnimate;
  }

  function performInitialLoadZoom(initialZoom) {
    var targetZoom = getSanitizedZoomValue(initialZoom);

    if (targetZoom === 1) {
      return;
    }

    if (!document.body) {
      // Wait until <body> is ready
      // This can happen in the case of extension which loads very fast
      // In the future, extension may try to zoom sooner rather than waiting for entire document to load
      events.on('bp/did-complete', function() { performInitialLoadZoom(targetZoom); }); // Zoom once badge is ready
      return;
    }

    isInitialLoadZoom = true;
    beginGlide(targetZoom);
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

    $body.css({width: '', transform: ''});
    originalBodyInfo = getBodyInfo();
    $body.css(getZoomCss(completedZoom));
    if (shouldRestrictWidth()) {
      // Restrict the width of the body so that it works similar to browser zoom
      // Documents designed to fit the width of the page still will
      $body.css('width', getRestrictedWidth(completedZoom));
    }
    determineScrollbars();
    events.emit('resize');
  }

  // We capture ctrl+wheel events because those are actually pinch/unpinch events
  function onMouseWheel(event) {
    if (!event.ctrlKey) {
      return;  // Not an unpinch event
    }

    var delta = -event.deltaY * UNPINCH_POWER;
    var targetZoom = isZoomOperationRunning() ? currentTargetZoom + delta : completedZoom + delta;

    clearTimeout(unpinchEndTimer);
    unpinchEndTimer = setTimeout(finishZoomOperation, UNPINCH_END_DELAY);
    if (!isZoomOperationRunning()) {
      // 1st call -- we will glide to it, it may be far away from previous zoom value
      beginZoomOperation(targetZoom, {isUnpinch: true}); // Get ready for more slider updates
    }

    currentTargetZoom = getSanitizedZoomValue(targetZoom); // Change target
    performInstantZoomOperation();
    event.preventDefault();
  }

  function init(wheelEvent) {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    // Use conf module for sharing current zoom level value
    conf.def('zoom', getSanitizedZoomValue);

    // ATKratter wouldn't scroll when we listened to this on the window
    document.addEventListener('wheel', onMouseWheel);  // Ctrl+wheel = unpinch

    initBodyInfo();

    events.on('bp/will-expand', function () {
      isPanelOpen = true;
      if (shouldPrepareAnimations()) {
        prepareAnimationOptimizations();
      }
    });
    events.on('bp/did-shrink', function () {
      isPanelOpen = false;
      clearAnimationOptimizations(); // Browser can reclaim resources used
    });

    $.extend(zoomConfig, {
      // Does the web page use a fluid layout, where content wraps to the width?
      isFluid: site.get('isFluid'), // Can override in site preferences

      // Should the width of the page be restricted as zoom increases?
      // This is helpful for pages that try to word-wrap or use a fluid layout.
      // Eventually use fast page health calculation to automatically determine this
      // Assumes window width of 1440 (maximized screen on macbook)
      maxZoomToRestrictWidthIfFluid: site.get('maxRewrapZoom') || 1.5,

      // Set to 5 on sites where the words get too close to the left window's edge
      leftMarginOffset: site.get('leftMarginOffset') || 2
    });

    if (typeof zoomConfig.isFluid === 'undefined') {
      zoomConfig.isFluid = isFluidLayout();
    }

    $(window).resize(onResize);

    fixZoomBodyCss(); // Get it read as soon as zoom might be used

    if (wheelEvent) {
      onMouseWheel(wheelEvent);
    }
    events.emit('zoom/init');
  }

  return {
    MAX: MAX,
    MIN: MIN,
    STEP: STEP,
    RANGE: RANGE,
    getIsInitialZoom: getIsInitialZoom,
    provideCustomZoomConfig: provideCustomZoomConfig,
    jumpTo: jumpTo,
    beginZoomIncrease: beginZoomIncrease,
    beginZoomDecrease: beginZoomDecrease,
    getBodyWidth: getBodyWidth,
    getBodyRight: getBodyRight,
    getBodyLeft: getBodyLeft,
    getMainNode: getMainNode,
    getCompletedZoom: getCompletedZoom,
    setThumbChangeListener: setThumbChangeListener,
    resetZoom: resetZoom,
    zoomStopRequested: zoomStopRequested,
    performInitialLoadZoom: performInitialLoadZoom,
    init: init
  };

});

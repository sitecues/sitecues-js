/*jshint -W072 */ //Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
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
    'page/viewport/viewport',
    'page/zoom/util/body-geometry',
    'page/zoom/util/restrict-zoom',
    'page/zoom/style',
    'page/viewport/scrollbars'
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
    restrictZoom,
    style,
    scrollbars
  ) {
/*jshint +W072 */

  'use strict';

  var
    isInitialized,
    body, $origBody,
    // Zoom operation state
    minZoomChangeTimer,      // Keep zooming at least for this long, so that a glide does a minimum step
    zoomAnimator,            // Frame request ID that can be cancelled
    elementDotAnimatePlayer, // AnimationPlayer used in some browsers (element.animate)

    // Zoom slider change listener
    thumbChangeListener,    // Supports a single listener that is called back as animation proceeds
    glideChangeTimer,       // Timer used for callbacks

    // Function to call for requesting an animation frame
    requestFrame = window.requestAnimationFrame,

    // State to help with animation optimizations and will-change
    zoomBeginTimer, // Timer before zoom can actually begin (waiting for browser to create composite layer)

    // Should we use the Web Animations API (element.animate) ?
    shouldUseElementDotAnimate,

    // Constants
    // Change zoom at least this amount if user clicks on A button or presses +/- or left/right in slider
    MIN_ZOOM_PER_CLICK       = constants.MIN_ZOOM_PER_CLICK,

    // For animations, the number of milliseconds per unit of zoom (e.g. from 1x to 2x)
    MS_PER_X_ZOOM_GLIDE      = constants.MS_PER_X_ZOOM_GLIDE,

    // For click in slider
    MS_PER_X_ZOOM_SLIDER     = constants.MS_PER_X_ZOOM_SLIDER,

    // How often to call back with a new zoom value
    GLIDE_CHANGE_INTERVAL_MS = constants.GLIDE_CHANGE_INTERVAL_MS,
    ANIMATION_END_EVENTS     = constants.ANIMATION_END_EVENTS;

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
      fromZoom: state.completedZoom    // Old zoom value
    }, input);

    // Make sure we're ready
    bodyGeo.init();

    style.fixBodyTransitions();

    // Ensure no other operation is running
    clearZoomCallbacks();

    state.currentTargetZoom = restrictZoom.toValidRange(targetZoom);

    // Add what we need in <style> if we haven't already
    if (!style.getZoomStyleSheet()) {
      style.setupNextZoomStyleSheet(state.currentTargetZoom, shouldUseKeyFramesAnimation());
    }

    // Correct the start zoom time with the real starting time
    state.startZoomTime = Date.now();

    $('body')
      // Temporarily disable mouse cursor events and CSS behavior, to help with zoom performance
      .css('pointer-events', 'none')
      // Temporarily indicate that zooming is in progress -- this is used by the sitecues-zoom-form-fix stylesheet
      .attr('data-sc-zooming', '');

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
        performElementDotAnimateZoomOperation();
      }
      else if (shouldUseKeyFramesAnimation()) {
        performKeyFramesZoomOperation();
      }
      else {
        performJsAnimateZoomOperation();
      }

    }
  }

  // Cancel any currently requested animation frame
  function cancelFrame() {
    window.cancelAnimationFrame(zoomAnimator);
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

  // If smooth zoom is used, which kind -- JS or CSS keyframes?
  // In dev, we can override default behavior as follows:
  // Shift-key: Script-based
  // Ctrl-key: CSS-based
  function shouldUseKeyFramesAnimation() {

    var restrictingWidthInSafari = platform.browser.isSafari && config.shouldRestrictWidth;

    return !platform.browser.isIE &&  // IE/Edge are working better with JS animation
      !restrictingWidthInSafari &&  // Safari is herky jerky if animating the width and using key frames
      !shouldUseElementDotAnimate;  // Chrome will use element.animate();
  }

  // Animate until the currentTargetZoom, used for gliding zoom changes
  // Use falsey value for isTargetZoomStable for slider zoom, where the
  // target keeps changing as the slider moves
  function performJsAnimateZoomOperation() {
    function jsZoomStep() {  // Firefox passes in a weird startZoomTime that can't be compared with Date.now()
      var midAnimationZoom = getMidAnimationZoom();
      $origBody.css(style.getZoomCss(midAnimationZoom));
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
    //This needs to get the transform animation, and apply it to zoom targets
    //It also needs to get the width animation, and apply it to the primary body
    //body:first-child { width animation }
    var zoomSpeedMs = Math.abs(state.currentTargetZoom - state.completedZoom) * getMsPerXZoom(),
      //the animation names need to be tied to the specific keyframes (primary body vs. other zoom targets)
      //perhaps we should include zoom target index, with the 0th index always being the primary body
      animationCss = {
        animation: style.getCssAnimationName(state.currentTargetZoom)  + ' ' + zoomSpeedMs + 'ms linear',
        animationPlayState: 'running',
        fillMode: 'forwards'
      };

    // Apply the new CSS
    $origBody.css(animationCss);

    // No zoomStopRequested() received for initial zoom
    $origBody.one(ANIMATION_END_EVENTS, onGlideStopped);
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
      keyFrames[step] = style.getZoomCss(midAnimationZoom);
      if (doIncludeTimePercent) {
        keyFrames[step].timePercent = timePercent;
      }
    }
    return keyFrames;
  }

  // Go directly to zoom. Do not pass go. But do collect the $200 anyway.
  function performInstantZoomOperation() {
    var zoomCss = style.getZoomCss(state.currentTargetZoom);
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
      $origBody.css(zoomCss);
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
    $origBody
      .css(style.getZoomCss(state.currentTargetZoom))
      .css('animation', '');
    finishZoomOperation();
  }

  // Must be called at the end of a zoom operation.
  function finishZoomOperation() {
    if (elementDotAnimatePlayer) {
      // Can't leave animation player around, as it will prevent future animations
      $origBody.css(style.getZoomCss(state.currentTargetZoom));
      elementDotAnimatePlayer.onfinish = null;
      elementDotAnimatePlayer.cancel();
    }

    var didUnzoom   = state.completedZoom > state.currentTargetZoom;

    state.completedZoom = getActualZoom();
    state.fixedZoom     = restrictZoom.forFixedZoomTarget(state.completedZoom);
    state.startZoomTime = 0;

    if (didUnzoom) {
      bodyGeo.maximizeContentVisibility();
    }

    // Remove and re-add scrollbars -- we will re-add them after zoom if content is large enough
    // Only determine scrollbars for IE
    scrollbars.onBodyRectChange(bodyGeo.computeBodyInfo());

    // Restore mouse cursor events and CSS behavior
    $('body').css('pointerEvents', '');

    style.applyZoomFormFixes(state.completedZoom);

    // Indicate that zooming has finished -- this is used by the sitecues-zoom-form-fix stylesheet
    setTimeout(function() {
      $('body').removeAttr('data-sc-zooming');
    }, 0);

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
    setTimeout(style.setupNextZoomStyleSheet, 0, null, shouldUseKeyFramesAnimation());

    style.restoreBodyTransitions();

    if (state.completedZoom === 1) {
      // Fixed elements are broken when we apply a transformation, and it takes work for us to correct that, so we remove the transformation
      // from the body when possible
      body.style.transform = '';
    }

    // Un-Blur text in Chrome
    if (platform.browser.isChrome) {
      style.repaintToEnsureCrispText();
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
    cancelFrame();
    clearTimeout(minZoomChangeTimer);
    clearTimeout(zoomBeginTimer);
    cancelGlideChangeTimer();
    $origBody.off(ANIMATION_END_EVENTS, onGlideStopped);
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
    $origBody.css(style.getZoomCss(state.currentTargetZoom));
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
      state.currentTargetZoom = getMidAnimationZoom();
      finishZoomOperation();
      return;
    }

    // Stop key frames or element.animate
    zoomAnimator = requestFrame(function () {
      // Stop the key-frame animation at the current zoom level
      // Yes, it's crazy, but this sequence helps the zoom stop where it is supposed to, and not jump back a little
      $origBody.css({
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

  function chooseZoomStrategy() {
    zoomAnimator = requestFrame(performContinualZoomUpdates);
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
    $origBody = $(body);
    shouldUseElementDotAnimate = platform.browser.isChrome && body.animate;
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
    setThumbChangeListener: setThumbChangeListener,
    init: init
  };
});

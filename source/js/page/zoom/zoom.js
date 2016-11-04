/**
 * Smooth zoom
 * See docs at https://equinox.atlassian.net/wiki/display/EN/Smooth+Zoom
 */
define(
  [
    '$',
    'run/conf/preferences',
    'run/events',
    'run/modifier-key-state',
    'page/zoom/animation',
    'page/zoom/util/body-geometry',
    'page/zoom/state',
    'page/zoom/constants',
    'page/zoom/config/config',
    'page/zoom/util/restrict-zoom',
    'page/zoom/style',
    'page/viewport/scrollbars',
    'mini-core/native-global',
    'page/zoom/flash',
    'run/inline-style/inline-style'
  ],
  /*jshint -W072 */ //Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
  function (
    $,
    pref,
    events,
    modifierKeyState,
    animation,
    bodyGeo,
    state,
    constants,
    config,
    restrictZoom,
    style,
    scrollbars,
    nativeGlobal,
    flash,
    inlineStyle
  ) {
  /*jshint +W072 */
  'use strict';

  var isInitialized,  // Is the zoom module already initialized?
    isReady,        // Are the dependencies initialized
    $origBody, body,
    unpinchEndTimer,
    UNPINCH_FACTOR    = constants.UNPINCH_FACTOR,
    UNPINCH_END_DELAY = constants.UNPINCH_END_DELAY,
    MAX               = constants.MAX_ZOOM,
    MIN               = constants.MIN_ZOOM;

  // ------------------------ PUBLIC -----------------------------

  // Is this the zoom that occurs on page load?
  function getIsInitialZoom() {
    return state.isInitialLoadZoom;
  }

  function beginZoomIncrease(event, inputInfo) {
    // Increase up to max or until zoomStopRequested()
    animation.beginGlide(MAX, event, inputInfo);
  }

  function beginZoomDecrease(event, inputInfo) {
    animation.beginGlide(MIN, event, inputInfo);
  }

  function getCompletedZoom() {
    return state.completedZoom;
  }

  // Use to jump the current zoom immediately to the targetZoom requested
  // The use case for this is currently the zoom slider
  function jumpTo(targetZoom, inputInfo) {
    if (!animation.isZoomOperationRunning()) {
      // 1st call -- we will glide to it, it may be far away from previous zoom value
      animation.beginZoomOperation(targetZoom, $.extend({}, inputInfo, {isSlider: true })); // Get ready for more slider updates
      if (targetZoom !== state.completedZoom) {
        animation.performJsAnimateZoomOperation();
        animation.updateSlider();
      }
    } else {
      if (!state.zoomInput.isSliderDrag) {
        // 2nd call -- cancel glide and begin continual updates
        animation.cancelFrame();
        animation.cancelGlideChangeTimer();
        state.zoomInput.isSliderDrag = true;
        animation.chooseZoomStrategy();
      }
      // 3rd and subsequent calls, just update the target zoom value
      // so that the continual update loop uses the new value
      state.currentTargetZoom = restrictZoom.toValidRange(targetZoom); // Change target
    }
  }

  function resetZoom() {
    if (state.completedZoom > 1) {
      animation.beginZoomOperation(1, {});
      animation.performInstantZoomOperation();
      animation.finishZoomOperation();
    }
  }

  // We capture ctrl+wheel events because those are actually pinch/unpinch events
  function onMouseWheel(event) {
    if (!event.ctrlKey) {
      return;  // Not an unpinch event
    }

    event.preventDefault();

    function getWheelEventInputInfo() {
      return modifierKeyState.isCtrlKeyDown() ? { isCtrlWheel: true } : { isUnpinch: true };
    }

    var delta = -event.deltaY * UNPINCH_FACTOR,
      targetZoom = animation.isZoomOperationRunning() ? state.currentTargetZoom + delta : state.completedZoom + delta;

    clearTimeout(unpinchEndTimer);
    unpinchEndTimer = nativeGlobal.setTimeout(animation.finishZoomOperation, UNPINCH_END_DELAY);
    if (!animation.isZoomOperationRunning()) {
      // 1st call -- we will glide to it, it may be far away from previous zoom value
      animation.beginZoomOperation(targetZoom, getWheelEventInputInfo()); // Get ready for more slider updates
    }

    state.currentTargetZoom = restrictZoom.toValidRange(targetZoom); // Change target
    animation.performInstantZoomOperation();
  }

  function zoomStopRequested() {
    if (animation.isZoomOperationRunning()) {
      if (state.zoomInput.isSlider) {
        animation.finishZoomSliderOperation();
      }
      else {   // "A" button or +/- keypress
        animation.finishGlideIfEnough();
      }
    }
  }

  function performInitialLoadZoom(initialZoom) {
    var targetZoom = restrictZoom.toValidRange(initialZoom);

    if (targetZoom === 1) {
      return;
    }

    if (!isReady) {
      // Wait until <body> is ready
      // This can happen in the case of extension which loads very fast
      // In the future, extension may try to zoom sooner rather than waiting for entire document to load
      events.on('zoom/ready', function() { performInitialLoadZoom(targetZoom); }); // Zoom once badge is ready
      return;
    }

    state.isInitialLoadZoom = true;
    // TODO: This is only for CNIB, remove once we're done with Seth's presentation
    nativeFn.setTimeout(function () {
      animation.beginGlide(targetZoom);
    }, 750);
  }

  /**
   * Recompute the visible body size, and re-zoom the page as that handles the logic
   * to properly scale, resize, and position the page and its elements with respect to the current
   * sizes of the body and window.
   */
  function onResize() {
    if (!$origBody) {
      return;
    }
    inlineStyle.restore(body, ['width', 'transform']);
    bodyGeo.refreshOriginalBodyInfo();
    inlineStyle.override(body, style.getZoomCss(state.completedZoom));
    if (config.shouldRestrictWidth) {
      // Restrict the width of the body so that it works similar to browser zoom
      // Documents designed to fit the width of the page still will
      inlineStyle.override(body, {
        width : bodyGeo.getRestrictedBodyWidth(state.completedZoom)
      });
    }
    bodyGeo.invalidateBodyInfo();
    // TODO computeBodyInfo() is doing a lot of work that refreshBodyInfo() did -- at least it should share which nodes to iterate over
    scrollbars.onBodyRectChange();
    events.emit('resize');
  }

  function bodyGeometryInitialized(wheelEvent) {
    scrollbars.init();
    style.init();
    animation.init();
    flash.init();

    //This callback will only be called when body is parsed
    body  = document.body;
    $origBody = $(body);

    // Use pref module for sharing current zoom level value
    pref.defineHandler('zoom', restrictZoom.toValidRange);

    // ATKratter wouldn't scroll when we listened to this on the window
    document.addEventListener('wheel', onMouseWheel);  // Ctrl+wheel = unpinch

    if (typeof config.isFluid === 'undefined') {
      config.isFluid = bodyGeo.isFluidLayout();
    }

    $(window).on('resize', onResize);

    style.fixZoomBodyCss(); // Get it read as soon as zoom might be used

    if (wheelEvent) {
      onMouseWheel(wheelEvent);
    }

    isReady = true;
    events.emit('zoom/ready');
  }

  function init(wheelEvent) {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    config.init();
    bodyGeo.init(function() {
      bodyGeometryInitialized(wheelEvent);
    });
  }

  return {
    getIsInitialZoom: getIsInitialZoom,
    jumpTo: jumpTo,
    beginZoomIncrease: beginZoomIncrease,
    beginZoomDecrease: beginZoomDecrease,
    getCompletedZoom: getCompletedZoom,
    resetZoom: resetZoom,
    zoomStopRequested: zoomStopRequested,
    performInitialLoadZoom: performInitialLoadZoom,
    init: init
  };
});

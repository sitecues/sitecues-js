/*
 Slider Controller
 */
define(
  [
    'core/bp/constants',
    'page/zoom/constants',
    'core/bp/helper',
    'core/platform',
    'core/bp/model/state',
    'bp-expanded/view/slider',
    'page/zoom/zoom',
    'page/zoom/animation',
    'core/events',
    'core/dom-events'
  ],
  function (
    BP_CONST,
    ZOOM_CONST,
    helper,
    platform,
    state,
    sliderView,
    zoomMod,
    animation,
    events,
    domEvents
  ) {
  'use strict';

  var
    isListeningToWindowMouseMoveEvents,
    isListeningToWindowMouseUpEvents,
    isInitialized;

    /**
   * Mouse is been pressed down on the slider:
   * If the slider is ready for input, begin sending zoom new values for every mouse move.
   */
  function initialMouseDown(evt) {
    if (!state.isPanel()) {
      return; // Panel not ready for input
    }

    moveThumb(evt);

    addWindowMouseMoveListener();
    addWindowMouseUpListener();
  }

  function addWindowMouseMoveListener() {
    if (!isListeningToWindowMouseMoveEvents) {
      isListeningToWindowMouseMoveEvents = true;
      // Be a capturing listener so that we get events before any especially "creative" page scripts
      domEvents.on(window, 'mousemove', moveThumb, { passive: false });
    }
  }

  function addWindowMouseUpListener() {
    if (!isListeningToWindowMouseUpEvents) {
      isListeningToWindowMouseUpEvents = true;
      domEvents.on(window, 'mouseup', finishZoomChanges, { passive : false });
    }
  }


  function removeWindowMouseListeners() {
    if (isListeningToWindowMouseMoveEvents) {
      domEvents.off(window, 'mousemove', moveThumb, { passive: false });
      isListeningToWindowMouseMoveEvents = false;
    }

    if (isListeningToWindowMouseMoveEvents) {
      domEvents.off(window, 'mouseup', finishZoomChanges, { passive : false });
      isListeningToWindowMouseUpEvents = false;
    }
  }

  // Mouse button was pressed down over slider and mouse cursor has moved
  function moveThumb(evt) {
    var
      sliderThumbRect = helper.getRectById(BP_CONST.ZOOM_SLIDER_THUMB_ID),
      sliderRect      = helper.getRectById(BP_CONST.ZOOM_SLIDER_BAR_ID),
      panelLeft       = helper.getRectById(BP_CONST.BP_CONTAINER_ID).left,

      // TODO Need comments what the browser differences are
      sliderLeft      = platform.browser.isWebKit ? sliderRect.left + sliderThumbRect.width / 2 : panelLeft + BP_CONST.FIREFOX_SLIDER_OFFSET,
      sliderWidth     = sliderRect.width - sliderThumbRect.width,
      newPercent      = (evt.clientX - sliderLeft) / sliderWidth;

    var newValue        = (newPercent * ZOOM_CONST.ZOOM_RANGE) + ZOOM_CONST.MIN_ZOOM;
    zoomMod.jumpTo(newValue, { isFirstBadgeUse : isFirstBadgeUse() });

    evt.preventDefault();
  }

  function isFirstBadgeUse() {
    return state.get('isFirstBadgeUse');
  }

  /**
   * Handler when click on small or large A.
   */
  function handleAButtonsPress(evt) {
    var target = helper.getEventTarget(evt),
        isDecrease   = (target.id === BP_CONST.SMALL_A_ID);

    addWindowMouseUpListener();

    var changeFn = isDecrease ? zoomMod.beginZoomDecrease : zoomMod.beginZoomIncrease;
    changeFn(evt, { isFirstBadgeUse : isFirstBadgeUse() });
  }

  function finishZoomChanges() {
    zoomMod.zoomStopRequested();
    removeWindowMouseListeners();
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    // Init zoom, add permanent listeners
    zoomMod.init();
    sliderView.render(zoomMod.getCompletedZoom());
    animation.setThumbChangeListener(sliderView.updateThumbPosition);

    // Zoom controls
    var sliderTarget = helper.byId(BP_CONST.ZOOM_SLIDER_ID),
        sliderThumb  = helper.byId(BP_CONST.ZOOM_SLIDER_THUMB_ID),
        smallA       = helper.byId(BP_CONST.SMALL_A_ID),
        largeA       = helper.byId(BP_CONST.LARGE_A_ID),
        zoomLabel    = helper.byId(BP_CONST.ZOOM_LABEL_ID);

    domEvents.on(sliderTarget, 'mousedown', initialMouseDown, { passive : false });
    domEvents.on(sliderThumb, 'mousedown', initialMouseDown, { passive : false });
    domEvents.on(smallA, 'mousedown', handleAButtonsPress);
    domEvents.on(largeA, 'mousedown', handleAButtonsPress);
    domEvents.on(zoomLabel, 'mousedown', handleAButtonsPress);

    events.on('bp/will-shrink', finishZoomChanges);

    // A zoom operation has been completed
    // (We don't move the thumb here ... we do via setThumbChangeListener, because we get mid-animation changes that way)
    events.on('zoom', sliderView.updateZoomValue);
  }

  return {
    init: init
  };
});
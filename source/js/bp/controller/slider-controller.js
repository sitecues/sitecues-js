/*
 Slider Controller
 */
define(['bp/constants', 'bp/helper', 'util/platform', 'zoom/zoom', 'bp/model/state', 'bp/view/elements/slider'],
  function (BP_CONST, helper, platform, zoomMod, state, sliderView) {

  'use strict';

  var isListeningToWindowMouseEvents;

  /**
   * Mouse is been pressed down on the slider:
   * If the slider is ready for input, begin sending zoom new values for every mouse move.
   */
  function initialMouseDown(evt) {

    if (!state.isPanel()) {
      return; // Panel not ready for input
    }

    moveThumb(evt);

    addWindowMouseMoveListeners();
  }

  function addWindowMouseMoveListeners() {

    if (!isListeningToWindowMouseEvents) {
      isListeningToWindowMouseEvents = true;
      window.addEventListener('mousemove', moveThumb);
      window.addEventListener('mouseup', finishZoomChanges);
    }
  }

  function removeWindowMouseMoveListeners() {
    if (isListeningToWindowMouseEvents) {
      window.removeEventListener('mousemove', moveThumb);
      isListeningToWindowMouseEvents = false;
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
      newPercent      = (evt.clientX - sliderLeft) / sliderWidth,
      newValue        = (newPercent * zoomMod.RANGE) + zoomMod.RANGE;

    zoomMod.jumpTo(newValue);

    evt.preventDefault();

  }

  /**
   * Handler when click on small or large A.
   */
  function handleAButtonsPress(evt) {

    var target = helper.getEventTarget(evt),
        type   = (target.id === BP_CONST.SMALL_A_ID) ? 'decrease' : 'increase';

    window.addEventListener('mouseup', finishZoomChanges);

    sitecues.emit('zoom/' + type, evt);
  }

  function finishZoomChanges() {
    sitecues.emit('zoom/stop');
    removeWindowMouseMoveListeners();
  }

  function init() {
    sliderView.render();

    // Add permanent listeners
    zoomMod.setThumbChangeListener(sliderView.updateThumbPosition);

    // Zoom controls
    var sliderTarget = helper.byId(BP_CONST.ZOOM_SLIDER_ID),
        sliderThumb  = helper.byId(BP_CONST.ZOOM_SLIDER_THUMB_ID),
        smallA       = helper.byId(BP_CONST.SMALL_A_ID),
        largeA       = helper.byId(BP_CONST.LARGE_A_ID),
        zoomLabel    = helper.byId(BP_CONST.ZOOM_LABEL_ID);

    sliderTarget.addEventListener('mousedown', initialMouseDown);
    sliderThumb.addEventListener('mousedown', initialMouseDown);
    smallA.addEventListener('mousedown', handleAButtonsPress);
    largeA.addEventListener('mousedown', handleAButtonsPress);
    zoomLabel.addEventListener('mousedown', handleAButtonsPress);
  }

  // Add mouse listeners once BP is ready
  sitecues.on('bp/did-complete', init);
  sitecues.on('bp/will-shrink', finishZoomChanges);

  // A zoom operation has been completed
  // (We don't move the thumb here ... we do via setThumbChangeListener, because we get mid-animation changes that way)
  sitecues.on('zoom', sliderView.updateZoomValue);

  // As soon as any real zooming occurs, switch to displaying the correct thumb position
  // (The fake settings are only used for someone who has never used sitecues before)
  sitecues.on('zoom/begin', sliderView.enableRealSettings);
});
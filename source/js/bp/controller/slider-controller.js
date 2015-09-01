/*
 Slider Controller
 */
define(['bp/constants', 'bp/helper', 'util/platform', 'bp/model/state', 'bp/view/elements/slider'],
  function (BP_CONST, helper, platform, state, sliderView) {

  var isListeningToWindowMouseEvents,
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
      ZOOM_RANGE      = 2,
      newValue        = (newPercent * ZOOM_RANGE) + ZOOM_RANGE;

    require(['zoom/zoom'], function(zoomMod) {
      zoomMod.init(true);
      zoomMod.jumpTo(newValue);
    });

    evt.preventDefault();

  }

  /**
   * Handler when click on small or large A.
   */
  function handleAButtonsPress(evt) {

    var target = helper.getEventTarget(evt),
        isDecrease   = (target.id === BP_CONST.SMALL_A_ID);

    window.addEventListener('mouseup', finishZoomChanges);

    require(['zoom/zoom'], function(zoomMod) {
      zoomMod.init(true);
      isDecrease ? zoomMod.beginZoomDecrease() : beginZoomIncrease();
    });

  }

  function finishZoomChanges() {
    require(['zoom/zoom'], function(zoomMod) {
      zoomMod.zoomStopRequested();
    });
    removeWindowMouseMoveListeners();
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    // Add permanent listeners
    require(['zoom/zoom'], function(zoomMod) {
      sliderView.render(zoomMod.getCompletedZoom());
      zoomMod.setThumbChangeListener(sliderView.updateThumbPosition);
    });

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

    sitecues.on('bp/will-shrink', finishZoomChanges);

    // A zoom operation has been completed
    // (We don't move the thumb here ... we do via setThumbChangeListener, because we get mid-animation changes that way)
    sitecues.on('zoom', sliderView.updateZoomValue);
  }

  return {
    init: init
  };
});

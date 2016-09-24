// This module does two things:
// 1. Request zoom changes after processing user input
// 2. Listen for thumb change callbacks and repositions the thumb based on that
//
// --------------     Request zoom changes       ---------------      Thumb change callback    ---------------------
// | User input |   ---------------------->      | Zoom module |     ---------------------->   |  Update thumb pos |
// --------------                                ---------------                               ---------------------
//
// The thumb position only changes based on the thumb change callback!!
// Effectively this means the zoom module needs is in control of the thumb position.

define(
  [
    'core/bp/constants',
    'core/bp/model/state',
    'core/bp/helper',
    'core/locale'
  ],
  function (
    BP_CONST,
    state,
    helper,
    locale
  ) {
  'use strict';

  /*
   *** Public methods ***
   */

  /**
   * Reposition the zoom slider thumb on badge-panel state change or thumb change callback.
   * This does not change the current zoom of the page -- it only changes the slider appearance.
   */
  function updateThumbPosition(currZoom) {
    var thumbId = BP_CONST.ZOOM_SLIDER_THUMB_ID,
      thumbElement = helper.byId(thumbId),
      panelSliderWidth = BP_CONST.TRANSFORMS.PANEL[thumbId].translateX,
      badgeSliderWidth = BP_CONST.TRANSFORMS.BADGE[thumbId].translateX,
      isPanel = state.isPanel(),
      MIN_ZOOM = 1,
      ZOOM_RANGE = 2,

      // Use a fake zoom amount the first time sitecues loads for badge view
      // It just looks better -- making the slider look more interactive.
      percent = (currZoom - MIN_ZOOM) / ZOOM_RANGE,
      sliderWidth = isPanel ? BP_CONST.LARGE_SLIDER_WIDTH : BP_CONST.SMALL_SLIDER_WIDTH,
      offset = (percent * sliderWidth) + (isPanel ? panelSliderWidth : badgeSliderWidth);

    thumbElement.setAttribute('transform', 'translate(' + offset + ')');
  }

  // Update the slider thumb position on bp view updates because the entire slider changes size
  // (it scales more horizontally than vertically)
  function render(zoomLevel) {
    updateThumbPosition(zoomLevel);
    updateZoomValue(zoomLevel);
  }

  /*
    Display new zoom value.
   */
  function updateZoomValue(currZoom) {
    // 1. Set aria-valuenow for screen readers
    // We do this when zoom is finished so that the screen reader is not trying to read every
    // new value during an animation which would be way too verbose
    var sliderElement = helper.byId(BP_CONST.ZOOM_SLIDER_BAR_ID),
        roundedZoom   = currZoom ? Math.floor((currZoom + 0.0999) * 10) / 10 : 1,
        zoomText      = getLocalizedZoomValue(roundedZoom);

    sliderElement.setAttribute('aria-valuenow', roundedZoom ? roundedZoom.toString() : 1);
    sliderElement.setAttribute('aria-valuetext', zoomText);

    // 2. Update the zoom label, which follows pattern "1.3x" (or just "Zoom off" for 1x)
    function setZoomLabel(text) {
      helper.byId(BP_CONST.ZOOM_VALUE_ID).firstChild.data = text;
    }

    setZoomLabel(zoomText);
  }

  /*
   *** Private functions ***
   */

  function getLocalizedZoomValue(currZoom) {
    if (currZoom === 1) {
      // Zoom off
      return locale.translate(BP_CONST.ZOOM_STATE_LABELS.ZOOM_OFF);
    }

    // 1.3x, etc.
    var preZoomText = locale.translate(BP_CONST.ZOOM_STATE_LABELS.PRE_ZOOM),
      postZoomText  = locale.translate(BP_CONST.ZOOM_STATE_LABELS.POST_ZOOM);
    return preZoomText + locale.translateNumber(currZoom, 2) + postZoomText;
  }

  return {
    updateThumbPosition: updateThumbPosition,
    render: render,
    updateZoomValue: updateZoomValue
  };
});

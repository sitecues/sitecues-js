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

sitecues.def('bp/view/elements/slider', function (slider, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/controller/slider-controller', 'zoom', 'bp/helper', 'util/localization',
    function (BP_CONST, state, sliderController, zoomMod, helper, locale) {

    /*
     *** Public methods ***
     */

    /**
     * Reposition the zoom slider thumb on badge-panel state change or thumb change callback.
     * This does not change the current zoom of the page -- it only changes the slider appearance.
     */
    slider.updateThumbPosition = function(currZoom) {
      var thumbId          = BP_CONST.ZOOM_SLIDER_THUMB_ID,
          thumbElement     = helper.byId(thumbId),
          panelSliderWidth = BP_CONST.TRANSFORMS.PANEL[thumbId].translateX,
          badgeSliderWidth = BP_CONST.TRANSFORMS.BADGE[thumbId].translateX,
          isPanel          = state.isPanel(),

          // Use a fake zoom amount the first time sitecues loads for badge view
          // It just looks better -- making the slider look more interactive.
          useZoom     = state.get('isRealSettings') ? currZoom : BP_CONST.FAKE_ZOOM_AMOUNT,
          percent     = (useZoom - zoomMod.min) / zoomMod.range,
          sliderWidth = isPanel ? BP_CONST.LARGE_SLIDER_WIDTH : BP_CONST.SMALL_SLIDER_WIDTH,
          offset      = (percent * sliderWidth) + (isPanel ? panelSliderWidth : badgeSliderWidth);

      thumbElement.setAttribute('transform', 'translate(' + offset + ')');

    };

    // Update the slider thumb position on bp view updates because the entire slider changes size
    // (it scales more horizontally than vertically)
    slider.renderView = function() {
      slider.updateThumbPosition(zoomMod.getCompletedZoom());
    };

    /*
     *** Private functions ***
     */

    function doUseRealSettings() {
      state.set('isRealSettings', true);
    }

    function getLocalizedZoomValue(currZoom) {
      if (currZoom === 1) {
        // Zoom off
        return locale.translate(BP_CONST.ZOOM_STATE_LABELS.ZOOM_OFF);
      }

      // 1.3x, etc.
      var preZoomText = locale.translate(BP_CONST.ZOOM_STATE_LABELS.PRE_ZOOM),
        postZoomText = locale.translate(BP_CONST.ZOOM_STATE_LABELS.POST_ZOOM);
      return preZoomText + locale.translateNumber(currZoom, 2) + postZoomText;
    }

    /*
      Display new zoom value.
     */
    function updateZoomValueView(currZoom) {
      // 1. Set aria-valuenow for screen readers
      // We do this when zoom is finished so that the screen reader is not trying to read every
      // new value during an animation which would be way too verbose
      var sliderElement = helper.byId(BP_CONST.ZOOM_SLIDER_BAR_ID),
          roundedZoom = currZoom ? Math.floor((currZoom + 0.0999) * 10) / 10 : 1,
          zoomText      = getLocalizedZoomValue(roundedZoom);

      sliderElement.setAttribute('aria-valuenow', roundedZoom ? roundedZoom.toString() : 1);
      sliderElement.setAttribute('aria-valuetext', zoomText);

      // 2. Update the zoom label, which follows pattern "1.3x" (or just "Zoom off" for 1x)
      function setZoomLabel(text) {
        helper.byId(BP_CONST.ZOOM_VALUE_ID).firstChild.data = text;
      }

      setZoomLabel(zoomText);
    }

    function addListeners() {
      zoomMod.setThumbChangeListener(slider.updateThumbPosition);

      // Zoom controls
      var sliderTarget = helper.byId(BP_CONST.ZOOM_SLIDER_ID),
          sliderThumb  = helper.byId(BP_CONST.ZOOM_SLIDER_THUMB_ID),
          smallA       = helper.byId(BP_CONST.SMALL_A_ID),
          largeA       = helper.byId(BP_CONST.LARGE_A_ID),
          zoomLabel    = helper.byId(BP_CONST.ZOOM_LABEL_ID);

      sliderTarget.addEventListener('mousedown', sliderController.addSliderListeners);
      sliderThumb.addEventListener('mousedown', sliderController.addSliderListeners);
      smallA.addEventListener('mousedown', sliderController.handleAButtonsPress);
      largeA.addEventListener('mousedown', sliderController.handleAButtonsPress);
      zoomLabel.addEventListener('mousedown', sliderController.handleAButtonsPress);
    }

    // A zoom operation has been completed
    // (We don't move the thumb here ... we do via setThumbChangeListener, because we get mid-animation changes that way)
    sitecues.on('zoom bp/did-complete', updateZoomValueView);

    // As soon as any real zooming occurs, switch to displaying the correct thumb position
    // (The fake settings are only used for someone who has never used sitecues before)
    sitecues.on('zoom/begin', doUseRealSettings);

    // Add mouse listeners once BP is ready
    sitecues.on('bp/did-complete', addListeners);

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});
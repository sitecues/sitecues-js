/*
 Slider Controller
 */
sitecues.def('bp/controller/slider-controller', function (sc, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', 'zoom', 'bp/model/state', function (BP_CONST, helper, zoomMod, state) {

    /**
     * Mouse is been pressed down on the slider:
     * If the slider is ready for input, begin sending zoom new values for every mouse move.
     */
    sc.addSliderListeners = function(evt) {

      if (!state.isPanel()) {
        return; // Panel not ready for input
      }

      window.addEventListener('mousemove', sc.moveThumb);
      window.addEventListener('mouseup',   sc.finishZoomChanges);

      sc.moveThumb(evt);

    };

    // Mouse button was pressed down over slider and mouse cursor has moved
    sc.moveThumb = function(evt) {

      var
        sliderThumbRect = helper.getRectById(BP_CONST.ZOOM_SLIDER_THUMB_ID),
        sliderRect      = helper.getRectById(BP_CONST.ZOOM_SLIDER_BAR_ID),
        panelLeft       = helper.getRectById(BP_CONST.BP_CONTAINER_ID).left,

        // TODO Need comments what the browser differences are
        sliderLeft      = helper.isWebkit ? sliderRect.left + sliderThumbRect.width / 2 : panelLeft + BP_CONST.FIREFOX_SLIDER_OFFSET,
        sliderWidth     = sliderRect.width - sliderThumbRect.width,
        newPercent      = (evt.clientX - sliderLeft) / sliderWidth,
        newValue        = (newPercent * zoomMod.range) + zoomMod.min;

      zoomMod.jumpTo(newValue);

      evt.preventDefault();

    };

    /**
     * Handler when click on small or large A.
     */
    sc.handleAButtonsPress = function(evt) {

      var target = evt.target.correspondingUseElement || evt.target,
          type   = (target.id === BP_CONST.SMALL_A_ID) ? 'decrease' : 'increase';

      window.addEventListener('mouseup', sc.finishZoomChanges);

      sitecues.emit('zoom/' + type, evt);
    };

    sc.finishZoomChanges = function() {
      sitecues.emit('zoom/stop');
      window.removeEventListener('mousemove', sc.moveThumb);
    };

    // Unless callback() is queued, the module is not registered in global var modules{}
      // See: https://fecru.ai2.at/cru/EQJS-39#c187
      //      https://equinox.atlassian.net/browse/EQ-355
      callback();
    });

});
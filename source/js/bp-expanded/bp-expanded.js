define([
    'bp-expanded/controller/slider-controller',
    'bp-expanded/controller/shrink-controller',
    'bp-expanded/controller/focus-controller',
    'bp-expanded/controller/scroll-prevention',
    'bp-expanded/view/tts-button',
    'bp-expanded/view/more-button',
    'bp-expanded/view/transform-util',
    'core/bp/helper',
    'core/bp/constants',
    'core/bp/model/state'
  ],
  function (sliderController,
            shrinkController,
            focusController,
            scrollPrevention,
            ttsButton,
            moreButton,
            transform,
            helper,
            BP_CONST,
            state) {

    var isInitialized;

    function getFocusController() {
      return focusController;
    }

    function init() {
      if (!isInitialized) {
        state.set('scale', transform.getStyleTransformMap(helper.byId(BP_CONST.BP_CONTAINER_ID)).scale);
        sliderController.init();
        shrinkController.init();
        focusController.init();
        ttsButton.init();
        moreButton.init();
        scrollPrevention.init();
        require(['page/cursor/cursor'], function(cursor) {
          cursor.init();
        });
      }
      isInitialized = true;
    }

    return {
      init: init,
      getFocusController: getFocusController
    };
  });

define(['bp-expanded/controller/slider-controller', 'bp-expanded/controller/shrink-controller', 'bp-expanded/controller/focus-controller',
  'bp-expanded/view/tts-button', 'bp-expanded/view/more-button', 'bp-expanded/view/transform-util', 'bp/helper', 'bp/constants', 'bp/model/state'],
  function (sliderController, shrinkController, focusController, ttsButton, moreButton, transform, helper, BP_CONST, state) {

  var isInitialized;

  function getFocusController() {
    return focusController;
  }

  function init() {
    if (!isInitialized) {
      state.set('scale', transform.getStyleTransform(helper.byId(BP_CONST.BP_CONTAINER_ID)).scale);
      sliderController.init();
      shrinkController.init();
      focusController.init();
      ttsButton.init();
      moreButton.init();
      require(['cursor/cursor'], function(cursor) {
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

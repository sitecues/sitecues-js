define(['bp-expanded/controller/slider-controller', 'bp-expanded/controller/shrink-controller', 'bp-expanded/controller/focus-controller',
  'bp-expanded/view/tts-button', 'bp-expanded/view/more-button'],
  function (sliderController, shrinkController, focusController, ttsButton, moreButton) {

  var isInitialized;

  function getFocusController() {
    return focusController;
  }

  function init() {
    if (!isInitialized) {
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

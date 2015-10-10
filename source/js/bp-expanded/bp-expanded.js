define(['bp-expanded/controller/slider-controller', 'bp-expanded/controller/shrink-controller', 'bp-expanded/controller/focus-controller',
  'bp-expanded/view/tts-button', 'bp-expanded/view/more-button', 'bp-expanded/view/transform-util', 'bp/helper', 'bp/constants'],
  function (sliderController, shrinkController, focusController, ttsButton, moreButton, transform, helper, BP_CONST) {

  var isInitialized;

  function getFocusController() {
    return focusController;
  }

  /**
   * Return the amount of transform scale applied to <scp-bp-container>
   */
  function getBpContainerScale() {
    return transform.getStyleTransform(helper.byId(BP_CONST.BP_CONTAINER_ID)).scale;
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
    getBpContainerScale: getBpContainerScale,
    getFocusController: getFocusController
  };
});

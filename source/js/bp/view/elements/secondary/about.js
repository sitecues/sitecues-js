sitecues.def('bp/view/elements/about', function (about, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', 'util/transform', function (BP_CONST, helper, transform) {

    var byId = helper.byId;

    function getAboutImage() {
      return byId(BP_CONST.ABOUT_CONTENT_IMAGE_ID);
    }

    function getValueInTime(from, to, time) {
      return from + (to - from) * time;
    }

    about.getGeometryTargets = function(cssValues) {
      // Which additional animations
      cssValues[false].menuImageTranslateX   = 0;   // About logo transitions to the left following the rolling icon

      cssValues[true].menuBtnTranslateX      = 175; // The about icon, which rolls to the left
      cssValues[true].menuBtnTranslateY      = BP_CONST.TRANSFORMS[BP_CONST.ABOUT_BUTTON_ID].translateY; // The about icon
      cssValues[true].menuBtnScale           = 1;    // About icon scales to 1
      cssValues[true].menuBtnRotate          = -360; // Roll the about icon
      cssValues[true].menuImageTranslateX    = -500;
      return cssValues;
    };

    // Custom animation of feature
    about.tick = function(t, targetCSSValues) {
      var aboutImage = getAboutImage(),
        newTransformString =
          transform.getTransformString(getValueInTime(0, targetCSSValues.menuImageTranslateX, t), 0);
      aboutImage.setAttribute('transform', newTransformString);
    };

    callback();

  });
});

sitecues.def('bp/view/elements/about', function (about, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    var byId = helper.byId;

    function onToggle(isActive) {
    }

    about.extendCssValues = function(cssValues) {
      cssValues[true].menuBtnTranslateX    = 175; // The about icon, which rolls to the left
      cssValues[true].menuBtnTranslateY    = BP_CONST.TRANSFORMS[BP_CONST.ABOUT_BUTTON_ID].translateY; // The about icon
      cssValues[true].menuBtnScale         = 1;    // About icon scales to 1
      cssValues[true].menuBtnRotate        = -360; // Roll the about icon
      cssValues[true].menuBtnRotateX       = 54;   // A way to rotate around an origin
      cssValues[true].menuBtnRotateY       = 54;   // A way to rotate around an origin
      cssValues[true].menuImageTranslateX  = -500;

      return cssValues;
    };


    sitecues.on('bp/did-toggle-about', onToggle);

    callback();

  });
});

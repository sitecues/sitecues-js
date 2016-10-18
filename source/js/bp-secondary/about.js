define(['run/bp/constants', 'run/bp/helper', 'run/conf/urls'], function (BP_CONST, helper, urls) {
  var byId = helper.byId,
    isInitialized;

  function loadImage() {
    byId('scp-sitecues-text').setAttributeNS('http://www.w3.org/1999/xlink', 'href', urls.resolveResourceUrl('images/sitecues-logo-text.svg'));
  }

  function getGeometryTargets(cssValues) {
    // Which additional animations
    cssValues[false].menuImageTranslateX   = 0;   // About logo transitions to the left following the rolling icon

    cssValues[true].menuBtnTranslateX      = 175; // The about icon, which rolls to the left
    cssValues[true].menuBtnTranslateY      = BP_CONST.TRANSFORMS[BP_CONST.ABOUT_BUTTON_ID].translateY; // The about icon
    cssValues[true].menuBtnScale           = 1;    // About icon scales to 1
    cssValues[true].menuBtnRotate          = -359.5; // Roll the about icon counter-clockwise
    cssValues[true].menuImageTranslateX    = -500;
    return cssValues;
  }

  function init() {
    if (!isInitialized) {
      isInitialized = true;
      loadImage();
      byId('scp-about-rate-button').addEventListener('click', function() {
        require(['bp-secondary/bp-secondary'], function(secondaryPanel) {
          secondaryPanel.toggleFeature('feedback');
        });
      });
    }
  }

  return {
    getGeometryTargets: getGeometryTargets,
    init: init
  };

});
